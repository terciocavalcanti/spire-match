CREATE TYPE "public"."integration_connection_status" AS ENUM('PENDENTE', 'ATIVA', 'PAUSADA');--> statement-breakpoint
CREATE TYPE "public"."integration_direction" AS ENUM('ENTRADA', 'SAIDA', 'AMBAS');--> statement-breakpoint
CREATE TYPE "public"."integration_event_direction" AS ENUM('ENTRADA', 'SAIDA');--> statement-breakpoint
CREATE TYPE "public"."integration_event_status" AS ENUM('PENDENTE', 'PROCESSADO', 'FALHOU', 'DUPLICADO');--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"direction" "integration_direction" DEFAULT 'AMBAS' NOT NULL,
	"status" "integration_connection_status" DEFAULT 'PENDENTE' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"direction" "integration_event_direction" NOT NULL,
	"event_type" text NOT NULL,
	"external_event_id" text,
	"entity_type" text,
	"internal_id" uuid,
	"payload" jsonb NOT NULL,
	"status" "integration_event_status" DEFAULT 'PENDENTE' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integration_external_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"internal_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_external_refs" ADD CONSTRAINT "integration_external_refs_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integration_events_connection_status_idx" ON "integration_events" USING btree ("connection_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_events_dedupe_uq" ON "integration_events" USING btree ("connection_id","external_event_id") WHERE "integration_events"."external_event_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "integration_external_refs_external_uq" ON "integration_external_refs" USING btree ("connection_id","entity_type","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_external_refs_internal_uq" ON "integration_external_refs" USING btree ("connection_id","entity_type","internal_id");