// Migrations script: runs against DATABASE_URL by default, or
// MIGRATION_DATABASE_URL when set (used by Vercel builds against Neon's
// unpooled connection to avoid pooler limitations on DDL).
//
// Driver selection mirrors src/lib/db/client.ts: DB_DRIVER=neon switches
// to @neondatabase/serverless, anything else uses node-postgres.
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? "./drizzle";
const driver = process.env.DB_DRIVER ?? "node-postgres";

console.log(`[migrate] running migrations (driver=${driver})...`);

if (driver === "neon") {
  const { Pool } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  await pool.end();
} else {
  const { default: pg } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  await pool.end();
}

console.log("[migrate] done");
