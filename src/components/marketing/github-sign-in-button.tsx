"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons/github-icon";
import { signIn } from "@/lib/auth/auth-client";

type Props = {
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
  label?: string;
  className?: string;
};

export function GithubSignInButton({
  variant = "default",
  size = "lg",
  label = "Sign in with GitHub",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn.social({ provider: "github", callbackURL: "/dashboard" });
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GithubIcon className="size-4" />
      )}
      {label}
    </Button>
  );
}
