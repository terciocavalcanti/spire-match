CREATE TYPE "public"."campaign_status" AS ENUM('RASCUNHO', 'ATIVA', 'PAUSADA', 'ENCERRADA');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('LANCAMENTO', 'INSTITUCIONAL', 'PERFORMANCE');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"development_id" uuid,
	"name" text NOT NULL,
	"type" "campaign_type" NOT NULL,
	"channel" text NOT NULL,
	"sponsor_name" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"budget" numeric(14, 2),
	"status" "campaign_status" DEFAULT 'RASCUNHO' NOT NULL,
	"goal_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "development_partner_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"development_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_partner_access" ADD CONSTRAINT "development_partner_access_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_partner_access" ADD CONSTRAINT "development_partner_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_partner_access" ADD CONSTRAINT "development_partner_access_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_development_idx" ON "campaigns" USING btree ("development_id");--> statement-breakpoint
CREATE UNIQUE INDEX "development_partner_access_dev_user_uq" ON "development_partner_access" USING btree ("development_id","user_id");