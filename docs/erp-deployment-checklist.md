# School ERP Deployment Checklist

## Pre-Deployment Environment Setup

### Server Environment
- [ ] PostgreSQL 16+ running and accessible
- [ ] Database `school_erp` created and accessible
- [ ] `localhost:5432` reachable from application server
- [ ] Port 5432 not blocked by firewall for production deployment
- [ ] PostgreSQL `max_connections` set appropriately (default 100, adjust for load)

### Environment Variables (.env)
- [ ] `DATABASE_URL` = `postgresql://postgres:postgres@localhost:5432/school_erp?schema=public`
  - Production: Use separate user/credentials, not postgres superuser
- [ ] `SESSION_SECRET` = minimum 32 random characters (production: generate anew, not the dev default)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000` (or desired port)
- [ ] `API_PREFIX` = `/api/v1`
- [ ] `CORS_ORIGIN` = `https://your-domain.com` (production domain, NOT localhost)
- [ ] `DEFAULT_CURRENCY` = `INR`
- [ ] `DEFAULT_CURRENCY_SYMBOL` = `₹`
- [ ] `DEFAULT_TIMEZONE` = `Asia/Kolkata`
- [ ] `UPLOAD_DIR` = writable path for private uploads (e.g., `./uploads/private`)
- [ ] `BCRYPT_SALT_ROUNDS` = `10` (or higher for production)
- [ ] `PAGE_SIZE` or pagination defaults (optional)

### Prisma Schema & Client
- [ ] `prisma/schema.prisma` matches production data model
- [ ] `npx prisma generate` run successfully (generates Prisma Client)
- [ ] `prisma/db push` applied (schema synced to database)
- [ ] Existing production data preserved (backup before push)
- [ ] No breaking changes to existing fields/types without migration plan

### Application Build
- [ ] `npm run build --workspaces` completes without errors
- [ ] Frontend (`apps/web`) builds to static assets
- [ ] Backend (`apps/api`) compiles TypeScript to JavaScript
- [ ] No TypeScript errors: `npx tsc --noEmit` passes
- [ ] All dependencies consistent (package-lock.json matches installed modules)
- [ ] Prisma client imported and working in all modules

### Secure Administrator Bootstrap
- [ ] **NO default super-admin account with weak credentials**
- [ ] Initial admin created via secure onboarding flow (not hardcoded)
- [ ] Super admin can manage users/roles without granting every employee unrestricted access
- [ ] Dangerous operations (user deletion, role elevation, fee adjustments) require confirmation dialog
- [ ] No fixed production OTP or fallback signing secret in codebase
- [ ] Audit log verifies who created the first administrator account

### Secret Management
- [ ] No hardcoded production credentials in source files
- [ ] Session secret from environment variable, not embedded in code
- [ ] Database credentials from environment variable only
- [ ] Payment gateway keys (if configured) from environment/secrets management service
- [ ] OTP secrets from environment, not hardcoded (remove SMS OTP 424242 test bypass)
- [ ] No secrets in git history (already committed - ensure .env is in .gitignore)
- [ ] Rotation procedure documented for production secrets

### HTTPS Requirements
- [ ] HTTPS configured for production domain
- [ ] HTTP-only cookies used for session management (if using cookie-based auth)
- [ ] JWT tokens signed with server-secret, never exposed in URLs or client-side storage
- [ ] All API calls over HTTPS (API_PREFIX routes over TLS)
- [ ] Certificate valid and not expired
- [ ] Mixed content (HTTP within HTTPS page) eliminated
- [ ] CSP (Content Security Policy) configured if serving static assets

### Backup and Restore
- [ ] Database backup procedure documented
  - PostgreSQL native backup: `pg_dump -U postgres school_erp > backup_YYYYMMDD.sql`
  - Or use managed PostgreSQL backup service
- [ ] File-storage backup (./uploads/private/) documented and scheduled
- [ ] Restoration test completed in development/staging environment
  - Restore backup to fresh database
  - Verify all data intact
  - Verify application starts correctly with restored data
- [ ] Backup retention policy documented (e.g., 30 days daily, 90 days weekly, 365 months)
- [ ] Backup verification: test restore at least once before production deployment

### Monitoring
- [ ] Health check endpoint `/api/v1/health` operational and returns correct status
- [ ] Audit log monitoring procedure documented (review frequency, storage duration)
- [ ] Error rate monitoring set up (Sentry, CloudWatch, or similar)
- [ ] Database connection pool health checked (active/max idle connections)
- [ ] Memory/CPU usage thresholds set and alerts configured
- [ ] Log aggregation (structured JSON logs) operational
- [ ] Key metrics dashboard showing: API latency, error rates, database health

### Logging
- [ ] Structured logs (JSON format) for production environment
- [ ] Audit logs immutable and time-stamped (Prisma AuditLog or custom)
- [ ] Request IDs tracked through entire middleware chain (X-Request-ID header)
- [ ] Sensitive data redaction in logs:
  - Passwords never written to logs
  - Session tokens/IDs never written to logs
  - Credit card numbers or bank account numbers never written
  - Student/staff personal information redacted
- [ ] Log retention policy (e.g., 90 days in production, 30 days in development)
- [ ] Log rotation configured (daily or size-based)
- [ ] Non-production logs do not contain real user data (use anonymized test data)

### Deployment Verification
- [ ] Full build: `npm run build --workspaces` succeeds
- [ ] Prisma client generated: `npx prisma generate` runs without errors
- [ ] All environment variables validated at startup (fail fast if critical missing)
- [ ] No TypeScript errors: `npx tsc --noEmit` passes for both apps
- [ ] All critical backend tests pass: `npx vitest run apps/api/src/__tests__/api.test.ts`
- [ ] Health check responsive: `GET /api/v1/health` returns 200 with database: connected
- [ ] Authentication flow works end-to-end with production credentials
- [ ] RBAC enforcement verified: each role can only perform authorized operations

### Rollback Procedures
- [ ] Database rollback script documented (how to revert schema migration if needed)
- [ ] Application rollback procedure (how to deploy previous version)
  - Previous build artifacts preserved
  - Database rollback if needed
- [ ] DNS/redirect update procedure if domain changes during rollout
- [ ] Stakeholder communication plan for rollout and rollback
- [ ] Rollback tested in staging environment (not just documented)
- [ ] Minimum downtime procedure documented (expected downtime < 5 minutes)
- [ ] Rollback decision matrix (when to rollback vs. when to push forward)

### Post-Deployment Validation
- [ ] All 6 demo roles login successfully after deployment
- [ ] All critical API endpoints functional (health, auth, students, fees, attendance, exams)
- [ ] Role-based access control verified (each role's permissions working)
- [ ] Database transactions protecting critical operations (enrollment, payment, attendance)
- [ ] Audit logging verified (critical operations generate AuditLog entries)
- [ ] Parent can only access linked children's records (IDOR prevention confirmed)
- [ ] Fee payment flow: invoice → payment → receipt → updated balance all correct
- [ ] Examination marks flow: entry → validation → publication → parent view all correct
- [ ] Timetable conflict detection working (no teacher/room clashes)
- [ ] Library book issue/return flow working correctly
- [ ] Transport route assignments within capacity constraints
- [ ] Inventory stock levels maintained (no negative stock unless configured)
- [ ] Notification system operational (test notification creation and delivery)
- [ ] CSV exports functional (students, invoices, inventory, audit logs)
- [ ] Responsive design verified on: mobile (375px), tablet (768px), desktop (1440px)
- [ ] No horizontal overflow on any page or screen size
- [ ] All forms have proper validation (client + server)
- [ ] Empty states present on all list/collection pages
- [ ] Error states handled user-friendly (not raw stack traces to end users)

### Production-Specific Checks
- [ ] CORS restricted to production origin (not * or localhost)
- [ ] Session secret is production-strength (32+ random chars, not dev default)
- [ ] No debug/morgan logging in production (or conditional on NODE_ENV)
- [ ] Helmet.js security headers enabled
- [ ] Rate limiting active (5 failed attempts per 15 min per identifier/IP)
- [ ] No hardcoded credentials found in codebase search (`password`, `secret`, `key` patterns)
- [ ] Production database not using default superuser credentials
- [ ] HTTPS validated with SSL certificate check
- [ ] Backup system verified operational (test restore from latest backup)
- [ ] Monitoring dashboards showing expected metrics
- [ ] Rollback procedure tested and known by team

### Known Limitations (Documentation)
- [ ] `docs/erp-known-limitations.md` updated with all incomplete features
- [ ] External integrations requiring configuration documented (payment gateway, email SMS)
- [ ] Configuration requirements listed (API keys, service credentials)
- [ ] Workarounds documented for known limitations
- [ ] Roadmap for future enhancements captured