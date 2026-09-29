# Security Foundations

## Overview

K-SETU includes security controls for authentication, authorization, input validation, file uploads, and error handling. These controls are intended to protect the prototype's application workflows and user data.

This document describes the security measures implemented in the project and highlights additional precautions required before production deployment.

## Implemented security controls

### Authentication and sessions

* **Password hashing:** User passwords are hashed using `scrypt` rather than stored as plaintext.
* **Session cookies:** Sessions use HMAC-signed cookies with `HttpOnly` and `SameSite=Lax` attributes.
* **Secret configuration:** `SESSION_SECRET` is supplied through environment configuration, not exposed in frontend code.
* **Demo authentication:** Local demo mode is separated from normal authentication and can be disabled using `DISABLE_LOCAL_DEMO=true`.

### Authorization and access control

* **Role-based authorization:** Access is restricted according to the user's role.
* **Multiple enforcement layers:** Authorization checks are applied in middleware and API handlers.
* **Resource ownership:** Collectors are restricted to their own lots and ledger records; recycler access to transactions is similarly scoped.
* **Protected routes:** Administrative and role-specific operations require appropriate authorization.

### Input validation and uploads

* **Request validation:** Zod schemas validate data on write endpoints.
* **Image validation:** Image uploads are checked for MIME type and size.
* **Image handling:** Uploaded images are stored as compressed data URLs in the prototype; executable files are not intended to be accepted.
* **Server-side checks:** Sensitive operations should be validated on the server rather than relying only on frontend controls.

### Error handling and logging

* Error responses are sanitized to avoid exposing internal implementation details.
* Passwords and session tokens should never be written to application logs.
* Database credentials and other secrets are supplied through environment variables.

## Environment variables

| Variable             | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `SESSION_SECRET`     | Signs session cookies. Use a strong, unique secret outside local development.    |
| `DATABASE_URL`       | Provides the database connection string. Keep credentials private.               |
| `DISABLE_LOCAL_DEMO` | Set to `true` to disable local demo authentication and demo reset functionality. |

Do not commit real `.env` or `.env.local` files. Keep only safe placeholder values in `.env.example`.

## Production deployment precautions

The project is a prototype. Before exposing it to real users or handling sensitive data, review and verify the following:

* Use HTTPS and secure cookie settings in the production environment.
* Generate a strong, unpredictable `SESSION_SECRET` and rotate it if exposed.
* Use a managed database with restricted credentials, backups, and appropriate network access controls.
* Disable demo authentication and demo reset features.
* Apply rate limiting and abuse protection to authentication and other sensitive endpoints.
* Review upload storage, retention, and access controls for production use.
* Avoid collecting unnecessary personal information, especially in field-research records.
* Keep dependencies updated and review security advisories.
* Verify authorization, session expiry, and ownership checks with automated tests.
* Configure monitoring and logging without recording passwords, tokens, or other secrets.

These are deployment recommendations and should not be considered implemented unless verified in the application and hosting configuration.

## Responsible data handling

K-SETU's prototype may use synthetic or demonstration records. Do not treat demo data as verified real-world information. Obtain appropriate consent for field research, avoid collecting identifying details unless necessary, and restrict access to any real user data.

## Reporting a security issue

If a vulnerability is discovered, document the affected component, reproduction steps, and potential impact. Avoid publishing credentials, personal information, or exploit details that could put users at risk.

## Related documentation

* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Database](./DATABASE.md)
* [Environment Configuration](./ENVIRONMENT.md)
* [Demo Guide](./DEMO.md)