"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileEdit, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  editFileAction,
  readFileForEditAction,
} from "@/app/actions/repo-edit";
import type { RepoBranchRef } from "@/lib/github/service";
import { CodeEditor } from "./code-editor";
import { FilePathPicker } from "./file-path-picker";
import { useExplorerState } from "./use-explorer-state";

const BRANCH_NAME_REGEX = /^(?!\/)(?!.*\/$)(?!.*\.\.)[a-zA-Z0-9._/-]+$/;
const PATH_REGEX = /^(?!.*\.\.)[a-zA-Z0-9._/-]+$/;

type Props = {
  owner: string;
  repo: string;
  branches: RepoBranchRef[];
  currentBranch: string;
};

type CommitTarget = "current" | "new";

export function EditFileDialog({
  owner,
  repo,
  branches,
  currentBranch,
}: Props) {
  const router = useRouter();
  const { setBranch, setCommit } = useExplorerState();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const [loadedSha, setLoadedSha] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<CommitTarget>("current");
  const [newBranchName, setNewBranchName] = useState("");
  const [submitting, startSubmit] = useTransition();

  function reset() {
    setPath("");
    setLoadedSha(null);
    setContent("");
    setMessage("");
    setTarget("current");
    setNewBranchName("");
  }

  async function loadFile() {
    if (!PATH_REGEX.test(path)) {
      toast.error("Invalid path");
      return;
    }
    setLoading(true);
    try {
      const res = await readFileForEditAction({
        owner,
        repo,
        path,
        ref: currentBranch,
      });
      if (!res.ok) {
        toast.error(res.error);
        setLoadedSha(null);
        return;
      }
      setContent(res.data?.content ?? "");
      setLoadedSha(res.data?.sha ?? null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loadedSha) {
      toast.error("Load a file first");
      return;
    }
    if (!message.trim()) {
      toast.error("Commit message required");
      return;
    }
    if (target === "new" && !BRANCH_NAME_REGEX.test(newBranchName)) {
      toast.error("Invalid new branch name");
      return;
    }

    const baseBranch = branches.find((b) => b.name === currentBranch);

    startSubmit(async () => {
      const res = await editFileAction({
        owner,
        repo,
        path,
        message: message.trim(),
        content,
        branch: currentBranch,
        sha: loadedSha,
        createBranch:
          target === "new" && baseBranch
            ? {
                newBranchName,
                baseSha: baseBranch.commit.sha,
              }
            : undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Commit created");
      setOpen(false);
      const finalBranch = res.data?.branch ?? currentBranch;
      if (finalBranch !== currentBranch) setBranch(finalBranch);
      if (res.data?.commitSha) setCommit(res.data.commitSha);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
        >
          <FileEdit className="size-3.5 text-primary" />
          Edit file
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-h-[85vh] flex-col sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Edit file on {currentBranch}</DialogTitle>
          </DialogHeader>

          <div className="relative z-10 mt-4 flex gap-2">
            <div className="flex-1">
              <FilePathPicker
                owner={owner}
                repo={repo}
                branch={currentBranch}
                value={path}
                onChange={setPath}
                disabled={loadedSha !== null}
              />
            </div>
            {loadedSha === null ? (
              <Button
                type="button"
                size="sm"
                onClick={loadFile}
                disabled={loading || !path}
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Load"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={reset}
              >
                Change file
              </Button>
            )}
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {loadedSha ? (
              <>
                <div className="h-64 overflow-hidden rounded-md border">
                  <CodeEditor
                    value={content}
                    onChange={setContent}
                    path={path}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="commit-message" className="text-xs">
                    Commit message
                  </Label>
                  <Input
                    id="commit-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={72}
                    placeholder="Update file"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Commit to</Label>
                  <Select
                    value={target}
                    onValueChange={(v) => setTarget(v as CommitTarget)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">
                        {currentBranch}
                      </SelectItem>
                      <SelectItem value="new">New branch…</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {target === "new" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="new-branch" className="text-xs">
                      New branch name
                    </Label>
                    <Input
                      id="new-branch"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      pattern={BRANCH_NAME_REGEX.source}
                      placeholder={`patch-from-${currentBranch}`}
                      required
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter a file path relative to the repo root, then Load.
              </p>
            )}
          </div>

          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !loadedSha}
            >
              {submitting ? "Committing…" : "Commit changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
