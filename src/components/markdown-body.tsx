"use client";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

type MarkdownBodyProps = {
  children: string;
  className?: string;
};

/**
 * Safe markdown renderer using react-markdown + rehype-sanitize.
 * Always a client component because react-markdown uses client-only hooks.
 */
export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  return (
    <article
      className={
        className ??
        "prose prose-sm max-w-none dark:prose-invert"
      }
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </article>
  );
}
