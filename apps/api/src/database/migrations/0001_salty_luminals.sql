CREATE TYPE "public"."exclusive_type" AS ENUM('EXCLUSIVO', 'PRE_LANCAMENTO', 'OPORTUNIDADE');--> statement-breakpoint
CREATE TYPE "public"."listing_purpose" AS ENUM('MORAR', 'INVESTIR');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('A_VISTA', 'FINANCIAMENTO', 'CONSORCIO', 'PERMUTA');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('APARTAMENTO', 'CASA', 'COBERTURA');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('VIEW', 'LIKE', 'DISLIKE', 'FAVORITE', 'UNFAVORITE', 'SHARE', 'COMPARE', 'CONTACT', 'VISIT_REQUEST', 'SIMULATION', 'PROPOSAL');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "property_type" NOT NULL,
	"purpose" "listing_purpose" NOT NULL,
	"status" "property_status" DEFAULT 'DRAFT' NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"condominium_fee" numeric(14, 2),
	"iptu" numeric(14, 2),
	"area_sqm" numeric(10, 2) NOT NULL,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"bathrooms" integer DEFAULT 0 NOT NULL,
	"parking_spaces" integer DEFAULT 0 NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"cover_image_url" text,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"accepted_payment_methods" "payment_method"[] DEFAULT '{}'::payment_method[] NOT NULL,
	"is_exclusive" boolean DEFAULT false NOT NULL,
	"exclusive_type" "exclusive_type",
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_min" numeric(14, 2),
	"budget_max" numeric(14, 2),
	"desired_neighborhoods" text[] DEFAULT '{}'::text[] NOT NULL,
	"min_area_sqm" numeric(10, 2),
	"min_bedrooms" integer,
	"min_parking_spaces" integer,
	"purpose" "listing_purpose",
	"payment_methods" "payment_method"[] DEFAULT '{}'::payment_method[] NOT NULL,
	"desired_features" text[] DEFAULT '{}'::text[] NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"type" "interaction_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"ruleset_version" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"distance_meters" double precision,
	"distance_source" text,
	"eliminated" boolean DEFAULT false NOT NULL,
	"elimination_reason" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_price_history" ADD CONSTRAINT "property_price_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_neighborhood_idx" ON "properties" USING btree ("neighborhood");--> statement-breakpoint
CREATE INDEX "properties_lat_lng_idx" ON "properties" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX "property_images_property_idx" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_property_uq" ON "favorites" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "user_interactions_user_idx" ON "user_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_interactions_property_idx" ON "user_interactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "user_interactions_type_idx" ON "user_interactions" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "match_results_user_property_uq" ON "match_results" USING btree ("user_id","property_id");