CREATE TYPE "public"."partner_category" AS ENUM('FINANCIAMENTO', 'SEGUROS', 'ARQUITETURA', 'REFORMA', 'OUTRO');--> statement-breakpoint
CREATE TABLE "market_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"value" numeric(14, 4) NOT NULL,
	"unit" text NOT NULL,
	"region" text NOT NULL,
	"period" text NOT NULL,
	"source" text NOT NULL,
	"methodology" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "partner_category" NOT NULL,
	"description" text NOT NULL,
	"cta_url" text,
	"cta_label" text,
	"terms_url" text,
	"valid_from" date,
	"valid_until" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
