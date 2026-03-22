import {
  Children,
  createElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { getHeadingAnchorId } from '../../lib/blog';

function flattenHeadingChildren(children: ReactNode): string {
  let text = '';

  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += String(child);
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child)) {
      text += flattenHeadingChildren(child.props.children);
    }
  });

  return text.trim();
}

function getCodeLanguage(className?: string) {
  const match = /language-([\w-]+)/.exec(className ?? '');
  return match?.[1]?.toLowerCase() ?? 'text';
}

function getCodeBlockMeta(language: string) {
  switch (language) {
    case 'bash':
    case 'shell':
    case 'sh':
    case 'zsh':
      return { title: '/dev/pts/0', badge: language === 'bash' ? 'bash' : 'zsh' };
    case 'rust':
    case 'rs':
      return { title: 'src/main.rs', badge: 'rust' };
    case 'go':
      return { title: 'cmd/main.go', badge: 'go' };
    case 'java':
      return { title: 'src/Main.java', badge: 'java' };
    case 'json':
      return { title: 'config.json', badge: 'json' };
    case 'yaml':
    case 'yml':
      return { title: 'config.yml', badge: 'yaml' };
    case 'toml':
      return { title: 'Cargo.toml', badge: 'toml' };
    case 'sql':
      return { title: 'query.sql', badge: 'sql' };
    case 'typescript':
    case 'ts':
      return { title: 'snippet.ts', badge: 'ts' };
    case 'javascript':
    case 'js':
      return { title: 'snippet.js', badge: 'js' };
    default:
      return { title: `snippet.${language}`, badge: language };
  }
}

function renderHeading(
  tagName: 'h1' | 'h2' | 'h3' | 'h4',
  props: ComponentPropsWithoutRef<'h2'> & { node?: unknown },
) {
  const { children, node, ...restProps } = props;
  void node;
  const headingId = getHeadingAnchorId(flattenHeadingChildren(children));

  return createElement(
    tagName,
    {
      ...restProps,
      id: headingId,
    },
    children,
  );
}

const markdownComponents: Components = {
  h1: (props) => renderHeading('h1', props),
  h2: (props) => renderHeading('h2', props),
  h3: (props) => renderHeading('h3', props),
  h4: (props) => renderHeading('h4', props),
  pre: ({ children, ...props }) => {
    const codeChild = Children.toArray(children).find((child) =>
      isValidElement<{ className?: string }>(child),
    );
    const codeClassName =
      isValidElement<{ className?: string }>(codeChild) && typeof codeChild.props.className === 'string'
        ? codeChild.props.className
        : undefined;
    const language = getCodeLanguage(codeClassName);
    const meta = getCodeBlockMeta(language);

    return (
      <div className="blog-code-block">
        <div className="blog-code-block__header">
          <span className="blog-code-block__scope mono-data">/dev/pts/0</span>
          <span className="blog-code-block__title mono-data">{meta.title}</span>
          <span className="blog-code-block__badge mono-data">{meta.badge}</span>
        </div>
        <pre {...props}>{children}</pre>
      </div>
    );
  },
};

export function BlogMarkdownRenderer({ content, slug }: { content: string; slug: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }], rehypeKatex]}
      components={markdownComponents}
      urlTransform={(url: string) => {
        if (url.startsWith('./') || (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#'))) {
          return `${import.meta.env.BASE_URL}blog/${slug}/${url.replace(/^\.\//, '')}`;
        }
        return url;
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default BlogMarkdownRenderer;
