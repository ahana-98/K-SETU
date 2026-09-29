# K-SETU — COLLECT • CONNECT • RECYCLE

Smart India Hackathon 2026 prototype. K-SETU is a vernacular, low-literacy,
offline-tolerant platform that connects informal e-waste collectors and scrap
dealers with authorized recyclers for fair prices, safe handling, traceable
handovers and an earnings ledger.

> This is a LOCAL DEMO PROTOTYPE. All prices, recyclers, transactions and ML
> outputs are DEMO / SYNTHETIC / PROTOTYPE data, clearly labeled in the UI.

## Tech stack
- Frontend / BFF: Next.js 16 (App Router), React 19, Tailwind CSS 4
- Database: PostgreSQL + Drizzle ORM
- Auth: HMAC-signed HTTP-only session cookies (Web Crypto), scrypt password hashing
- Validation: Zod (API) + client-side checks
- ML: prototype heuristic inference layer (swap-in points for MobileNetV3/OpenCV,
  XGBoost, Isolation Forest)
- Offline: localStorage cache + sync queue → `POST /api/sync`
- QR: `qrcode` (local generation, no external API)

## Folder structure
```
src/app            pages + API routes (auth, health, [...slug] REST dispatcher)
src/components     design system (ui.tsx), charts, QR
src/db             schema.ts, seed.ts, index.ts
src/lib            auth, password, services, ml, offline, i18n
ml/datasets        synthetic CSV datasets for future ML training
docs/              architecture, API, ML, security, offline, demo docs
```

## Installation & local startup
```bash
npm install
cp .env.example .env          # set DATABASE_URL
npx drizzle-kit push          # create schema
npx tsx src/db/seed.ts        # seed demo data
npm run build && npm start    # or: npm run dev
```
Open http://localhost:3000

## Demo credentials (DEMO ONLY)
| Role      | Email                 | Password      |
|-----------|-----------------------|---------------|
| Collector | collector@ksetu.demo  | Collector@123 |
| Recycler  | recycler@ksetu.demo   | Recycler@123  |
| Admin     | admin@ksetu.demo      | Admin@123     |

The login screen also provides one-tap DEMO LOGIN buttons.

## Demo workflow
Collector login → SELL E-WASTE → photo → 8 kg PCB → AI classification (prototype)
→ estimated value → PRICE BOARD → FIND RECYCLER → request quote → Recycler login
→ submit quote → Collector accepts → handover reference HS-2026-XXXXX → recycler
confirms pickup/handover → marks payment → collector earnings + traceability
update → QR verification page → Admin analytics reflect changes.

## Troubleshooting
- Database offline: login still works via clearly-labeled LOCAL DEMO MODE.
- Offline collector: lots are queued locally and sync when connectivity returns.
- Reset: Admin → System → RESET DEMO DATA.
