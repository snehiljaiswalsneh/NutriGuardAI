CREATE TYPE "public"."allergen_severity" AS ENUM('mild', 'moderate', 'severe');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('user', 'moderator', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."comparison_winner" AS ENUM('product_a', 'product_b', 'tie');--> statement-breakpoint
CREATE TYPE "public"."input_source" AS ENUM('paste', 'manual', 'ocr', 'barcode', 'voice');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('scan_complete', 'weekly_digest', 'new_ban_alert', 'system', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."regulation_status" AS ENUM('approved', 'restricted', 'banned', 'unregulated');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('safe', 'moderate', 'high', 'unknown');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" "app_role" DEFAULT 'user' NOT NULL,
	"date_of_birth" timestamp,
	"country_code" char(2),
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"language_code" char(5) DEFAULT 'en' NOT NULL,
	"notify_scan_complete" boolean DEFAULT true NOT NULL,
	"notify_weekly_digest" boolean DEFAULT false NOT NULL,
	"notify_new_ban_alert" boolean DEFAULT true NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"data_sharing_opt_in" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_health_effects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"effect" text NOT NULL,
	"severity" "risk_level" DEFAULT 'unknown' NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_research_sources" (
	"ingredient_id" uuid NOT NULL,
	"research_source_id" uuid NOT NULL,
	CONSTRAINT "ingredient_research_sources_ingredient_id_research_source_id_pk" PRIMARY KEY("ingredient_id","research_source_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"scientific_name" text,
	"e_number" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"description" text,
	"purpose" text,
	"risk_level" "risk_level" DEFAULT 'unknown' NOT NULL,
	"risk_summary" text,
	"is_natural" boolean DEFAULT false NOT NULL,
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"publisher" text,
	"published_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iso_code" char(2) NOT NULL,
	"iso_code_3" char(3),
	"name" text NOT NULL,
	"flag_emoji" text,
	"region" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_country_regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"status" "regulation_status" DEFAULT 'unregulated' NOT NULL,
	"regulation_note" text,
	"effective_date" date,
	"source_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_allergens" (
	"ingredient_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL,
	"severity" "allergen_severity" DEFAULT 'moderate' NOT NULL,
	"note" text,
	CONSTRAINT "ingredient_allergens_ingredient_id_allergen_id_pk" PRIMARY KEY("ingredient_id","allergen_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_alternatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"alternative_ingredient_id" uuid,
	"alt_product_name" text,
	"reason" text NOT NULL,
	"score_delta" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredient_alternatives_target_present" CHECK ("ingredient_alternatives"."alternative_ingredient_id" is not null or "ingredient_alternatives"."alt_product_name" is not null)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ingredient_id" uuid,
	"raw_text" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"match_confidence" numeric(4, 3),
	CONSTRAINT "product_ingredients_confidence_range" CHECK ("product_ingredients"."match_confidence" is null or ("product_ingredients"."match_confidence" >= 0 and "product_ingredients"."match_confidence" <= 1))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"name" text NOT NULL,
	"barcode" text,
	"image_url" text,
	"raw_ingredient_text" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_summaries" (
	"scan_id" uuid PRIMARY KEY NOT NULL,
	"summary_text" text NOT NULL,
	"allergy_warning" text,
	"model_name" text DEFAULT 'claude-sonnet-5' NOT NULL,
	"prompt_version" text DEFAULT 'v1' NOT NULL,
	"token_count" integer,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scan_a_id" uuid NOT NULL,
	"scan_b_id" uuid NOT NULL,
	"winner" "comparison_winner" NOT NULL,
	"recommendation_text" text NOT NULL,
	"compared_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparisons_distinct_scans" CHECK ("comparisons"."scan_a_id" <> "comparisons"."scan_b_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "safety_scores" (
	"scan_id" uuid PRIMARY KEY NOT NULL,
	"score" smallint NOT NULL,
	"verdict" "risk_level" NOT NULL,
	"ingredient_count" smallint DEFAULT 0 NOT NULL,
	"flagged_count" smallint DEFAULT 0 NOT NULL,
	"scoring_version" text DEFAULT 'v1' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safety_scores_score_range" CHECK ("safety_scores"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"ai_model_version" text DEFAULT 'ai-analyzer-v1' NOT NULL,
	"input_source" "input_source" DEFAULT 'paste' NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error_message" text,
	CONSTRAINT "scans_error_only_when_failed" CHECK (("scans"."status" = 'failed' and "scans"."error_message" is not null) or ("scans"."status" <> 'failed'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_health_effects" ADD CONSTRAINT "ingredient_health_effects_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_research_sources" ADD CONSTRAINT "ingredient_research_sources_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_research_sources" ADD CONSTRAINT "ingredient_research_sources_research_source_id_research_sources_id_fk" FOREIGN KEY ("research_source_id") REFERENCES "public"."research_sources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_ingredient_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_country_regulations" ADD CONSTRAINT "ingredient_country_regulations_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_country_regulations" ADD CONSTRAINT "ingredient_country_regulations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_country_regulations" ADD CONSTRAINT "ingredient_country_regulations_source_id_research_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."research_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergen_id_allergens_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_alternatives" ADD CONSTRAINT "ingredient_alternatives_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredient_alternatives" ADD CONSTRAINT "ingredient_alternatives_alternative_ingredient_id_ingredients_id_fk" FOREIGN KEY ("alternative_ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_scan_a_id_scans_id_fk" FOREIGN KEY ("scan_a_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_scan_b_id_scans_id_fk" FOREIGN KEY ("scan_b_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_scores" ADD CONSTRAINT "safety_scores_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scans" ADD CONSTRAINT "scans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ingredient_categories_slug_uk" ON "ingredient_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredient_categories_parent_id" ON "ingredient_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredient_health_effects_ingredient_id" ON "ingredient_health_effects" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_name_uk" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredients_category_id" ON "ingredients" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredients_risk_level" ON "ingredients" USING btree ("risk_level");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "research_sources_url_uk" ON "research_sources" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "countries_iso_code_uk" ON "countries" USING btree ("iso_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ingredient_country_regulations_uk" ON "ingredient_country_regulations" USING btree ("ingredient_id","country_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_icr_country_id" ON "ingredient_country_regulations" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_icr_status" ON "ingredient_country_regulations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "allergens_slug_uk" ON "allergens" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredient_allergens_allergen_id" ON "ingredient_allergens" USING btree ("allergen_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredient_alternatives_ingredient_id" ON "ingredient_alternatives" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingredient_alternatives_alt_ingredient_id" ON "ingredient_alternatives" USING btree ("alternative_ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_uk" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_ingredients_uk" ON "product_ingredients" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_ingredients_ingredient_id" ON "product_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_brand_id" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_created_by" ON "products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comparisons_user_id_compared_at" ON "comparisons" USING btree ("user_id","compared_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comparisons_scan_a_id" ON "comparisons" USING btree ("scan_a_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comparisons_scan_b_id" ON "comparisons" USING btree ("scan_b_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scans_user_id_scanned_at" ON "scans" USING btree ("user_id","scanned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scans_product_id" ON "scans" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id_unread" ON "notifications" USING btree ("user_id","created_at");