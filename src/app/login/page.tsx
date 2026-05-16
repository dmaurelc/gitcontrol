import { redirect } from "next/navigation";

// Backward-compatible redirect: the proxy.ts middleware (and any legacy
// links) still target "/login", but the canonical URL is now "/". A 308
// keeps the original method so OAuth callbacks survive unscathed.
export default function LoginRedirect() {
  redirect("/");
}
