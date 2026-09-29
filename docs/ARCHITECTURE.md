# K-SETU — System Architecture

## 1. Overview

K-SETU is a web-based e-waste collection and recycling coordination prototype. It provides role-based workflows for collectors, recyclers, and administrators through a shared Next.js application.

The system is designed around:
- A mobile-first collector experience.
- A responsive recycler interface.
- An administrative dashboard.
- A centralized API and service layer.
- PostgreSQL persistence through Drizzle ORM.
- Prototype ML and offline-tolerant capabilities.

> **Prototype scope:** K-SETU is a demonstration system. Some data, including recycler profiles, prices, transactions, and ML outputs, may be synthetic or illustrative. Map markers for recyclers are approximate city-level locations, not verified facility coordinates.

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────┐
│                 User Interfaces             │
│                                             │
│  Collector      Recycler       Admin         │
│  Dashboard      Dashboard      Dashboard     │
│  Lot Creation   Quotes         Analytics     │
│  Earnings       Handovers      Records       │
│  Map Picker     Transactions   System Tools  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Next.js Application              │
│                                             │
│  App Router Pages                           │
│  API Routes                                 │
│  Authentication and Session Handling        │
│  Route Protection and Role Checks            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               Service Layer                  │
│                                             │
│  src/lib/services.ts                        │
│  Business Workflows                         │
│  Lot and Quote Operations                   │
│  Handover and Transaction Operations        │
│  Administrative Operations                  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              Data and Support                │
│                                             │
│  Drizzle ORM       PostgreSQL                │
│  src/lib/ml.ts     Prototype Inference        │
│  src/lib/offline.ts Local Cache and Queue     │
│  src/lib/i18n.tsx  Language Utilities         │
│  QR and Map Components                       │
└─────────────────────────────────────────────┘
```

## 3. Application Layers

### 3.1 Presentation Layer

The presentation layer is implemented with Next.js App Router, React, and Tailwind CSS.

Main role-based routes:

| Role | Route | Responsibilities |
|---|---|---|
| Collector | `/collector` | Dashboard, lot creation, prices, recyclers, earnings, safety, and profile |
| Recycler | `/recycler` | Dashboard, available lots, quotes, handovers, transactions, and profile |
| Admin | `/admin` | Analytics, insights, records, and system controls |
| Public verification | `/verify/[ref]` | Handover reference verification |
| Login | `/login` | Authentication and demo login |

Reusable interface components are stored in `src/components/`. They include shared UI elements, charts, QR functionality, the interactive recycler map, the lot location picker, and voice assistance.

### 3.2 API Layer

The API layer is implemented using Next.js route handlers.

Key API areas include:

- Authentication routes under `/api/auth/`.
- Application health at `/api/health`.
- A REST dispatcher at `/api/[...slug]`.
- Geocoding at `/api/geocode`.
- Handover verification at `/api/handovers/[id]/verify-otp`.
- Metal conservation information at `/api/metal-conservation`.
- Text-to-speech functionality at `/api/tts`.

The API layer validates incoming data, checks authorization where required, and delegates business operations to service modules.

The exact routes and request/response details are documented in [API.md](API.md).

### 3.3 Service Layer

The main service module is `src/lib/services.ts`.

It coordinates application workflows such as:
- E-waste lot creation and retrieval.
- Recycler quote handling.
- Quote acceptance.
- Handover and payment-related status updates.
- Earnings and transaction records.
- Administrative operations and demonstration data reset.

Keeping business operations in a service layer helps separate workflow logic from individual page components and API route handlers.

### 3.4 Data Layer

K-SETU uses PostgreSQL for relational persistence and Drizzle ORM for schema definitions and database access.

Important database files:

| File | Purpose |
|---|---|
| `src/db/schema.ts` | Table and relationship definitions |
| `src/db/index.ts` | Database connection and access setup |
| `src/db/seed.ts` | Demonstration data seeding |
| `drizzle/` | Schema migration and metadata files |

Database structure and relationships are described in [DATABASE.md](DATABASE.md).

## 4. Authentication and Authorization

Authentication uses password hashing with scrypt and HMAC-signed HTTP-only session cookies.

The authentication flow is broadly:

1. The user signs in through the login interface.
2. The server validates the submitted credentials.
3. The server creates a signed session cookie after successful authentication.
4. Protected application routes and API operations verify the session.
5. Role-based checks restrict access to authorized operations.

The application includes collector, recycler, and admin roles. Authorization must be enforced on the server, rather than relying only on hidden navigation links or client-side checks.

Route protection is implemented through `src/middleware.ts`, with additional authorization checks in API handling.

See [SECURITY.md](SECURITY.md) for implementation and deployment considerations.

## 5. Core Data Flows

### 5.1 E-Waste Lot Creation

1. A collector opens the lot creation workflow.
2. The collector enters material details, weight, and other required information.
3. The collector may attach a photo and select a location using the interactive map picker.
4. The application submits the lot data through the API.
5. The service layer validates and processes the request.
6. The resulting lot is stored in PostgreSQL when database-backed operation is enabled.

### 5.2 Recycler Discovery and Quote Workflow

1. The collector opens recycler discovery.
2. The application displays available recycler profiles and approximate city-level map markers.
3. The collector selects a recycler and requests a quote.
4. The recycler reviews the request and submits a quote.
5. The collector can review and accept an available quote.
6. The workflow proceeds to handover and related transaction records.

### 5.3 Handover and Verification

1. The application creates or references a handover record.
2. The collector and recycler follow the supported handover workflow.
3. Verification and status updates are handled through the relevant application routes.
4. QR functionality provides access to the handover verification page.
5. The application displays the associated traceability and transaction information.

A demonstration reference such as `HS-2026-XXXXX` is illustrative and should not be treated as a verified real-world recycling certificate.

### 5.4 Administrative Workflow

Administrators can access analytics, insights, records, and system controls through the admin interface. Administrative operations require appropriate authorization.

The demo reset function is intended for demonstration environments and can be disabled by setting:

```env
DISABLE_LOCAL_DEMO=true
```

## 6. Maps and Location

K-SETU uses Leaflet-based interactive map components with OpenStreetMap tiles.

The two primary map components are:

- `src/components/IndiaRecyclerMap.tsx` — displays recycler discovery markers.
- `src/components/LotLocationPicker.tsx` — allows a collector to select a lot location.

Recycler markers are approximate city-level demonstration locations because the current recycler profiles do not necessarily contain verified facility coordinates.

The lot location picker supports selecting and adjusting a location on the map. Geocoding functionality is provided through the application's geocoding API route.

Map tile loading and geocoding availability depend on network connectivity and the relevant service.

## 7. Machine-Learning Layer

The prototype ML implementation is located in `src/lib/ml.ts`.

It currently uses heuristic inference logic rather than a deployed, validated production model. The implementation provides integration points for future model-based capabilities.

Potential future technologies include:
- MobileNetV3 and OpenCV for image-based material classification.
- XGBoost for structured-data prediction tasks.
- Isolation Forest for anomaly detection.

The repository contains synthetic CSV datasets under `ml/datasets/`. These datasets are intended for demonstration and future development, not as evidence of model performance on real-world e-waste.

Details are available in [ML.md](ML.md) and [DATASET.md](DATASET.md).

## 8. Offline-Tolerant Architecture

Offline support is implemented in `src/lib/offline.ts`.

The current approach includes:
- Local caching of supported information.
- A client-side synchronization queue.
- Synchronization through the application's sync API when connectivity returns.

The offline layer is intended to improve resilience for supported collector workflows. It does not imply that every feature is available offline or that queued operations have been persisted by the server before synchronization succeeds.

See [OFFLINE.md](OFFLINE.md) for further details.

## 9. Internationalization and Voice Assistance

Language utilities are maintained in `src/lib/i18n.tsx`. They support the application's multilingual interface.

Voice assistance is implemented in `src/components/VoiceAssistant.tsx`, with speech-related API functionality available through `/api/tts`.

Actual language coverage, speech availability, and browser compatibility depend on the implemented interface and runtime environment.

## 10. Deployment Architecture

For local development, the Next.js application runs on the developer's machine and connects to the configured PostgreSQL database.

For a public deployment, the architecture requires:
- A supported Next.js hosting environment.
- A reachable managed PostgreSQL database.
- Securely configured environment variables.
- Production-appropriate session secrets and access controls.
- A deployment configuration that does not expose local-only demo controls.

A deployment platform such as Vercel can be connected to the GitHub repository for automated deployments. A hosted database is required if the deployed application cannot reach the developer's local database.

Production readiness requires separate review of security, privacy, data retention, availability, and operational monitoring.

## 11. Repository Reference

```text
src/
  app/                 App Router pages and API routes
  components/          Shared UI, maps, charts, QR, voice assistant
  db/                  Database schema, connection, and seed data
  lib/                  Services, auth, ML, offline, and i18n
  middleware.ts         Route protection

drizzle/                Database migration files and metadata
ml/datasets/            Synthetic demonstration datasets
docs/                   Project documentation
public/                 Static assets
```

## 12. Related Documentation

- [README](../README.md) — overview and setup
- [API](API.md) — API endpoints and workflows
- [Database](DATABASE.md) — database schema
- [Dataset](DATASET.md) — dataset descriptions and limitations
- [Demo](DEMO.md) — demonstration walkthrough
- [Environment](ENVIRONMENT.md) — configuration
- [Field Research](FIELD_RESEARCH.md) — field research context
- [Machine Learning](ML.md) — prototype ML approach
- [Offline](OFFLINE.md) — caching and synchronization
- [Security](SECURITY.md) — authentication and safeguards
- [Unit Economics](UNIT_ECONOMICS.md) — economic assumptions