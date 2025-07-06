ALTER TABLE "artists" ADD COLUMN "bio_summary" text;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "bio_url" varchar(500);--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "birthdate" date;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "deathdate" date;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "years_active_start" integer;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "years_active_end" integer;