"use client";
import { useActionState, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  createRepoAction,
  type CreateRepoState,
} from "@/app/actions/create-repo";

export function NewRepoDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateRepoState, FormData>(
    createRepoAction,
    { status: "idle" },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New repository
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create repository</DialogTitle>
          <DialogDescription>
            Creates the repo on your personal account using the GitHub API.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-name">Name</Label>
            <Input
              id="repo-name"
              name="name"
              required
              autoComplete="off"
              placeholder="my-awesome-repo"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-description">Description (optional)</Label>
            <Textarea
              id="repo-description"
              name="description"
              rows={3}
              placeholder="What is this repo about?"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="repo-private" name="isPrivate" defaultChecked />
            <Label htmlFor="repo-private" className="text-sm font-normal">
              Private repository
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="repo-init" name="autoInit" defaultChecked />
            <Label htmlFor="repo-init" className="text-sm font-normal">
              Initialize with a README
            </Label>
          </div>
          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
