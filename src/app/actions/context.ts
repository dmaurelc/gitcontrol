"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { setActiveContextCookie } from "@/lib/context/active-context";

export async function setActiveContext(login: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("unauthorized");
  await setActiveContextCookie(login);
  revalidatePath("/", "layout");
}
