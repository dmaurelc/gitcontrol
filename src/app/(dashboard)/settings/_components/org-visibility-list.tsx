"use client";
import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  hideOrgAction,
  unhideOrgAction,
} from "@/app/actions/visibility";

type Org = {
  login: string;
  avatar_url: string;
  description: string | null;
};

type Props = {
  orgs: Org[];
  initialHidden: string[];
};

export function OrgVisibilityList({ orgs, initialHidden }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(initialHidden),
  );
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function toggle(login: string, currentlyHidden: boolean) {
    setBusy(login);
    const next = new Set(hidden);
    if (currentlyHidden) next.delete(login);
    else next.add(login);
    setHidden(next);
    startTransition(async () => {
      try {
        if (currentlyHidden) await unhideOrgAction(login);
        else await hideOrgAction(login);
      } finally {
        setBusy(null);
      }
    });
  }

  if (orgs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t belong to any organizations.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y">
      {orgs.map((o) => {
        const isHidden = hidden.has(o.login);
        const visible = !isHidden;
        return (
          <li
            key={o.login}
            className="flex items-center gap-3 py-3"
          >
            <Avatar className="size-8">
              <AvatarImage src={o.avatar_url} alt={o.login} />
              <AvatarFallback>{o.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{o.login}</p>
              {o.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {o.description}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {busy === o.login && pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : null}
              <span>Show</span>
              <Checkbox
                checked={visible}
                disabled={pending && busy === o.login}
                onCheckedChange={() => toggle(o.login, isHidden)}
              />
            </label>
          </li>
        );
      })}
    </ul>
  );
}
