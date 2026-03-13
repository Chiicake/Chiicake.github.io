from __future__ import annotations

import argparse
import importlib
import json
import re
import subprocess
import sys
import unicodedata
from datetime import date
from functools import cmp_to_key
from pathlib import Path
from typing import Any, NamedTuple


ROOT_DIR = Path(__file__).resolve().parents[1]
BLOG_ROOT_DIR = ROOT_DIR / "public" / "blog"
BLOG_INDEX_PATH = BLOG_ROOT_DIR / "index.json"
QUESTIONARY_SPEC = "questionary>=2.1,<3"

CREATE_OPTION = "__create__"
NONE_OPTION = "__none__"
NEW_TAG_OPTION = "新建"
FRONTMATTER_PATTERN = re.compile(r"\A---\s*\n[\s\S]*?\n---\s*\n?")
MARKDOWN_IMAGE_PATTERN = re.compile(r"!\[(?P<alt>[^\]]*)\]\((?P<target>[^)\n]+)\)")
HTML_IMAGE_PATTERN = re.compile(
    r"(?P<prefix><img\b[^>]*?\bsrc=(?P<quote>[\"']))(?P<url>[^\"']+)(?P=quote)",
    re.IGNORECASE,
)
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class AssetCopyPlan(NamedTuple):
    source_path: Path
    target_name: str


class FileTransaction:
    def __init__(self) -> None:
        self._backups: dict[Path, bytes | None] = {}
        self._created_dirs: list[Path] = []
        self._committed = False

    def _remember_original(self, path: Path) -> None:
        if path in self._backups:
            return
        self._backups[path] = path.read_bytes() if path.exists() else None

    def mkdir(self, path: Path) -> None:
        if path.exists():
            return
        path.mkdir(parents=True, exist_ok=True)
        self._created_dirs.append(path)

    def _ensure_parent(self, path: Path) -> None:
        current = path.parent
        missing: list[Path] = []
        while not current.exists():
            missing.append(current)
            current = current.parent
        for directory in reversed(missing):
            self.mkdir(directory)

    def write_text(self, path: Path, content: str, encoding: str = "utf-8") -> None:
        self._ensure_parent(path)
        self._remember_original(path)
        path.write_text(content, encoding=encoding)

    def write_bytes(self, path: Path, content: bytes) -> None:
        self._ensure_parent(path)
        self._remember_original(path)
        path.write_bytes(content)

    def commit(self) -> None:
        self._committed = True
        self._backups.clear()
        self._created_dirs.clear()

    def rollback(self) -> None:
        if self._committed:
            return

        for path, original in reversed(list(self._backups.items())):
            if original is None:
                if path.exists():
                    path.unlink()
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(original)

        for directory in sorted(self._created_dirs, key=lambda item: len(item.parts), reverse=True):
            if directory.exists():
                try:
                    directory.rmdir()
                except OSError:
                    pass

        self._backups.clear()
        self._created_dirs.clear()


class QuestionaryPrompter:
    def __init__(self) -> None:
        questionary, choice_type = ensure_questionary()
        self._questionary = questionary
        self._choice_type = choice_type

    def _unwrap(self, value: Any) -> Any:
        if value is None:
            raise KeyboardInterrupt
        return value

    def text(self, message: str, default: str = "") -> str:
        prompt = self._questionary.text(message, default=default)
        return str(self._unwrap(prompt.ask()))

    def select(self, message: str, choices: list[tuple[str, str]]) -> str:
        prompt = self._questionary.select(
            message,
            choices=[self._choice_type(title=title, value=value) for title, value in choices],
        )
        return str(self._unwrap(prompt.ask()))

    def checkbox(self, message: str, choices: list[tuple[str, str]]) -> list[str]:
        prompt = self._questionary.checkbox(
            message,
            choices=[self._choice_type(title=title, value=value) for title, value in choices],
        )
        result = self._unwrap(prompt.ask())
        return [str(item) for item in result]


def slugify_english_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    lowered = normalized.lower().strip()
    lowered = re.sub(r"\s+", "-", lowered)
    lowered = re.sub(r"[^a-z0-9-]", "", lowered)
    lowered = re.sub(r"-{2,}", "-", lowered)
    return lowered.strip("-")


def ensure_questionary():
    try:
        questionary = importlib.import_module("questionary")
        return questionary, getattr(questionary, "Choice")
    except ImportError:
        print("未检测到 questionary，正在自动安装...", file=sys.stderr)
        result = subprocess.run([sys.executable, "-m", "pip", "install", QUESTIONARY_SPEC], check=False)
        if result.returncode != 0:
            raise RuntimeError(f"自动安装依赖失败，请手动执行: {sys.executable} -m pip install {QUESTIONARY_SPEC}")

        questionary = importlib.import_module("questionary")
        return questionary, getattr(questionary, "Choice")


def assert_valid_slug(slug: str) -> None:
    if not SLUG_PATTERN.fullmatch(slug):
        raise ValueError("slug 只能包含小写字母、数字和连字符")


def strip_frontmatter(markdown: str) -> str:
    return FRONTMATTER_PATTERN.sub("", markdown, count=1).lstrip()


def build_markdown_document(markdown: str, title: str) -> str:
    body = strip_frontmatter(markdown)
    body = body.rstrip() + "\n"
    return f"---\ntitle: {title}\n---\n\n{body}"


def split_markdown_target(target: str) -> tuple[str, str, bool]:
    trimmed = target.strip()
    if trimmed.startswith("<"):
        end = trimmed.find(">")
        if end != -1:
            return trimmed[1:end], trimmed[end + 1 :], True

    if not trimmed:
        return "", "", False

    match = re.match(r"(?P<path>\S+)(?P<suffix>.*)", trimmed)
    if match is None:
        return trimmed, "", False
    return match.group("path"), match.group("suffix"), False


def is_local_asset_reference(raw_path: str) -> bool:
    lowered = raw_path.lower().strip()
    if not lowered:
        return False
    return not (
        lowered.startswith("http://")
        or lowered.startswith("https://")
        or lowered.startswith("data:")
        or lowered.startswith("mailto:")
        or lowered.startswith("#")
        or lowered.startswith("/")
    )


def allocate_asset_name(filename: str, used_names: set[str]) -> str:
    candidate = filename
    stem = Path(filename).stem
    suffix = Path(filename).suffix
    counter = 2
    while candidate in used_names:
        candidate = f"{stem}-{counter}{suffix}"
        counter += 1
    used_names.add(candidate)
    return candidate


def rewrite_markdown_assets(markdown: str, markdown_dir: Path) -> tuple[str, list[AssetCopyPlan]]:
    source_to_target: dict[Path, str] = {}
    used_names: set[str] = set()
    assets: list[AssetCopyPlan] = []

    def register_asset(raw_path: str) -> str | None:
        if not is_local_asset_reference(raw_path):
            return None

        source_path = (markdown_dir / raw_path).resolve()
        if not source_path.exists() or not source_path.is_file():
            raise FileNotFoundError(f"图片不存在: {raw_path}")

        if source_path not in source_to_target:
            target_name = allocate_asset_name(source_path.name, used_names)
            source_to_target[source_path] = target_name
            assets.append(AssetCopyPlan(source_path=source_path, target_name=target_name))

        return f"./assets/{source_to_target[source_path]}"

    def replace_markdown(match: re.Match[str]) -> str:
        raw_target = match.group("target")
        raw_path, suffix, wrapped = split_markdown_target(raw_target)
        replacement = register_asset(raw_path)
        if replacement is None:
            return match.group(0)
        rendered_target = f"<{replacement}>{suffix}" if wrapped else f"{replacement}{suffix}"
        return f"![{match.group('alt')}]({rendered_target})"

    def replace_html(match: re.Match[str]) -> str:
        raw_path = match.group("url")
        replacement = register_asset(raw_path)
        if replacement is None:
            return match.group(0)
        return f"{match.group('prefix')}{replacement}{match.group('quote')}"

    rewritten = MARKDOWN_IMAGE_PATTERN.sub(replace_markdown, markdown)
    rewritten = HTML_IMAGE_PATTERN.sub(replace_html, rewritten)
    return rewritten, assets


def markdown_to_plain_text(markdown: str) -> str:
    text = strip_frontmatter(markdown)
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"~~~[\s\S]*?~~~", " ", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"<img\b[^>]*alt=['\"]([^'\"]*)['\"][^>]*>", r"\1", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_~>-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def estimate_reading_minutes(markdown: str) -> int:
    text = markdown_to_plain_text(markdown)
    chinese_chars = len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]", text))
    english_words = len(re.findall(r"[A-Za-z0-9_]+(?:'[A-Za-z0-9_]+)?", text))
    minutes = (chinese_chars / 300) + (english_words / 200)
    return max(1, int(-(-minutes // 1)))


def sort_unique_strings(values: list[str]) -> list[str]:
    return sorted({value.strip() for value in values if value.strip()}, key=lambda item: item.lower())


def sort_articles(articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    def compare(left: dict[str, Any], right: dict[str, Any]) -> int:
        left_date = str(left.get("date", "") or "")
        right_date = str(right.get("date", "") or "")
        if left_date != right_date:
            return -1 if right_date < left_date else 1

        left_collection = left.get("collection")
        right_collection = right.get("collection")
        if left_collection and right_collection and left_collection == right_collection:
            left_order = int(left.get("seriesOrder") or sys.maxsize)
            right_order = int(right.get("seriesOrder") or sys.maxsize)
            if left_order != right_order:
                return -1 if left_order < right_order else 1

        left_slug = str(left.get("slug", ""))
        right_slug = str(right.get("slug", ""))
        if left_slug == right_slug:
            return 0
        return -1 if left_slug < right_slug else 1

    return sorted(articles, key=cmp_to_key(compare))


def normalize_article_entry(article: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(article)
    normalized["tags"] = sort_unique_strings(list(normalized.get("tags", [])))
    normalized["contentType"] = "repost" if normalized.get("contentType") == "repost" else "original"
    if normalized["contentType"] != "repost":
        normalized.pop("source", None)
    return normalized


def normalize_blog_index(index: dict[str, Any]) -> dict[str, Any]:
    articles = sort_articles([normalize_article_entry(article) for article in list(index.get("articles", []))])
    tags = sort_unique_strings(list(index.get("tags", [])) + [tag for article in articles for tag in article.get("tags", [])])
    return {
        "tags": tags,
        "categories": list(index.get("categories", [])),
        "collections": list(index.get("collections", [])),
        "articles": articles,
    }


def compute_next_series_order(index: dict[str, Any], collection_slug: str) -> int:
    current_orders = [
        int(article.get("seriesOrder"))
        for article in index.get("articles", [])
        if article.get("collection") == collection_slug and article.get("seriesOrder") is not None
    ]
    return max(current_orders, default=0) + 1


def load_blog_index(index_path: Path = BLOG_INDEX_PATH) -> dict[str, Any]:
    return normalize_blog_index(json.loads(index_path.read_text(encoding="utf-8")))


def save_blog_index(index_path: Path, index: dict[str, Any], tx: FileTransaction) -> None:
    content = json.dumps(normalize_blog_index(index), ensure_ascii=False, indent=2) + "\n"
    tx.write_text(index_path, content, encoding="utf-8")


def unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        trimmed = value.strip()
        if not trimmed or trimmed in seen:
            continue
        seen.add(trimmed)
        result.append(trimmed)
    return result


def ask_required_text(prompter: QuestionaryPrompter, message: str, default: str = "") -> str:
    while True:
        value = prompter.text(message, default=default).strip()
        if value:
            return value
        print("输入不能为空，请重新填写。")


def ask_slug(prompter: QuestionaryPrompter, default_slug: str, index: dict[str, Any], blog_root: Path) -> str:
    known_slugs = {str(article.get("slug", "")).strip() for article in index.get("articles", [])}
    while True:
        slug = prompter.text("请输入 slug:", default=default_slug).strip()
        try:
            assert_valid_slug(slug)
        except ValueError as error:
            print(str(error))
            continue

        if slug in known_slugs or (blog_root / slug).exists():
            print(f"slug 已存在: {slug}")
            continue

        return slug


def ask_date(prompter: QuestionaryPrompter, default_date: str) -> str:
    while True:
        value = prompter.text("发布日期（YYYY-MM-DD）:", default=default_date).strip() or default_date
        try:
            date.fromisoformat(value)
        except ValueError:
            print("日期格式不正确，请使用 YYYY-MM-DD。")
            continue
        return value


def ask_optional_date(prompter: QuestionaryPrompter, message: str, default_value: str = "") -> str | None:
    while True:
        value = prompter.text(message, default=default_value).strip()
        if not value:
            return None
        try:
            date.fromisoformat(value)
        except ValueError:
            print("日期格式不正确，请使用 YYYY-MM-DD。")
            continue
        return value


def ask_integer(prompter: QuestionaryPrompter, message: str, default_value: int) -> int:
    while True:
        value = prompter.text(message, default=str(default_value)).strip()
        if not value:
            return default_value
        if value.isdigit() and int(value) > 0:
            return int(value)
        print("请输入大于 0 的整数。")


def ask_tags(prompter: QuestionaryPrompter, index: dict[str, Any]) -> tuple[list[str], list[str]]:
    existing_tags = list(index.get("tags", []))
    selected = prompter.checkbox(
        "选择 tags (空格选择，回车确认):",
        [(tag, tag) for tag in existing_tags] + [(NEW_TAG_OPTION, NEW_TAG_OPTION)],
    )
    selected_tags = [tag for tag in selected if tag != NEW_TAG_OPTION]
    new_tags: list[str] = []

    if NEW_TAG_OPTION in selected:
        print("进入新建 tag 界面，直接回车结束。")
        while True:
            tag = prompter.text("新建 tag:", default="").strip()
            if not tag:
                break
            if tag in existing_tags or tag in new_tags:
                print(f"tag 已存在: {tag}")
                continue
            new_tags.append(tag)

    final_tags = unique_preserve_order(selected_tags + new_tags)
    return final_tags, unique_preserve_order(existing_tags + new_tags)


def build_category_choice(category: dict[str, Any]) -> tuple[str, str]:
    zh_label = str(category.get("label", {}).get("zh", "")).strip() or str(category.get("id", "")).strip()
    en_label = str(category.get("label", {}).get("en", "")).strip()
    category_id = str(category.get("id", "")).strip()
    if en_label:
        return (f"{zh_label} / {en_label} [{category_id}]", category_id)
    return (f"{zh_label} [{category_id}]", category_id)


def build_collection_choice(collection: dict[str, Any]) -> tuple[str, str]:
    zh_name = str(collection.get("name", {}).get("zh", "")).strip() or str(collection.get("slug", "")).strip()
    en_name = str(collection.get("name", {}).get("en", "")).strip()
    slug = str(collection.get("slug", "")).strip()
    if en_name:
        return (f"{zh_name} / {en_name} [{slug}]", slug)
    return (f"{zh_name} [{slug}]", slug)


def ask_new_category(prompter: QuestionaryPrompter, existing_ids: set[str]) -> dict[str, Any]:
    zh_name = ask_required_text(prompter, "新建分类中文名称:")
    while True:
        en_name = ask_required_text(prompter, "新建分类英文名称:")
        category_id = slugify_english_name(en_name)
        if not category_id:
            print("英文名称无法生成合法 id，请重新输入。")
            continue
        if category_id in existing_ids:
            print(f"自动生成的分类 id 已存在: {category_id}")
            continue
        break
    zh_description = ask_required_text(prompter, "新建分类中文描述:")
    en_description = ask_required_text(prompter, "新建分类英文描述:")
    return {
        "id": category_id,
        "label": {"zh": zh_name, "en": en_name},
        "description": {"zh": zh_description, "en": en_description},
    }


def ask_category(prompter: QuestionaryPrompter, index: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
    categories = list(index.get("categories", []))
    selected = prompter.select(
        "选择 category:",
        [build_category_choice(category) for category in categories] + [("新建分类", CREATE_OPTION)],
    )
    if selected != CREATE_OPTION:
        return selected, categories

    created = ask_new_category(prompter, {str(category.get("id", "")).strip() for category in categories})
    categories.append(created)
    return str(created["id"]), categories


def ask_new_collection(prompter: QuestionaryPrompter, existing_slugs: set[str]) -> dict[str, Any]:
    zh_name = ask_required_text(prompter, "新建合集中文名称:")
    while True:
        en_name = ask_required_text(prompter, "新建合集英文名称:")
        slug = slugify_english_name(en_name)
        if not slug:
            print("英文名称无法生成合法 slug，请重新输入。")
            continue
        if slug in existing_slugs:
            print(f"自动生成的合集 slug 已存在: {slug}")
            continue
        break
    zh_description = ask_required_text(prompter, "新建合集中文描述:")
    en_description = ask_required_text(prompter, "新建合集英文描述:")
    return {
        "slug": slug,
        "name": {"zh": zh_name, "en": en_name},
        "description": {"zh": zh_description, "en": en_description},
    }


def ask_collection(prompter: QuestionaryPrompter, index: dict[str, Any]) -> tuple[str | None, list[dict[str, Any]]]:
    collections = list(index.get("collections", []))
    selected = prompter.select(
        "选择 collection:",
        [("不设置合集", NONE_OPTION)]
        + [build_collection_choice(collection) for collection in collections]
        + [("新建合集", CREATE_OPTION)],
    )

    if selected == NONE_OPTION:
        return None, collections
    if selected != CREATE_OPTION:
        return selected, collections

    created = ask_new_collection(prompter, {str(collection.get("slug", "")).strip() for collection in collections})
    collections.append(created)
    return str(created["slug"]), collections


def ask_content_type(prompter: QuestionaryPrompter) -> str:
    return prompter.select(
        "选择内容类型:",
        [
            ("原创", "original"),
            ("转载", "repost"),
        ],
    )


def ask_repost_source(prompter: QuestionaryPrompter, default_title: str) -> dict[str, Any]:
    site = ask_required_text(prompter, "原站点:")
    author = ask_required_text(prompter, "原作者:")
    zh_title = ask_required_text(prompter, "原文标题（中文）:", default=default_title)
    en_title = ask_required_text(prompter, "原文标题（英文）:", default=default_title)
    url = ask_required_text(prompter, "来源链接:")
    published_at = ask_optional_date(prompter, "原文发布日期（YYYY-MM-DD，可留空）:")

    source = {
        "site": site,
        "author": author,
        "title": {"zh": zh_title, "en": en_title},
        "url": url,
    }

    if published_at:
        source["publishedAt"] = published_at

    return source


def create_article_metadata(
    *,
    slug: str,
    title: str,
    summary: str,
    date_value: str,
    tags: list[str],
    category: str,
    content_type: str,
    source: dict[str, Any] | None,
    collection: str | None,
    series_order: int | None,
    reading_minutes: int,
) -> dict[str, Any]:
    article: dict[str, Any] = {
        "slug": slug,
        "date": date_value,
        "tags": tags,
        "title": {"zh": title, "en": title},
        "summary": {"zh": summary, "en": summary},
        "readingTime": {"zh": f"{reading_minutes} 分钟", "en": f"{reading_minutes} min"},
        "category": category,
        "contentType": content_type,
    }
    if source:
        article["source"] = source
    if collection:
        article["collection"] = collection
    if series_order is not None:
        article["seriesOrder"] = series_order
    return article


def prompt_publish_metadata(
    prompter: QuestionaryPrompter,
    index: dict[str, Any],
    markdown_path: Path,
    markdown_content: str,
    blog_root: Path,
) -> tuple[dict[str, Any], dict[str, Any]]:
    title = markdown_path.stem
    default_slug = slugify_english_name(title) or "new-post"
    slug = ask_slug(prompter, default_slug, index, blog_root)
    summary = ask_required_text(prompter, "文章摘要（将同时写入 zh/en）:")
    tags, next_tags = ask_tags(prompter, index)

    next_index = {
        "tags": next_tags,
        "categories": list(index.get("categories", [])),
        "collections": list(index.get("collections", [])),
        "articles": list(index.get("articles", [])),
    }

    category_id, next_categories = ask_category(prompter, next_index)
    next_index["categories"] = next_categories

    collection_slug, next_collections = ask_collection(prompter, next_index)
    next_index["collections"] = next_collections
    content_type = ask_content_type(prompter)
    source = ask_repost_source(prompter, title) if content_type == "repost" else None

    series_order = None
    if collection_slug:
        default_series_order = compute_next_series_order(next_index, collection_slug)
        series_order = ask_integer(prompter, "seriesOrder（默认自动递增）:", default_series_order)

    default_date = date.today().isoformat()
    date_value = ask_date(prompter, default_date)
    reading_minutes = estimate_reading_minutes(markdown_content)

    article = create_article_metadata(
        slug=slug,
        title=title,
        summary=summary,
        date_value=date_value,
        tags=tags,
        category=category_id,
        content_type=content_type,
        source=source,
        collection=collection_slug,
        series_order=series_order,
        reading_minutes=reading_minutes,
    )

    next_index["articles"] = [*next_index["articles"], article]
    return article, normalize_blog_index(next_index)


def write_article_bundle(
    *,
    tx: FileTransaction,
    blog_root: Path,
    slug: str,
    markdown_document: str,
    assets: list[AssetCopyPlan],
) -> None:
    target_dir = blog_root / slug
    assets_dir = target_dir / "assets"

    tx.mkdir(target_dir)
    if assets:
        tx.mkdir(assets_dir)

    for asset in assets:
        tx.write_bytes(assets_dir / asset.target_name, asset.source_path.read_bytes())

    tx.write_text(target_dir / "index.zh.md", markdown_document, encoding="utf-8")
    tx.write_text(target_dir / "index.en.md", markdown_document, encoding="utf-8")


def run_publish(markdown_file: Path, *, blog_root: Path = BLOG_ROOT_DIR, index_path: Path = BLOG_INDEX_PATH) -> int:
    if not markdown_file.exists() or not markdown_file.is_file():
        print(f"Markdown 文件不存在: {markdown_file}", file=sys.stderr)
        return 1

    index = load_blog_index(index_path)
    raw_markdown = markdown_file.read_text(encoding="utf-8")
    rewritten_markdown, assets = rewrite_markdown_assets(raw_markdown, markdown_file.parent)
    prompter = QuestionaryPrompter()
    transaction = FileTransaction()

    try:
        article, next_index = prompt_publish_metadata(prompter, index, markdown_file, rewritten_markdown, blog_root)
        markdown_document = build_markdown_document(rewritten_markdown, markdown_file.stem)

        write_article_bundle(
            tx=transaction,
            blog_root=blog_root,
            slug=article["slug"],
            markdown_document=markdown_document,
            assets=assets,
        )
        save_blog_index(index_path, next_index, transaction)
        transaction.commit()
    except KeyboardInterrupt:
        transaction.rollback()
        print("\n操作已中断，所有改动均已回滚。", file=sys.stderr)
        return 130
    except Exception as error:
        transaction.rollback()
        print(f"投稿失败：{error}", file=sys.stderr)
        return 1

    print(f"已创建文章：{article['slug']}")
    print(f"目录：{blog_root / article['slug']}")
    print(f"图片数量：{len(assets)}")
    return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="本地博客快速投稿脚本")
    parser.add_argument("markdown_file", help="待导入的 markdown 文件路径")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    markdown_file = Path(args.markdown_file).expanduser().resolve()
    return run_publish(markdown_file)


if __name__ == "__main__":
    raise SystemExit(main())
