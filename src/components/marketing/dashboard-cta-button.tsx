import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  size?: "default" | "lg" | "sm";
  label?: string;
  className?: string;
};

// Shown on the public landing when the visitor already has a session, in
// place of the GitHub sign-in button.
export function DashboardCtaButton({
  size = "lg",
  label = "Go to dashboard",
  className,
}: Props) {
  return (
    <Button asChild size={size} className={className}>
      <Link href="/dashboard">
        <LayoutDashboard className="size-4" />
        {label}
      </Link>
    </Button>
  );
}
