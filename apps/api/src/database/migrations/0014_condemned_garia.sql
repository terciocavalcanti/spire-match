CREATE TYPE "public"."data_subject_request_status" AS ENUM('PENDENTE', 'CONCLUIDO', 'REJEITADO');--> statement-breakpoint
CREATE TYPE "public"."data_subject_request_type" AS ENUM('EXPORTACAO', 'EXCLUSAO');--> statement-breakpoint
CREATE TABLE "data_subject_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "data_subject_request_type" NOT NULL,
	"status" "data_subject_request_status" DEFAULT 'PENDENTE' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"handled_by_user_id" uuid,
	"rejection_reason" text
);
--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_handled_by_user_id_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_subject_requests_status_idx" ON "data_subject_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "data_subject_requests_user_idx" ON "data_subject_requests" USING btree ("user_id");