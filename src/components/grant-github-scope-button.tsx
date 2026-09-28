"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

type GrantGithubScopeButtonProps = {
  /** Button copy. Defaults to a generic billing-access label. */
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
};

/**
 * Opt-in grant: asks GitHub for the `user` scope required by the personal
 * billing usage endpoints. Uses Better Auth's `linkSocial` with an explicit
 * `scopes` list, which merges the newly granted scope into `account.scope`
 * without forcing a logout (plain re-sign-in does NOT refresh scopes — see
 * Better Auth docs). Because `user` is not part of GITHUB_OAUTH_SCOPES, this is
 * the only way it is ever requested — fully user-initiated.
 */
export function GrantGithubScopeButton({
  label = "Grant billing access",
  size = "sm",
  variant = "default",
  className,
}: GrantGithubScopeButtonProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  async function handleClick() {
    setLoading(true);
    try {
      await authClient.linkSocial({
        provider: "github",
        callbackURL: pathname || "/dashboard",
        scopes: ["user"],
      });
      // linkSocial performs a browser redirect to GitHub; reaching this line
      // means the flow errored (missing provider config, network, etc.).
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <ShieldCheck className="size-4" />
      )}
      {label}
    </Button>
  );
}
