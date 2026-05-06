import "server-only";
import { cookies } from "next/headers";
import { githubService } from "@/lib/github/service";

const COOKIE = "active_ctx";

export type ActiveContext =
  | { kind: "user"; login: string }
  | { kind: "org"; login: string };

/**
 * Resolve the currently active GitHub context for a user (their personal
 * account or one of their orgs). Falls back to the user's own login.
 */
export async function getActiveContext(
  userId: string,
  fallbackLogin: string,
): Promise<ActiveContext> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return { kind: "user", login: fallbackLogin };
  if (raw === fallbackLogin) return { kind: "user", login: fallbackLogin };
  // Validate that the login still belongs to user's orgs to avoid stale ctx.
  try {
    const orgs = await githubService.listOrgs(userId);
    const found = orgs.data.find((o) => o.login === raw);
    if (found) return { kind: "org", login: raw };
  } catch {
    // ignore — fall through to user
  }
  return { kind: "user", login: fallbackLogin };
}

export async function setActiveContextCookie(login: string) {
  const store = await cookies();
  store.set(COOKIE, login, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}
