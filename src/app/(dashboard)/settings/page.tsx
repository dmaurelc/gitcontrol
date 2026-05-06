import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DefaultViewSelect } from "./_components/default-view-select";
import { PinnedReposManager } from "./_components/pinned-repos-manager";
import { AccountTab } from "./_components/account-tab";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const prefs = await getUserPreferences(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personal preferences for this dashboard.
        </p>
      </div>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default view</CardTitle>
            </CardHeader>
            <CardContent>
              <DefaultViewSelect value={prefs.defaultView} />
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="pinned" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pinned repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <PinnedReposManager pinned={prefs.pinnedRepos} />
            </CardContent>
          </Card>
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
