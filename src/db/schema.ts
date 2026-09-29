import {
  pgTable,
  serial,
  text,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export type Role = "collector" | "recycler" | "admin";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  phone: text("phone").unique(),
  otpHash: text("otp_hash"),
  otpExpiresAt: timestamp("otp_expires_at"),
  otpAttempts: integer("otp_attempts").notNull().default(0),
  otpCreatedAt: timestamp("otp_created_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectorProfiles = pgTable("collector_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  generalLocation: text("general_location").notNull(),
  operatingSince: text("operating_since"),
});

export const recyclerProfiles = pgTable("recycler_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  facilityLocation: text("facility_location").notNull(),
  serviceArea: text("service_area").notNull(),
  materialsAccepted: jsonb("materials_accepted").notNull().$type<string[]>(),
  authorizationStatus: text("authorization_status").notNull(), // demo_authorized | pending
  authorizationDetails: text("authorization_details"),
  contact: text("contact").notNull(),
  pickupAvailable: boolean("pickup_available").notNull().default(true),
  offeredRates: jsonb("offered_rates").notNull().$type<Record<string, number>>(),
});

export const materialCatalog = pgTable("material_catalog", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  iconKey: text("icon_key").notNull(),
  unit: text("unit").notNull().default("kg"),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  buyingRate: doublePrecision("buying_rate").notNull(),
  minRate: doublePrecision("min_rate").notNull(),
  maxRate: doublePrecision("max_rate").notNull(),
  unit: text("unit").notNull().default("kg"),
  trend: text("trend").notNull().default("stable"), // up | down | stable
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  rate: doublePrecision("rate").notNull(),
});

export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  lotCode: text("lot_code").notNull().unique(),
  syncId: text("sync_id").unique(),
  collectorId: integer("collector_id").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  imageData: text("image_data"),
  weightKg: doublePrecision("weight_kg").notNull(),
  condition: text("condition").notNull(),
  collectionLocation: text("collection_location").notNull(),
latitude: doublePrecision("latitude"),
longitude: doublePrecision("longitude"),
estimatedValue: doublePrecision("estimated_value").notNull().default(0),
  requestedRecyclerId: integer("requested_recycler_id"),
  status: text("status").notNull().default("open"), // open | quoted | accepted | handover | completed | cancelled
  synced: boolean("synced").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const metalConservation = pgTable("metal_conservation", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  metal: text("metal").notNull(),
  estimatedKg: doublePrecision("estimated_kg").notNull(),
  recoveredKg: doublePrecision("recovered_kg").notNull().default(0),
  recoveryRate: doublePrecision("recovery_rate").notNull().default(0),
  source: text("source").notNull().default("prototype-estimate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  recyclerId: integer("recycler_id").notNull(),
  ratePerKg: doublePrecision("rate_per_kg").notNull(),
  pickupAvailable: boolean("pickup_available").notNull().default(true),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txCode: text("tx_code").notNull().unique(),
  handoverRef: text("handover_ref").notNull().unique(),
  lotId: integer("lot_id").notNull(),
  collectorId: integer("collector_id").notNull(),
  recyclerId: integer("recycler_id").notNull(),
  quoteId: integer("quote_id"),
  quotedPrice: doublePrecision("quoted_price").notNull(),
  finalPrice: doublePrecision("final_price").notNull(),
  collectionLocation: text("collection_location").notNull(),
  handoverLocation: text("handover_location"),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash | upi | other
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid
  status: text("status").notNull().default("active"), // active | completed | cancelled

  handoverOtpHash: text("handover_otp_hash"),
  handoverOtpExpiresAt: timestamp("handover_otp_expires_at"),
  handoverOtpAttempts: integer("handover_otp_attempts").notNull().default(0),
  handoverOtpCreatedAt: timestamp("handover_otp_created_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const traceEvents = pgTable("trace_events", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  txId: integer("tx_id"),
  stage: text("stage").notNull(),
  label: text("label").notNull(),
  location: text("location"),
  ref: text("ref"),
  at: timestamp("at").defaultNow().notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  collectorId: integer("collector_id").notNull(),
  txId: integer("tx_id").notNull(),
  lotId: integer("lot_id").notNull(),
  category: text("category").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull().default("pending"), // paid | pending
  recyclerName: text("recycler_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const safetyContent = pgTable("safety_content", {
  id: serial("id").primaryKey(),
  topicKey: text("topic_key").notNull(),
  iconKey: text("icon_key").notNull(),
  lang: text("lang").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

export const fieldResearch = pgTable("field_research", {
  id: serial("id").primaryKey(),
  participantRef: text("participant_ref").notNull(),
  generalLocation: text("general_location").notNull(),
  materialHandled: text("material_handled").notNull(),
  currentProcess: text("current_process"),
  priceAwareness: text("price_awareness"),
  formalAwareness: text("formal_awareness"),
  challenges: text("challenges"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  value: jsonb("value").notNull(),
});
