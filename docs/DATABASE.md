# Database Documentation

## Overview

K-SETU uses **PostgreSQL** as its relational database and **Drizzle ORM** for database schema management and application data access.

The database supports user accounts, collector and recycler profiles, material information, pricing, e-waste lots, quotations, transactions, traceability, ledger records, safety content, field research, and application settings.

## Database Tables

The application includes the following tables:

| Table                | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `users`              | Stores user account information.                      |
| `collector_profiles` | Stores collector-specific profile information.        |
| `recycler_profiles`  | Stores recycler-specific profile information.         |
| `material_catalog`   | Stores supported material information.                |
| `prices`             | Stores material pricing information.                  |
| `price_history`      | Maintains historical price information.               |
| `lots`               | Stores e-waste lot records.                           |
| `quotes`             | Stores quotations associated with lots and recyclers. |
| `transactions`       | Stores transaction records.                           |
| `trace_events`       | Stores traceability events.                           |
| `ledger_entries`     | Stores ledger records.                                |
| `safety_content`     | Stores safety-related information.                    |
| `field_research`     | Stores field-research records.                        |
| `app_settings`       | Stores application settings.                          |

For exact column definitions, relationships, constraints, and indexes, refer to the Drizzle schema files in the project.

## Database Setup

### Prerequisites

* Node.js and npm installed.
* PostgreSQL installed and running.
* Project dependencies installed.
* A valid database connection string configured in the environment.

### Configure the database

Set the `DATABASE_URL` environment variable to point to your PostgreSQL database.

Example for a local development database:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db
```

Use the actual username, password, host, port, and database name configured on your machine. Do not commit real credentials to Git.

### Apply the schema

From the project root, run:

```bash
npx drizzle-kit push
```

This applies the Drizzle schema to the configured database. Confirm that the connection string points to the intended development database before running the command.

### Seed the database

Run the seed script:

```bash
npx tsx src/db/seed.ts
```

The seed script is designed to be idempotent and creates three demo accounts first. On a fresh database, their IDs are expected to be `1`, `2`, and `3`.

Seed data is intended for development and demonstration. Do not treat demo accounts or sample records as real users or production data.

## Data Access

The application uses Drizzle ORM to interact with PostgreSQL. Application services and API route handlers use the database layer to perform data operations.

Refer to the source schema and service modules for the authoritative implementation of queries, relationships, and business rules.

## Development and Safety Notes

* Keep database credentials and other secrets in environment variables.
* Use a separate database for development and production.
* Verify the configured database before applying schema changes or running seed scripts.
* Use realistic but non-sensitive sample data for demonstrations.
* Back up important data before performing database maintenance or destructive operations.
* Restrict production database access to authorized application services and administrators.

## Related Documentation

* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Environment Setup](./ENVIRONMENT.md)
* [Security](./SECURITY.md)
* [ML](./ML.md)