"use client";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkdownBody } from "@/components/markdown-body";

type CommentFormProps = {
  /** Server action that accepts FormData with owner/repo/number/body. */
  action: (formData: FormData) => Promise<void>;
  owner: string;
  repo: string;
  number: number;
};

/**
 * Comment form with Write/Preview tabs.
 * Hidden inputs carry owner/repo/number so the server action can
 * validate them without relying on URL context.
 */
export function CommentForm({ action, owner, repo, number }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
      setBody("");
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />
      <input type="hidden" name="number" value={number} />

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
            placeholder="Leave a comment…"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="resize-y font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview">
          {body.trim() ? (
            <div className="min-h-24 rounded-md border bg-muted/30 px-3 py-2">
              <MarkdownBody>{body}</MarkdownBody>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !body.trim()} size="sm">
          {isPending ? "Submitting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
