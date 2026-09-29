CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collector_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"general_location" text NOT NULL,
	"operating_since" text
);
--> statement-breakpoint
CREATE TABLE "field_research" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_ref" text NOT NULL,
	"general_location" text NOT NULL,
	"material_handled" text NOT NULL,
	"current_process" text,
	"price_awareness" text,
	"formal_awareness" text,
	"challenges" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" integer NOT NULL,
	"tx_id" integer NOT NULL,
	"lot_id" integer NOT NULL,
	"category" text NOT NULL,
	"weight_kg" double precision NOT NULL,
	"amount" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"recycler_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_code" text NOT NULL,
	"collector_id" integer NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"image_data" text,
	"weight_kg" double precision NOT NULL,
	"condition" text NOT NULL,
	"collection_location" text NOT NULL,
	"estimated_value" double precision DEFAULT 0 NOT NULL,
	"requested_recycler_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"synced" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lots_lot_code_unique" UNIQUE("lot_code")
);
--> statement-breakpoint
CREATE TABLE "material_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"icon_key" text NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"date" timestamp NOT NULL,
	"rate" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"buying_rate" double precision NOT NULL,
	"min_rate" double precision NOT NULL,
	"max_rate" double precision NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"recycler_id" integer NOT NULL,
	"rate_per_kg" double precision NOT NULL,
	"pickup_available" boolean DEFAULT true NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recycler_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"facility_location" text NOT NULL,
	"service_area" text NOT NULL,
	"materials_accepted" jsonb NOT NULL,
	"authorization_status" text NOT NULL,
	"authorization_details" text,
	"contact" text NOT NULL,
	"pickup_available" boolean DEFAULT true NOT NULL,
	"offered_rates" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_key" text NOT NULL,
	"icon_key" text NOT NULL,
	"lang" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"tx_id" integer,
	"stage" text NOT NULL,
	"label" text NOT NULL,
	"location" text,
	"ref" text,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_code" text NOT NULL,
	"handover_ref" text NOT NULL,
	"lot_id" integer NOT NULL,
	"collector_id" integer NOT NULL,
	"recycler_id" integer NOT NULL,
	"quote_id" integer,
	"quoted_price" double precision NOT NULL,
	"final_price" double precision NOT NULL,
	"collection_location" text NOT NULL,
	"handover_location" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tx_code_unique" UNIQUE("tx_code"),
	CONSTRAINT "transactions_handover_ref_unique" UNIQUE("handover_ref")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
