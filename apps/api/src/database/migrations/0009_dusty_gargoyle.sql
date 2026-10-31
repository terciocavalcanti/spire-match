CREATE TYPE "public"."owner_lead_activity_type" AS ENUM('CREATED', 'STAGE_CHANGED', 'ASSIGNED', 'NOTE', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."owner_lead_intent" AS ENUM('VENDER', 'ALUGAR', 'ACEITAR_PROPOSTA');--> statement-breakpoint
CREATE TYPE "public"."owner_lead_stage" AS ENUM('NOVO', 'TRIAGEM', 'APROVADO', 'REJEITADO', 'CONVERTIDO');--> statement-breakpoint
CREATE TABLE "owner_lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_lead_id" uuid NOT NULL,
	"type" "owner_lead_activity_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_broker_id" uuid,
	"stage" "owner_lead_stage" DEFAULT 'NOVO' NOT NULL,
	"intent" "owner_lead_intent" NOT NULL,
	"property_type" "property_type" NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"area_sqm" numeric(10, 2) NOT NULL,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"parking_spaces" integer DEFAULT 0 NOT NULL,
	"asking_price" numeric(14, 2),
	"description" text DEFAULT '' NOT NULL,
	"consent_capture_at" timestamp with time zone NOT NULL,
	"linked_property_id" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "owner_lead_activities" ADD CONSTRAINT "owner_lead_activities_owner_lead_id_owner_leads_id_fk" FOREIGN KEY ("owner_lead_id") REFERENCES "public"."owner_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_leads" ADD CONSTRAINT "owner_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_leads" ADD CONSTRAINT "owner_leads_assigned_broker_id_brokers_id_fk" FOREIGN KEY ("assigned_broker_id") REFERENCES "public"."brokers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_leads" ADD CONSTRAINT "owner_leads_linked_property_id_properties_id_fk" FOREIGN KEY ("linked_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_lead_activities_owner_lead_idx" ON "owner_lead_activities" USING btree ("owner_lead_id","created_at");--> statement-breakpoint
CREATE INDEX "owner_leads_stage_idx" ON "owner_leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "owner_leads_broker_idx" ON "owner_leads" USING btree ("assigned_broker_id");