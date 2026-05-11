import { CalendarOff, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Variant = "empty" | "private" | "error";

type Props = {
  variant: Variant;
};

export function ChangelogEmpty({ variant }: Props) {
  if (variant === "private") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No access to upstream repo</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The GitControl repo is private and your account is not a
            collaborator. Contact the maintainer to be added.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <CalendarOff className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Failed to load changelog</p>
          <p className="text-sm text-muted-foreground">
            Try again in a moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <CalendarOff className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No releases yet</p>
        <p className="text-sm text-muted-foreground">
          Check back soon — releases will show up here automatically.
        </p>
      </CardContent>
    </Card>
  );
}
