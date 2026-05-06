import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
    );
    return NextResponse.json({ tables: (res as { rows: { table_name: string }[] }).rows.map((r) => r.table_name) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
