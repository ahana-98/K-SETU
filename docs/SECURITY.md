# Security foundations
- scrypt password hashing; HMAC-signed session cookies (httpOnly, sameSite=lax).
- Role-based authorization enforced in middleware AND every API handler.
- Resource ownership checks (collector → own lots/ledger; recycler → own txs).
- Zod validation on all write endpoints; image upload MIME/size validated;
  images stored as compressed data URLs (no executable files).
- No secrets in frontend; SESSION_SECRET/DATABASE_URL from env only.
- Sanitized error messages; no passwords/tokens ever logged.
- LOCAL DEMO MODE is clearly separated and disableable (DISABLE_LOCAL_DEMO=true).
