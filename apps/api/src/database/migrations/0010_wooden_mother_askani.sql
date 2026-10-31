CREATE TYPE "public"."private_market_offer_status" AS ENUM('PENDENTE_VERIFICACAO', 'ELEGIVEL', 'INATIVO');--> statement-breakpoint
CREATE TABLE "private_market_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_lead_id" uuid NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	CONSTRAINT "private_market_consents_owner_lead_id_unique" UNIQUE("owner_lead_id")
);
--> statement-breakpoint
CREATE TABLE "private_market_contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_market_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_lead_id" uuid NOT NULL,
	"status" "private_market_offer_status" DEFAULT 'PENDENTE_VERIFICACAO' NOT NULL,
	"min_price" numeric(14, 2),
	"anonymized_summary" text,
	"offer_deadline" timestamp with time zone,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "private_market_offers_owner_lead_id_unique" UNIQUE("owner_lead_id")
);
--> statement-breakpoint
ALTER TABLE "private_market_consents" ADD CONSTRAINT "private_market_consents_owner_lead_id_owner_leads_id_fk" FOREIGN KEY ("owner_lead_id") REFERENCES "public"."owner_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_market_contact_requests" ADD CONSTRAINT "private_market_contact_requests_offer_id_private_market_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."private_market_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_market_contact_requests" ADD CONSTRAINT "private_market_contact_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_market_offers" ADD CONSTRAINT "private_market_offers_owner_lead_id_owner_leads_id_fk" FOREIGN KEY ("owner_lead_id") REFERENCES "public"."owner_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_market_offers" ADD CONSTRAINT "private_market_offers_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_market_contact_requests_offer_idx" ON "private_market_contact_requests" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "private_market_offers_status_idx" ON "private_market_offers" USING btree ("status");