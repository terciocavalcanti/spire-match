CREATE TYPE "public"."development_status" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('AVAILABLE', 'RESERVED', 'SOLD');--> statement-breakpoint
CREATE TABLE "development_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"development_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "development_status" DEFAULT 'DRAFT' NOT NULL,
	"incorporator_name" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"cover_image_url" text,
	"price_from" numeric(14, 2),
	"delivery_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "developments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "unit_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"development_id" uuid NOT NULL,
	"block_id" uuid,
	"identifier" text NOT NULL,
	"floor" integer,
	"area_sqm" numeric(10, 2) NOT NULL,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"parking_spaces" integer DEFAULT 0 NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"status" "unit_status" DEFAULT 'AVAILABLE' NOT NULL,
	"property_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "development_blocks" ADD CONSTRAINT "development_blocks_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_price_history" ADD CONSTRAINT "unit_price_history_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_block_id_development_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."development_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "development_blocks_development_idx" ON "development_blocks" USING btree ("development_id");--> statement-breakpoint
CREATE INDEX "developments_status_idx" ON "developments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "units_development_idx" ON "units" USING btree ("development_id");--> statement-breakpoint
CREATE INDEX "units_status_idx" ON "units" USING btree ("status");