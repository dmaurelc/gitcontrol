"use client";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBugReportAction,
  type BugReportActionResult,
} from "@/app/actions/create-bug-report";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-40">
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? "Submitting…" : "Submit report"}
    </Button>
  );
}

export function BugReportForm() {
  const [state, formAction] = useActionState<BugReportActionResult | null, FormData>(
    createBugReportAction,
    null,
  );

  useEffect(() => {
    if (state?.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={256}
          placeholder="Short summary of the issue"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="bug">
          <SelectTrigger id="type" className="w-full sm:w-56">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="enhancement">Enhancement</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={40000}
          rows={5}
          placeholder="What happened? Add as much context as possible."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="steps">Steps to reproduce (optional)</Label>
        <Textarea
          id="steps"
          name="steps"
          maxLength={10000}
          rows={4}
          placeholder="1. Go to …&#10;2. Click …&#10;3. See error"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="expected">Expected behavior (optional)</Label>
          <Textarea id="expected" name="expected" maxLength={5000} rows={3} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="actual">Actual behavior (optional)</Label>
          <Textarea id="actual" name="actual" maxLength={5000} rows={3} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <SubmitButton />
      </div>
    </form>
  );
}
