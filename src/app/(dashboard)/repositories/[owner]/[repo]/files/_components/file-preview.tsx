import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RepoFileContent } from "@/lib/github/service";

type Props = {
  file: RepoFileContent;
};

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp"]);

function getExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function decodeContent(file: RepoFileContent): string | null {
  if (file.encoding !== "base64") return file.content;
  try {
    return Buffer.from(file.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function FilePreview({ file }: Props) {
  const ext = getExt(file.name);
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isMarkdown = ext === "md" || ext === "markdown";
  const fileSizeKb = (file.size / 1024).toFixed(1);
  const tooLarge = file.size > 1024 * 1024; // 1 MB
  const text = !isImage && !tooLarge ? decodeContent(file) : null;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="font-mono text-sm">{file.name}</CardTitle>
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
            {fileSizeKb} KB
          </span>
        </div>
        {file.html_url ? (
          <a
            href={file.html_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open on GitHub <ExternalLink className="size-3" />
          </a>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {tooLarge ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              File too large to preview ({fileSizeKb} KB).
            </p>
            {file.html_url ? (
              <a
                href={file.html_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
              >
                Open on GitHub
              </a>
            ) : null}
          </div>
        ) : isImage ? (
          <div className="grid place-items-center bg-muted/40 px-4 py-8">
            {file.download_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.download_url}
                alt={file.name}
                className="max-h-[600px] max-w-full"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No download URL.</p>
            )}
          </div>
        ) : text === null ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Unable to decode file content.
          </div>
        ) : isMarkdown ? (
          <article className="prose prose-sm max-w-none px-6 py-4 dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {text}
            </ReactMarkdown>
          </article>
        ) : (
          <pre className="overflow-x-auto bg-muted/30 px-4 py-3 font-mono text-xs leading-relaxed">
            <code>{text}</code>
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
