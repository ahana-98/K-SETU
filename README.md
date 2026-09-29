# K-SETU — COLLECT • CONNECT • RECYCLE

**Smart India Hackathon 2026 | E-Waste Collection and Recycling Prototype**

K-SETU is a vernacular, low-literacy, offline-tolerant platform designed to connect informal e-waste collectors and scrap dealers with recyclers. It supports e-waste listing, prototype AI-assisted classification, price estimates, recycler discovery, quote requests, traceable handovers, and an earnings ledger.

> **Prototype notice:** K-SETU is a demonstration prototype. Prices, recycler profiles, transactions, and machine-learning outputs may use synthetic or demonstration data. These are not verified commercial offers, certified recycling records, or production ML predictions.

## Key Features

- **Collector dashboard:** Create and track e-waste lots, review price estimates, and monitor earnings.
- **E-waste listing:** Submit material details, weight, photos, and collection location.
- **Interactive location picker:** Select a lot location on a map and update its coordinates.
- **Prototype AI classification:** Demonstrate material classification and estimated value using a heuristic inference layer.
- **Price board:** View demonstration material prices.
- **Recycler discovery:** Explore recycler listings on an interactive map with approximate city-level demo markers.
- **Quote workflow:** Request and submit recycler quotes, then accept an offer.
- **Traceable handovers:** Track handover references and verification status.
- **QR verification:** Generate and view QR-based handover verification pages.
- **Earnings ledger:** Review collector earnings and transaction information.
- **Admin dashboard:** Review records, analytics, and demo system controls.
- **Offline-tolerant workflow:** Cache selected information and queue supported actions for later synchronization.
- **Multilingual interface:** Language support through the app's internationalization utilities.
- **Voice assistance:** Includes a voice assistant interface for supported interactions.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend and backend-for-frontend | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM and schema management | Drizzle ORM |
| Validation | Zod and client-side validation |
| Authentication | HMAC-signed HTTP-only session cookies |
| Password hashing | scrypt |
| Maps | Leaflet and OpenStreetMap |
| QR codes | `qrcode` |
| Offline support | localStorage cache and synchronization queue |
| Prototype ML | Heuristic inference layer with future model integration points |

## Repository Structure

```text
src/
  app/
    admin/          Admin pages and analytics
    api/            Authentication, health, geocoding,
                    handover, and other API routes
    collector/      Collector workflows and dashboards
    recycler/       Recycler workflows and dashboards
    verify/         Handover verification pages
  components/       UI components, maps, charts, QR, voice assistant
  db/               Database schema, seed data, and utilities
  lib/              Authentication, services, ML, offline, i18n
  middleware.ts     Route protection middleware

drizzle/            Database migrations and metadata
ml/datasets/        Synthetic demonstration CSV datasets
docs/               Project documentation
public/             Static assets, including the project logo
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL for database-backed operation
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ahana-98/K-SETU.git
cd K-SETU
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and configure the required values for your environment.

Example variables:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db
SESSION_SECRET=replace-with-a-strong-random-secret
DISABLE_LOCAL_DEMO=false
MAP_API_KEY=
STORAGE_KEY=
```

Use a strong, unique session secret outside local testing. Do not commit `.env`, `.env.local`, credentials, or production secrets to Git.

### 4. Prepare the database

Make sure PostgreSQL is running and the configured database exists. Then apply the Drizzle schema:

```bash
npx drizzle-kit push
```

Seed demonstration data:

```bash
npx tsx src/db/seed.ts
```

### 5. Start the application

For local development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build and run the production build locally:

```bash
npm run build
npm start
```

## Demo Accounts

The following credentials are for local demonstration only, if the included seed data has been loaded.

| Role | Email | Password |
|---|---|---|
| Collector | `collector@ksetu.demo` | `Collector@123` |
| Recycler | `recycler@ksetu.demo` | `Recycler@123` |
| Admin | `admin@ksetu.demo` | `Admin@123` |

The login page also provides one-tap demo login options. Do not reuse demonstration credentials in a production environment.

## Demonstration Workflow

1. Sign in as a collector.
2. Open **Sell E-Waste** and create a lot with material, weight, photo, and location.
3. Use the interactive map to select the collection location.
4. Review the prototype classification and estimated value.
5. Open the price board and recycler discovery map.
6. Request a quote from a recycler.
7. Sign in as a recycler and submit a quote.
8. Return to the collector account and accept the quote.
9. Follow the handover workflow and verification reference.
10. Review the collector earnings and traceability information.
11. Open the QR verification page and review the corresponding record.
12. Explore the admin dashboard and analytics.

The workflow uses demonstration data and is intended to illustrate the platform concept.

## Maps and Location Data

- The lot location picker supports map-based location selection.
- Recycler map markers represent approximate city-level demonstration locations, not necessarily the exact premises of real facilities.
- Map tiles are provided by OpenStreetMap.
- Location availability and geocoding depend on the configured services and network connection.

## Machine Learning

The current ML layer is a prototype heuristic inference implementation. The repository includes synthetic datasets and integration points for future model development, including image classification and transaction-related analysis.

The current outputs should not be interpreted as validated model predictions. Future development may explore MobileNetV3/OpenCV, XGBoost, and Isolation Forest, subject to suitable datasets, training, evaluation, and validation.

## Offline Support

K-SETU includes local caching and a synchronization queue for supported workflows. Queued actions can be synchronized through the application's sync API when connectivity returns.

Offline behavior is limited to the functionality implemented in the prototype. A successful queue operation does not necessarily mean that the server has already accepted or processed the action.

## Security and Demo Safety

- Session cookies are HTTP-only and HMAC-signed.
- Passwords are hashed using scrypt.
- API inputs are validated.
- Protected routes and role checks are implemented.
- Demo reset functionality is intended for local demonstration and can be disabled with `DISABLE_LOCAL_DEMO=true`.

This prototype has not been represented as independently security-audited or production-certified. Review the security documentation and configure production secrets, database access, storage, and deployment protections before public production use.

## Documentation

Detailed project documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Application structure and system design |
| [API](docs/API.md) | API routes and request workflows |
| [Database](docs/DATABASE.md) | Database schema and relationships |
| [Dataset](docs/DATASET.md) | Synthetic datasets and data notes |
| [Demo](docs/DEMO.md) | Demonstration walkthrough |
| [Environment](docs/ENVIRONMENT.md) | Environment variables and configuration |
| [Field Research](docs/FIELD_RESEARCH.md) | Research context and field considerations |
| [Machine Learning](docs/ML.md) | Prototype ML approach and future integration |
| [Offline](docs/OFFLINE.md) | Local caching and synchronization |
| [Security](docs/SECURITY.md) | Authentication, authorization, and safety notes |
| [Unit Economics](docs/UNIT_ECONOMICS.md) | Prototype assumptions and economic model |

## Troubleshooting

**Database connection errors**
- Confirm PostgreSQL is running.
- Check the `DATABASE_URL` in `.env.local`.
- Verify the database exists and the configured user has access.
- Re-run `npx drizzle-kit push` if the schema has not been applied.

**Login or demo data issues**
- Confirm that the database has been seeded.
- Use the documented demo accounts only for the local demonstration setup.
- Check whether local demo mode is enabled and review the application logs.

**Map or geocoding issues**
- Check your internet connection.
- Confirm that map tiles can load.
- Check the geocoding endpoint and its service availability.

**Offline synchronization issues**
- Restore connectivity and retry synchronization.
- Review the browser console and server logs for failed requests.
- Remember that queued actions may require server confirmation.

**Reset demonstration data**
- The admin system page includes a demo reset control when enabled.
- Demo reset is blocked when `DISABLE_LOCAL_DEMO=true`.

## Project Status

K-SETU is a hackathon prototype intended to demonstrate an accessible e-waste collection and recycling workflow. Features, data, integrations, and operational readiness should be evaluated according to the current implementation.

## Repository

[GitHub — K-SETU](https://github.com/ahana-98/K-SETU)