CREATE TYPE "public"."lead_activity_type" AS ENUM('CREATED', 'STAGE_CHANGED', 'CONTACT', 'VISIT_SCHEDULED', 'VISIT_CANCELLED', 'PROPOSAL_RECEIVED', 'ASSIGNED', 'NOTE');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('NOVO', 'QUALIFICANDO', 'INTERESSE', 'VISITA', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_activity_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_property_id" uuid,
	"assigned_broker_id" uuid,
	"stage" "lead_stage" DEFAULT 'NOVO' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"won_amount" numeric(14, 2),
	"lost_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_property_id_properties_id_fk" FOREIGN KEY ("source_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_broker_id_brokers_id_fk" FOREIGN KEY ("assigned_broker_id") REFERENCES "public"."brokers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "leads_broker_idx" ON "leads" USING btree ("assigned_broker_id");