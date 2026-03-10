from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT_DIR / "scripts" / "publish_blog.py"


def load_publish_blog_module():
    if not SCRIPT_PATH.exists():
        raise FileNotFoundError(f"publish script not found: {SCRIPT_PATH}")

    spec = importlib.util.spec_from_file_location("publish_blog", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("failed to load publish_blog module spec")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PublishBlogTests(unittest.TestCase):
    def test_slugify_english_name(self):
        module = load_publish_blog_module()

        self.assertEqual(module.slugify_english_name("Backend Reliability Playbook"), "backend-reliability-playbook")
        self.assertEqual(module.slugify_english_name("  Rate   Limiting 101  "), "rate-limiting-101")
        self.assertEqual(module.slugify_english_name("Go & Rust Systems"), "go-rust-systems")

    def test_build_markdown_document_replaces_frontmatter(self):
        module = load_publish_blog_module()
        source = "---\ntitle: old\n---\n\n# Hello\n\ncontent\n"

        rendered = module.build_markdown_document(source, "新文章标题")

        self.assertTrue(rendered.startswith("---\ntitle: 新文章标题\n---\n\n"))
        self.assertNotIn("title: old", rendered)
        self.assertIn("# Hello", rendered)

    def test_rewrite_markdown_assets_copies_local_assets_and_rewrites_paths(self):
        module = load_publish_blog_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            source_dir = temp_path / "source"
            source_dir.mkdir()

            first_image = source_dir / "diagram.png"
            second_dir = source_dir / "nested"
            second_dir.mkdir()
            second_image = second_dir / "diagram.png"
            first_image.write_bytes(b"first")
            second_image.write_bytes(b"second")

            markdown = (
                "![one](diagram.png)\n"
                "![two](nested/diagram.png)\n"
                '![remote](https://example.com/image.png)\n'
                '<img src="nested/diagram.png" alt="repeat" />\n'
            )

            rewritten, assets = module.rewrite_markdown_assets(markdown, source_dir)

            self.assertEqual(len(assets), 2)
            self.assertEqual(assets[0].target_name, "diagram.png")
            self.assertEqual(assets[1].target_name, "diagram-2.png")
            self.assertIn("![one](./assets/diagram.png)", rewritten)
            self.assertIn("![two](./assets/diagram-2.png)", rewritten)
            self.assertIn('<img src="./assets/diagram-2.png" alt="repeat" />', rewritten)
            self.assertIn("https://example.com/image.png", rewritten)

    def test_estimate_reading_time_minutes(self):
        module = load_publish_blog_module()

        english = "word " * 420
        chinese = "分布式系统" * 320
        minutes = module.estimate_reading_minutes(english + chinese)

        self.assertGreaterEqual(minutes, 4)

    def test_normalize_blog_index_sorts_tags_and_articles(self):
        module = load_publish_blog_module()

        index = {
            "tags": ["Go"],
            "categories": [],
            "collections": [],
            "articles": [
                {
                    "slug": "b",
                    "date": "2026-03-01",
                    "tags": ["Reliability", "Go"],
                    "title": {"zh": "B", "en": "B"},
                    "summary": {"zh": "B", "en": "B"},
                    "readingTime": {"zh": "1 分钟", "en": "1 min"},
                    "category": "service-reliability",
                },
                {
                    "slug": "a",
                    "date": "2026-03-10",
                    "tags": ["Auth"],
                    "title": {"zh": "A", "en": "A"},
                    "summary": {"zh": "A", "en": "A"},
                    "readingTime": {"zh": "1 分钟", "en": "1 min"},
                    "category": "security-engineering",
                },
            ],
        }

        normalized = module.normalize_blog_index(index)

        self.assertEqual(normalized["tags"], ["Auth", "Go", "Reliability"])
        self.assertEqual([article["slug"] for article in normalized["articles"]], ["a", "b"])

    def test_compute_next_series_order(self):
        module = load_publish_blog_module()

        index = {
            "tags": [],
            "categories": [],
            "collections": [],
            "articles": [
                {"slug": "a", "collection": "backend", "seriesOrder": 2, "date": "2026-03-01"},
                {"slug": "b", "collection": "backend", "seriesOrder": 5, "date": "2026-03-02"},
                {"slug": "c", "collection": "other", "seriesOrder": 1, "date": "2026-03-03"},
            ],
        }

        self.assertEqual(module.compute_next_series_order(index, "backend"), 6)
        self.assertEqual(module.compute_next_series_order(index, "missing"), 1)

    def test_file_transaction_rolls_back_created_files_and_restores_index(self):
        module = load_publish_blog_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            blog_root = temp_path / "public" / "blog"
            blog_root.mkdir(parents=True)

            index_path = blog_root / "index.json"
            original_index = {"tags": [], "categories": [], "collections": [], "articles": []}
            index_path.write_text(json.dumps(original_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

            target_dir = blog_root / "new-post"
            target_file = target_dir / "index.zh.md"

            tx = module.FileTransaction()
            tx.mkdir(target_dir)
            tx.write_text(index_path, '{"changed": true}\n')
            tx.write_text(target_file, "content")
            tx.rollback()

            self.assertFalse(target_dir.exists())
            self.assertEqual(json.loads(index_path.read_text(encoding="utf-8")), original_index)


if __name__ == "__main__":
    unittest.main()
