# Environment Setup

## Overview

K-SETU uses environment variables to configure its database connection, session security, demo authentication, and optional integrations.

Keep local configuration in `.env.local` and do not commit secrets or personal credentials to Git.

## Environment Variables

| Variable             | Requirement                                             | Description                                                                |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`       | Required                                                | PostgreSQL connection string used by the application.                      |
| `SESSION_SECRET`     | Optional for local development; required for production | Secret used to sign and verify application sessions.                       |
| `DISABLE_LOCAL_DEMO` | Optional                                                | Set to `true` to disable the local demo-auth fallback.                     |
| `MAP_API_KEY`        | Optional                                                | Placeholder for map-related configuration. The app can run without it.     |
| `STORAGE_KEY`        | Optional                                                | Placeholder for storage-related configuration. The app can run without it. |

## Local Development

1. Install the project dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file by copying the example:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Open `.env.local` and set `DATABASE_URL` to your local PostgreSQL connection string.

4. For local development, configure the remaining variables as needed. Do not use a development fallback secret in a production deployment.

5. Start the application:

   ```bash
   npm run dev
   ```

The application requires a reachable PostgreSQL database. Optional map and storage configuration can remain unset for workflows that do not depend on those integrations.

## Example Configuration

The following is an illustrative local-development example. Replace the database connection details with values appropriate for your environment.

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db
SESSION_SECRET=replace-with-a-long-random-local-secret
DISABLE_LOCAL_DEMO=false
MAP_API_KEY=
STORAGE_KEY=
```

Do not copy this example's database credentials or secret into a public production deployment.

## Production Configuration

Before deploying K-SETU:

* Configure `DATABASE_URL` to use a reachable production PostgreSQL database.
* Set `SESSION_SECRET` to a strong, randomly generated secret.
* Set `DISABLE_LOCAL_DEMO=true` to disable the local demo-auth fallback.
* Configure optional integration keys only when the corresponding integration is enabled and required.
* Add environment variables through the deployment platform's secure configuration interface.
* Never expose secrets in source code, client-side bundles, screenshots, logs, or public repositories.

## Security Notes

* Treat `.env.local` and all files containing real credentials as private.
* Keep `.env.example` limited to placeholder values.
* Rotate any secret that has been accidentally exposed.
* Use separate credentials and secrets for development and production.
* Verify that demo authentication and demo reset functionality are disabled or appropriately restricted before using a public deployment.

## Troubleshooting

### Database connection fails

* Confirm that PostgreSQL is running.
* Check the database name, username, password, host, and port in `DATABASE_URL`.
* Ensure the configured database exists and is reachable from the application.

### Session or login problems

* Check that the session configuration is present and valid.
* For production, ensure a strong `SESSION_SECRET` is configured.
* Check the demo-auth configuration if using a local demo account.

### Optional integrations are unavailable

* Confirm whether the workflow requires the relevant integration.
* Check the corresponding environment variable and deployment configuration.
* The application is designed to run without `MAP_API_KEY` and `STORAGE_KEY` for workflows that do not use those integrations.

## Related Documentation

* [README](../README.md)
* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Database](./DATABASE.md)
* [Security](./SECURITY.md)
* [Demo Guide](./DEMO.md)