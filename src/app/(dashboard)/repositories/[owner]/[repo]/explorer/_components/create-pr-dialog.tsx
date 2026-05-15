"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GitPullRequestArrow } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPrAction } from "@/app/actions/repo-edit";
import type { RepoBranchRef } from "@/lib/github/service";

type Props = {
  owner: string;
  repo: string;
  branches: RepoBranchRef[];
  headBranch: string;
  defaultBranch: string;
  defaultTitle?: string;
};

export function CreatePrDialog({
  owner,
  repo,
  branches,
  headBranch,
  defaultBranch,
  defaultTitle,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [body, setBody] = useState("");
  const [base, setBase] = useState(defaultBranch);
  const [draft, setDraft] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    if (base === headBranch) {
      toast.error("Base and head must differ");
      return;
    }
    startTransition(async () => {
      const res = await createPrAction({
        owner,
        repo,
        title: title.trim(),
        head: headBranch,
        base,
        body: body.trim() || undefined,
        draft,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`PR #${res.data?.number} created`);
      setOpen(false);
      router.push(`/repositories/${owner}/${repo}/pulls/${res.data?.number}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="h-8 gap-2 text-sm"
          disabled={headBranch === defaultBranch}
        >
          <GitPullRequestArrow className="size-4" />
          Create PR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create pull request</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">head</span>
              <code className="font-mono text-primary">{headBranch}</code>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">base</span>
              <div className="flex-1">
                <Select value={base} onValueChange={setBase}>
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches
                      .filter((b) => b.name !== headBranch)
                      .map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                          {b.name === defaultBranch ? " (default)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pr-title" className="text-xs">
                Title
              </Label>
              <Input
                id="pr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
                maxLength={256}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-body" className="text-xs">
                Description (markdown)
              </Label>
              <Textarea
                id="pr-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pr-draft"
                checked={draft}
                onCheckedChange={(v) => setDraft(Boolean(v))}
              />
              <Label htmlFor="pr-draft" className="text-xs">
                Open as draft
              </Label>
            </div>
          </div>
          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating…" : "Create PR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
