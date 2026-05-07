"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkdownBody } from "@/components/markdown-body";
import { Label } from "@/components/ui/label";

type NewIssueFormProps = {
  action: (formData: FormData) => Promise<void>;
  owner: string;
  repo: string;
};

/**
 * Client form for creating a new issue with markdown preview. The server
 * action either redirects on success (NEXT_REDIRECT) or throws — we surface
 * thrown errors as a toast.
 */
export function NewIssueForm({ action, owner, repo }: NewIssueFormProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        const e = err as { digest?: string; message?: string };
        // Re-throw NEXT_REDIRECT so navigation still happens.
        if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_")) {
          throw err;
        }
        toast.error(
          e?.message ?? "No se pudo crear el issue. Intenta nuevamente.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="issue-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="issue-title"
          name="title"
          placeholder="Short, descriptive title"
          required
          maxLength={256}
          className="text-sm"
        />
      </div>

      {/* Body with Write/Preview tabs */}
      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <Tabs defaultValue="write">
          <TabsList className="mb-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview" disabled={!body.trim()}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write">
            <Textarea
              name="body"
              placeholder="Describe the issue in detail (markdown supported)…"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={65535}
              className="resize-y font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview">
            {body.trim() ? (
              <div className="min-h-32 rounded-md border bg-muted/30 px-3 py-2">
                <MarkdownBody>{body}</MarkdownBody>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="issue-labels">Labels</Label>
        <Input
          id="issue-labels"
          name="labels"
          placeholder="bug, enhancement, help wanted (comma-separated)"
          maxLength={1000}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple labels with commas. Labels must already exist in the repo.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Submit new issue"}
        </Button>
      </div>
    </form>
  );
}
