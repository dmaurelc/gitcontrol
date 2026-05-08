"use client";
import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOutdatedIssueAction } from "@/app/actions/create-outdated-issue";
import { buildIssueBody } from "@/lib/dependencies/build-issue-body";
import type { OutdatedDepRow } from "@/lib/dependencies/build-issue-body";

type Props = {
  owner: string;
  repo: string;
  outdated: OutdatedDepRow[];
  /** Description of the active severity filter for the issue title. */
  severityLabel?: string;
};

export function CreateOutdatedIssueDialog({
  owner,
  repo,
  outdated,
  severityLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(
    severityLabel
      ? `chore(deps): bump ${outdated.length} ${severityLabel} dependencies`
      : `chore(deps): bump ${outdated.length} outdated dependencies`,
  );
  const [body, setBody] = useState(buildIssueBody(outdated));
  const [labels, setLabels] = useState("dependencies");

  function submit() {
    if (pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("owner", owner);
      fd.set("repo", repo);
      fd.set("title", title);
      fd.set("body", body);
      fd.set("labels", labels);
      try {
        await createOutdatedIssueAction(fd);
      } catch (err) {
        // createIssueAction throws NEXT_REDIRECT on success — swallow it.
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        throw err;
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <AlertCircle className="size-3.5" />
          Create outdated issue ({outdated.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open issue: outdated dependencies</DialogTitle>
          <DialogDescription>
            Creates a new GitHub issue in this repo with a markdown table of
            outdated dependencies. You can edit the title, labels, and body
            before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outdated-issue-title">Title</Label>
            <Input
              id="outdated-issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outdated-issue-labels">
              Labels (comma-separated)
            </Label>
            <Input
              id="outdated-issue-labels"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="dependencies"
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outdated-issue-body">Body (markdown)</Label>
            <Textarea
              id="outdated-issue-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              maxLength={65535}
              disabled={pending}
              className="font-mono text-xs"
            />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {body.length} / 65535
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Creating…" : "Create issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
