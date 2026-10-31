CREATE TYPE "public"."automation_type" AS ENUM('LEAD_AUTO_ASSIGN', 'SLA_REMINDER');--> statement-breakpoint
ALTER TYPE "public"."lead_activity_type" ADD VALUE 'SLA_REMINDER_SENT';--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"type" "automation_type" PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"round_robin_cursor" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_count" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;