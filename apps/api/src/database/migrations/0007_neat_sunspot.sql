CREATE TYPE "public"."commission_status" AS ENUM('PREVISTO', 'RECEBIDO', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"broker_id" uuid,
	"property_id" uuid,
	"base_amount" numeric(14, 2) NOT NULL,
	"rate" numeric(5, 4) NOT NULL,
	"previsto_amount" numeric(14, 2) NOT NULL,
	"recebido_amount" numeric(14, 2),
	"recebido_at" timestamp with time zone,
	"status" "commission_status" DEFAULT 'PREVISTO' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_touchpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" "lead_activity_type" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_touchpoints" ADD CONSTRAINT "lead_touchpoints_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commissions_status_idx" ON "commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commissions_broker_idx" ON "commissions" USING btree ("broker_id");--> statement-breakpoint
CREATE INDEX "lead_touchpoints_lead_idx" ON "lead_touchpoints" USING btree ("lead_id","occurred_at");