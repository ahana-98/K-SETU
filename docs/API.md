# API Reference

## Overview

K-SETU provides API endpoints for authentication, materials, prices, recyclers,
lots, quotes, handovers, traceability, offline synchronization, ML prototypes,
and administration.

The general API is served under `/api`, with dedicated authentication and
health endpoints.

> **Prototype note:** This document summarizes the routes identified in the
> project. Refer to the route handlers and service layer for exact payloads,
> validation rules, response formats, and error behavior.

## Authentication

- `POST /api/auth/login` — Sign in using credentials or a demo role.
- `POST /api/auth/logout` — End the current session.
- `GET /api/auth/session` — Retrieve current session information.

Login accepts email and password or a `demoRole`, depending on the
configured authentication mode. The application uses a signed, HTTP-only
session cookie. Protected handlers validate sessions and enforce roles
server-side.

## Health

- `GET /api/health` — Check API health.

## Materials and prices

- `GET /api/materials` — Retrieve supported material information.
- `GET /api/prices` — Retrieve material price information.
- `GET /api/prices/history` — Retrieve historical price information.

## Recycler discovery

- `GET /api/recyclers` — Retrieve recycler information.
- `POST /api/recyclers/match` — Find recycler matches for a lot.

Recycler matching is part of the prototype workflow. Matching criteria and
results may change as the application develops.

## Lots

- `GET /api/lots` — Retrieve lots available to the current user.
- `GET /api/lots/:id` — Retrieve a specific lot.
- `POST /api/lots` — Create a lot.
- `POST /api/lots/:id/estimate` — Request an estimate for a lot.
- `POST /api/lots/:id/request-quote` — Request a quote for a lot.

The `:id` segment represents a lot identifier. Collectors are restricted to
accessing their own lots, with ownership enforced by the server.

## Quotes

- `GET /api/quotes?lotId=...` — Retrieve quotes, optionally filtered by lot.
- `POST /api/quotes` — Create a quote.
- `POST /api/quotes/:id/accept` — Accept a quote.
- `POST /api/quotes/:id/reject` — Reject a quote.

The `lotId` query parameter filters quote results by lot.

## Handovers and payments

- `POST /api/handovers/:id/confirm-pickup` — Confirm pickup.
- `POST /api/handovers/:id/confirm` — Confirm a handover.
- `POST /api/handovers/:id/payment` — Submit a payment-related action.

The `:id` segment represents a handover identifier. Refer to the application
services for the exact state transitions and payment behavior.

## Transactions, ledger, and traceability

- `GET /api/transactions` — Retrieve transaction information.
- `GET /api/ledger` — Retrieve ledger information.
- `GET /api/traceability/:lotId` — Retrieve traceability information for a lot.

Collectors can access only their own ledger and transaction records.
Traceability is associated with the specified lot identifier.

## Safety and verification

- `GET /api/safety` — Retrieve safety-related information.
- `GET /api/verify?ref=...` — Verify a reference.

The `ref` query parameter identifies the reference to check.

## Offline synchronization

- `POST /api/sync` — Submit queued offline changes for synchronization.

The client may retain supported data locally while offline and submit queued
changes when connectivity returns. Synchronization behavior depends on the
server implementation; conflict-free merging should not be assumed.

## Machine-learning prototype endpoints

- `POST /api/ml/classify` — Classify material information.
- `POST /api/ml/estimate` — Generate an estimate.
- `POST /api/ml/anomaly` — Evaluate anomaly-related information.
- `POST /api/ml/recommend` — Generate a recommendation.

These endpoints expose prototype ML functionality. Their outputs are
decision-support estimates and should not be treated as independently
validated or guaranteed results.

## Administration

- `GET /api/admin/stats` — Retrieve administrative statistics.
- `GET /api/admin/collectors` — Retrieve collector information.
- `GET /api/admin/recyclers` — Retrieve recycler information.
- `GET /api/admin/settings` — Retrieve administrative settings.
- `POST /api/admin/settings` — Update administrative settings.
- `GET /api/admin/field-research` — Retrieve field-research information.
- `POST /api/admin/field-research` — Submit or update field-research information.
- `POST /api/admin/reset` — Run the demo reset operation when enabled.

Administrative routes require appropriate server-side authorization. The
demo reset operation can be disabled through configuration; when disabled,
the endpoint rejects reset requests.

## Access control

Protected routes validate the current session and enforce role-based
authorization on the server. Client-side interface restrictions do not
replace API authorization.

- Collectors can access only their own lots.
- Collectors can access only their own ledger and transaction records.
- Administrative operations require the appropriate administrative role.

## Implementation notes

- Authentication and health endpoints are separate from the general REST
  dispatcher.
- Shared service and database layers handle business logic and persistence.
- Route handlers and service functions define exact validation, payloads,
  responses, and errors.
- Never expose session secrets, database credentials, or other environment
  secrets in API responses or client-side code.

## Related documentation

- [Architecture](./ARCHITECTURE.md)
- [Database](./DATABASE.md)
- [ML](./ML.md)
- [Offline support](./OFFLINE.md)
- [Security](./SECURITY.md)
- [Environment setup](./ENVIRONMENT.md)