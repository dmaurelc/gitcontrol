import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);
console.log("[migrate] running migrations...");
const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? "./drizzle";
await migrate(db, { migrationsFolder });
console.log("[migrate] done");
await pool.end();
