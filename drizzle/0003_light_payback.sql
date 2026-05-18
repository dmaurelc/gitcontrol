ALTER TABLE "user_preferences" ALTER COLUMN "theme" SET DEFAULT 'dark';--> statement-breakpoint
UPDATE "user_preferences" SET "theme" = 'dark' WHERE "theme" NOT IN ('light', 'dark');