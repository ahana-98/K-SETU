# Database
PostgreSQL via Drizzle ORM. Tables: users, collector_profiles, recycler_profiles,
material_catalog, prices, price_history, lots, quotes, transactions, trace_events,
ledger_entries, safety_content, field_research, app_settings.
Setup: `npx drizzle-kit push`; seed: `npx tsx src/db/seed.ts`.
Seed is idempotent and creates the 3 demo accounts first (ids 1-3 on a fresh DB).
