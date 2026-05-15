"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import type { Extension } from "@codemirror/state";
import { useTheme } from "next-themes";
import { useMemo } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  path: string;
  readOnly?: boolean;
};

function extensionsForPath(path: string): Extension[] {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ts":
    case "tsx":
      return [javascript({ typescript: true, jsx: ext === "tsx" })];
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return [javascript({ jsx: ext === "jsx" })];
    case "json":
    case "jsonc":
      return [json()];
    case "md":
    case "mdx":
      return [markdown()];
    case "css":
    case "scss":
    case "sass":
      return [css()];
    case "html":
    case "htm":
      return [html()];
    default:
      return [];
  }
}

export function CodeEditor({ value, onChange, path, readOnly }: Props) {
  const { resolvedTheme } = useTheme();
  const extensions = useMemo(() => extensionsForPath(path), [path]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      extensions={extensions}
      theme={resolvedTheme === "dark" ? oneDark : undefined}
      height="100%"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: false,
      }}
      style={{ fontSize: "12px", height: "100%" }}
    />
  );
}
