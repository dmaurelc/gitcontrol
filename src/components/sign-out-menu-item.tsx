"use client";
import { useTransition } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions/auth";

type Props = {
  className?: string;
};

// Calls signOutAction via transition instead of <form action={}>. A form inside
// a Radix DropdownMenuItem gets unmounted on click before native submit fires,
// triggering "Form submission canceled because the form is not connected".
export function SignOutMenuItem({ className }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={pending}
      onSelect={(e) => {
        e.preventDefault();
        startTransition(() => signOutAction());
      }}
      className={className}
    >
      Sign out
    </DropdownMenuItem>
  );
}
