# API
Auth: POST /api/auth/login {email,password} or {demoRole}; POST /api/auth/logout;
GET /api/auth/session. Health: GET /api/health.
REST dispatcher under /api: GET materials | prices | prices/history | recyclers |
lots | lots/:id | quotes?lotId | transactions | ledger | traceability/:lotId |
safety | verify?ref | admin/stats | admin/collectors | admin/recyclers |
admin/settings | admin/field-research.
POST lots | lots/:id/estimate | lots/:id/request-quote | recyclers/match | quotes |
quotes/:id/accept | quotes/:id/reject | handovers/:id/confirm-pickup |
handovers/:id/confirm | handovers/:id/payment | sync | ml/classify | ml/estimate |
ml/anomaly | ml/recommend | admin/reset | admin/settings | admin/field-research.
All protected routes verify session + role server-side; collectors only access
their own lots/ledger/transactions.
