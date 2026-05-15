"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GitBranchPlus } from "lucide-react";
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
import { createBranchAction } from "@/app/actions/repo-edit";
import type { RepoBranchRef } from "@/lib/github/service";
import { useExplorerState } from "./use-explorer-state";

const BRANCH_NAME_REGEX = /^(?!\/)(?!.*\/$)(?!.*\.\.)[a-zA-Z0-9._/-]+$/;

type Props = {
  owner: string;
  repo: string;
  branches: RepoBranchRef[];
  defaultBranch: string | undefined;
};

export function CreateBranchDialog({
  owner,
  repo,
  branches,
  defaultBranch,
}: Props) {
  const router = useRouter();
  const { setBranch } = useExplorerState();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBranch ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!BRANCH_NAME_REGEX.test(name)) {
      toast.error("Invalid branch name");
      return;
    }
    const base = branches.find((b) => b.name === baseBranch);
    if (!base) {
      toast.error("Select a valid base branch");
      return;
    }
    startTransition(async () => {
      const res = await createBranchAction({
        owner,
        repo,
        branchName: name,
        baseSha: base.commit.sha,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Branch ${name} created`);
      setOpen(false);
      setName("");
      setBranch(name);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full justify-start gap-2 text-sm"
        >
          <GitBranchPlus className="size-4 text-primary" />
          New branch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create branch</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch-name" className="text-xs">
                Branch name
              </Label>
              <Input
                id="branch-name"
                placeholder="feature/my-change"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                pattern={BRANCH_NAME_REGEX.source}
              />
              <p className="text-[10px] text-muted-foreground">
                Letters, digits, dots, dashes, underscores, and slashes.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Base branch</Label>
              <Select value={baseBranch} onValueChange={setBaseBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick base branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                      {b.name === defaultBranch ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
