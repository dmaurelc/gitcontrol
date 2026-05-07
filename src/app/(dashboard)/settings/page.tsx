import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/page-header";
import { AccountTab } from "./_components/account-tab";
import { VisibilityTab } from "./_components/visibility-tab";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Personal preferences for this dashboard."
      />
      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility" className="pt-4">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <VisibilityTab userId={session.user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="account" className="pt-4">
          <AccountTab
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image ?? null,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
