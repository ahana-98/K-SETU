# Architecture
Collector mobile-first PWA → Recycler responsive web → Admin dashboard.
All three talk to a single Next.js API layer (`/api/auth/*`, `/api/health`,
`/api/[...slug]` REST dispatcher) → service modules (`src/lib/services.ts`) →
Drizzle ORM → PostgreSQL. ML heuristics live in `src/lib/ml.ts` behind stable
signatures so real models can replace them. Offline layer in `src/lib/offline.ts`
queues lots in localStorage and flushes via `POST /api/sync`. Auth is an
HMAC-signed HTTP-only cookie verified in `src/middleware.ts` (edge) and in every
API handler (node), enforcing role-based access server-side.
