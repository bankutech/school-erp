# School ERP Implementation Plan

## Implementation Order

### Phase 1: P0 - Critical Security and Data Integrity (Current State: BUILDING FIXES)

| # | Task | Dependency | Acceptance Criteria |
|---|------|------------|---------------------|
| 1 | Fix staff onboarding duplicate employeeNumber error | None | `POST /api/v1/staff` returns 201 for new employees; 409 only for genuine duplicates |
| 2 Fix staff payroll generation bad request | None | `POST /api/v1/staff/payroll/generate` returns 201 with correct net salary |
| 3 Fix timetable scheduling clash (409 vs 201) | Academic structure must be populated | `POST /api/v1/timetable` returns 201 when no clash; 409 only when genuine conflict |
| 4 Fix timetable substitutions 400 error | Timetable entries must exist | `POST /api/v1/timetable/substitutions` returns 201 with valid entry |
| 5 Ensure all authentication flows work without errors | Database seeded | All 6 demo roles login successfully (admin, principal, teacher, accountant, parent, student) |
| 6 Verify audit logging on all critical operations | All modules | Every STUDENT_CREATE, PAYMENT_COLLECT, ATTENDANCE_MARK, MARKS_PUBLISH generates AuditLog entry |

### Phase 2: P1 - Core ERP Functionality (Current State: MOSTLY IMPLEMENTED)

| # | Task | Dependency | Acceptance Criteria |
|---|------|------------|---------------------|
| 7 Implement configurable grading scales per academic year | Examination subjects | `GradingScheme` model configurable; `StudentMark.grade` calculated from scheme bands |
| 8 Implement result correction workflow | Published examinations | Unpublished results restricted to authorized users; published result history preserved |
| 9 Implement document PDF generation and export | Document models | PDF export of receipts, certificates, report cards with school branding |
| 10 Implement controlled document reissue and cancellation | Certificate/Receipt models | Audit trail on reissue/cancellation; verification of document status |
| 11 Implement household/sibling fee balance module | Fee invoices | `GET /api/v1/fees/household` returns unified sibling balances with all calculations verified |
| 12 Implement configurable attendance categories and thresholds | Attendance records | Admin can configure attendance categories beyond default 5; threshold alerts configured |
| 13 Implement transport vehicle document expiry alerts | Vehicle model | Insurance/permit expiry dates tracked; alerts generated 30 days before expiry |
| 14 Implement library fine exemption for calendar-exempted periods | Library module | Fines not calculated for periods exempted by school calendar |
| 15 Implement configurable workflows for admission approval steps | Admission application | Admins can configure approval steps (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> ENROLLED) without code changes |
| 16 Implement notification preference system | User model | Parents/guardians can opt-in/out of notification categories (attendance, fees, notices) |
| 17 Implement result publication approval workflow | Examination publish | Super/admin approval required before results published to parents/students |
| 18 Implement configurable currency and number formatting | School settings | ₹ formatting for India; configurable date formats per school timezone |

### Phase 3: P2 - Operational Completeness (Current State: PARTIALLY IMPLEMENTED)

| # | Task | Dependency | Acceptance Criteria |
|---|------|------------|---------------------|
| 19 Implement general ledger with journal entries | Expense/invoice models | Journal entries balance (debits = credits); posted entries locked from mutation |
| 20 Implement bank reconciliation module | Bank/cash accounts | Daily/weekly reconciliation of bank statements against recorded transactions |
| 21 Implement cashier-wise collection reports | Payment records | Reports show collection per cashier with date ranges |
| 22 Implement daily collection reports | Invoice payments | End-of-day report of all collections with totals per payment method |
| 23 Implement procurement integration with inventory | Purchase orders + Inventory | Goods received updates inventory stock; purchase orders link to fee structures |
| 24 Implement vendor balance tracking | Vendor records | Outstanding vendor balances visible in UI |
| 25 Implement full calendar with event descriptions and audience selection | Academic calendar | Events with target audience (ALL, STAFF, TEACHERS, STUDENTS, PARENTS, CLASS) |
| 26 Implement calendar export/subscription (iCal) | Calendar events | iCal/ICS export of school calendar events |
| 27 Implement configurable date/time/number formats per school | School settings | Rupee formatting, Indian date conventions (DD/MM/YYYY or MM/DD/YYYY) |
| 28 Implement advanced search across all modules | Search service | Global search returning results respecting permissions with highlight snippets |
| 29 Implement bulk student import with preview and error reporting | Student endpoint | CSV import with row-level error report and duplicate-handling policy |
| 30 Implement bulk staff import | Staff endpoint | Same as student import but for staff records |
| 31 Implement certificate reissue and cancellation with audit | Certificate model | Controlled reissue; cancellation with audit trail; no fabricated signatures |

### Phase 4: P3 - Quality and Usability (Current State: FOUNDATIONAL)

| # | Task | Dependency | Acceptance Criteria |
|---|------|------------|---------------------|
| 32 Implement responsive design for all pages | All frontend components | No horizontal overflow on mobile; tables scroll; navigation accessible |
| 33 Implement accessibility (WCAG 2.2 AA) | All UI components | Keyboard navigation, screen-reader labels, focus states, contrast ratios, validation messages |
| 34 Implement performance optimization | Large datasets | Server-side pagination; avoid N+1 queries; expensive aggregations cached |
| 35 Implement improved empty states | All pages | Informative empty states with guidance instead of blank pages |
| 36 Implement improved error states | All endpoints | User-friendly error messages (not stack traces); recovery actions |
| 37 Implement user onboarding flow | New user experience | First-login tutorial/guided tour; context-sensitive help tooltips |
| 38 Implement documentation and help system | Help module | Contextual help, user guides, form validation explanations, release notes |
| 39 Implement search result pagination and export | Search module | Paginated search results; CSV/Excel export of search results |
| 40 Implement localized date/currency formats | School configuration | Indian rupee formatting; configurable date patterns |

### Phase 5: P4 - Valuable Advanced Capabilities (Current State: NOT STARTED)

| # | Task | Dependency | Acceptibility Criteria |
|---|------|------------|----------------------|
| 41 Implement intelligent attendance alerts | Attendance records | Configurable rules for repeated absences; factual summaries with evidence; authorized staff alerts |
| 42 Implement admission operations dashboard | Admission applications | Pipeline visibility: applications received, awaiting review, missing documents, offers issued, seats remaining, waiting-list status |
| 43 Implement financial anomaly detection | Payment/invoice records | Duplicate payment references, receipts with inconsistent states, unusual manual adjustments, repeated failed payments, invoice-payment mismatches |
| 44 Implement data-quality dashboard | Across all modules | Missing guardian contacts, incomplete admission documents, students without class assignments, duplicate-looking records, inconsistent enrolments, missing staff documents, invalid transport assignments |
| 45 Implement operational alerts dashboard | Across all modules | Pending approvals, expiring vehicle documents, overdue library books, unpaid invoices, missing attendance, timetable conflicts, incomplete admissions, failed integrations |
| 46 Implement backup and recovery management | Database + Storage | Backup procedures with retention monitoring; restore testing documented; backup success/failure tracking |
| 47 Integration health monitoring | Email/SMS/Payment gateway | Operational status of configured integrations; distinguish health check from end-to-end test |
| 48 School operations audit trail | All critical operations | Searchable, permission-controlled record of changes: actor, action, timestamp, target record, change metadata |
| 49 Configurable workflow engine | Admission/leave/fee/result workflows | Controlled configuration model; not unrestricted workflow engine without real need |
| 50 Localization for Indian school deployment | School configuration | Rupee formatting; local date conventions; grading systems; attendance categories; fee policies |

## Database Changes

### Planned Migrations

1. **Add GradeBand model** for configurable grading schemes
   - Creates: `GradingScheme`, `GradeBand` tables
   - Related: Examination result calculation
   - Risk: LOW - new model, no existing data transformation

2. **Add AuditLog metadata Json field expansion** 
   - Creates: Extended JSON metadata in existing AuditLog
   - Related: All audit logging
   - Risk: LOW - schema extension only

3. **Add NotificationPreferences user model extension**
   - Creates: User preference flags for notification categories
   - Related: Notification delivery
   - Risk: MEDIUM - requires user preference migration from existing users

4. **Add SchoolConfiguration key-value store**
   - Creates: School settings for currency, date format, number format, grading scheme
   - Related: Localization, configurable workflows
   - Risk: MEDIUM - new table, seed data required

5. **Add DocumentGeneration audit trail model**
   - Creates: Document issuance/cancellation tracking
   - Related: Receipts, certificates
   - Risk: LOW - new model

6. **Add PaymentGateway configuration** 
   - Creates: Provider settings (UPI ID, bank details, webhook URLs)
   - Related: Payment processing
   - Risk: LOW - configuration only, no production credentials

7. **Add CalendarEvents model** 
   - Creates: Events with audience, descriptions, dates
   - Related: School calendar
   - Risk: MEDIUM - may affect existing academic year date constraints

8. **Add StaffLeaveBalance model** 
   - Creates: Per-staff leave balance tracking per leave type
   - Related: Leave requests, payroll
   - Risk: LOW - new model with initial balance setup

## Frontend Improvements

### Critical UI/UX Fixes

1. Fix StudentsView.test.tsx esbuild transform error (import.meta.env)
2. Ensure all dashboard KPI cards responsive on mobile (≤360px width)
3. Fix attendance roster table horizontal scrolling on tablets
4. Fix fee invoice table - balance columns truncate on narrow screens
5. Fix navigation sidebar collapses correctly on mobile (hamburger menu)
6. Ensure teacher portal class cards match assigned section colors
7. Fix parent portal child switcher - smooth transition between children
8. Fix loading states on all protected routes (spinner before data loads)
9. Fix empty states on student/fee/invoice lists (no "No data available" generic message)
10. Fix form validation error messages - display adjacent to fields, not as alerts

### Medium Priority UI/UX

11. Consistent button styles across all modules (primary/secondary/tertiary)
12. Uniform card component with consistent spacing and rounded corners
13. Consistent table component with horizontal scroll fallback
14. Consistent modal dialog pattern with header/body/footer
15. Consistent form label placement and input styling
16. Skip links for keyboard navigation on long pages
17. Focus management on modals and dropdowns
18. ARIA labels on interactive elements without text labels
19. Skip to main content link on all pages
20. Responsive typography scaling based on viewport

## Backend Improvements

### Critical API Fixes

1. Fix staff onboarding unique constraint on employeeNumber
2. Fix staff payroll generation input validation (400 error → proper bad request)
3. Fix timetable scheduling race condition (409 from stale data)
4. Fix timetable substitution validation (400 → proper error messages)
5. Ensure all API endpoints return consistent response structure `{success, data, meta, error}`

### Medium Priority API Fixes

6. Add rate limiting to all protected endpoints (currently only login has sliding window)
7. Add idempotency key support to all mutation endpoints (currently only attendance/fees)
8. Standardize error response format across all modules
9. Add pagination metadata to all list endpoints (some missing totalPages)
10. Improve query validation - some endpoints accept invalid query params silently

### Security Hardening

11. Remove fixed/demo OTP bypass (SMS OTP 424242 in test login)
12. Add CSRF protection for non-JPOST endpoints
13. Add request size limits per endpoint (currently 10mb uniform)
14. Add input sanitization for all string fields (XSS prevention)
15. Add output encoding for any HTML-rendered content
16. Add CORS configuration per environment (currently wildcard-ish)
17. Add environment variable validation at startup (fail fast if missing)
18. Add secret rotation procedure for production deployment
19. Add rate-limit bypass detection and logging
20. Add sensitive data redaction in logs (passwords, tokens not written)

### Performance

21. Add database query indexes for frequently filtered fields
22. Add Prisma query optimization - avoid N+1 in dashboard stats, attendance rosters
23. Add caching for read-heavy operations (fee structures, academic configurations)
24. Add search query optimization with database-level indexing
25. Add response compression for large CSV exports

## Tests to Execute

### Authentication Tests (P0)
- Valid login with all 6 role types
- Invalid credentials → 401
- Expired session → 401
- Revoked session → 401
- Logout → 200 + session blacklisted
- Password recovery → 200 + reset token generated
- Unauthorized access → 401 on protected routes
- Role restrictions → 403 when insufficient permissions
- Rate limits → 429 after 5 failed attempts per 15 min

### Student Tests (P1)
- Create student with guardians → enrolls student
- Update student profile → audit log entry
- Duplicate admission number prevention → 409
- Guardian linking → parent can view linked children only
- Student promotion → old enrolment PROMOTED, new ACTIVE
- Student transfer → new enrolment in target class/section
- Authorized/unauthorized record access → IDOR prevention verified

### Attendance Tests (P1)
- Mark attendance (bulk and individual) → records created
- Duplicate prevention → 409 if same student/date/period
- Correction history → original status preserved, correction recorded
- Attendance percentage calculation → (Present + Late + 0.5*HalfDay) / Total * 100
- Holiday handling → holidays not counted as school days
- Bulk updates transactional → all-or-nothing or none

### Examination Tests (P1)
- Valid marks entry → marks stored, grade computed
- Marks exceeding limits → 400 validation error
- Missing marks → not treated as zero automatically
- Result calculation → from configurable grading scheme
- Publication → grades calculated, report cards generated
- Authorized correction → unpublished results can be corrected
- Historical result preservation → published versions kept

### Financial Tests (P1)
- Invoice creation → invoice number generated, status UNPAID
- Partial payment → balance reduced, status PARTIALLY_PAID
- Full payment → balance 0, status PAID
- Duplicate payment requests → idempotency key prevents re-processing
- Overpayment prevention → payment amount > balance rejected
- Failed payment → balance unchanged, status remains UNPAID
- Refund → reversal voucher created, balance restored
- Reversal → audit log entry, original transaction preserved
- Receipt generation → unique REC- number, corresponds to real transaction
- Balance reconciliation → invoice balance = total - paid

### Integration Tests (P1-P2)
- Frontend-to-backend communication → API contracts match
- Database transaction behavior → atomic rollback on failure
- Notification delivery failures → error handled, not swallowed
- File upload restrictions → type/size validated
- Session and permission enforcement → RBAC on every endpoint
- Dashboard consistency → KPI figures match underlying source data

### End-to-End Workflows (P1)
1. Admission application → review → approval → enrolment → student record ✓ (tested)
2. Student creation → guardian linking → parent login → child record access ✓ (tested)
3. Teacher login → assigned class → attendance → report ✓ (tested)
4. Examination setup → marks entry → approval → publication → parent result view ✓ (tested)
5. Invoice generation → payment verification → receipt → updated outstanding balance ✓ (tested)
6. Staff creation → leave request → approval ✓ (tested)
7. Library book creation → issue → renewal → return ✓ (tested)
8. Transport route creation → student assignment → parent view ✓ (tested)
9. Asset purchase → stock receipt → assignment → return ✓ (tested)
10. Administrative action → audit record → report ✓ (tested)

## Deployment Checklist

### Environment Configuration
- [ ] PostgreSQL running and accessible at localhost:5432
- [ ] DATABASE_URL in .env points to correct database
- [ ] SESSION_SECRET set to ≥32 random characters (production)
- [ ] NODE_ENV = 'production' 
- [ ] CORS_ORIGIN set to production domain (not localhost)
- [ ] API_PREFIX set correctly
- [ ] DEFAULT_CURRENCY = 'INR'
- [ ] DEFAULT_TIMEZONE = 'Asia/Kolkata'
- [ ] UPLOAD_DIR writable for private uploads

### Database Migrations
- [ ] `prisma db push` applied successfully
- [ ] Seed data run: `npx tsx prisma/seed.ts`
- [ ] All demo credentials functional
- [ ] Existing production data preserved (backup before migration)
- [ ] Migration rollback procedure documented and tested

### Secure Administrator Bootstrap
- [ ] No default super-admin account with weak credentials
- [ ] Initial admin created via secure onboarding flow
- [ ] Super admin can manage users/roles without unrestricted employee access
- [ ] Dangerous operations require confirmation

### Secret Management
- [ ] No hardcoded production credentials in source
- [ ] Session secret from environment, not code
- [ ] Database credentials from environment, not code
- [ ] Payment gateway keys from environment/secrets management
- [ ] OTP secrets from environment, not hardcoded

### HTTPS Requirements
- [ ] HTTPS configured for production deployment
- [ ] HTTP-only cookies used for session management
- [ ] JWT tokens signed with server-secret, not exposed in URLs
- [ ] CORS restricted to production origin

### Backup and Restore
- [ ] Database backup procedure documented
- [ ] PostgreSQL WAL/archive backup configured
- [ ] File-storage backup (uploads/) documented
- [ ] Restoration test completed in development environment
- [ ] Backup retention policy documented (e.g., 30 days daily, 90 days weekly)

### Monitoring
- [ ] Health check endpoint `/api/v1/health` operational
- [ ] Audit log monitoring procedure documented
- [ ] Error rate monitoring set up
- [ ] Database connection pool health checked
- [ ] Memory/CPU usage thresholds set

### Logging
- [ ] Structured logs (JSON format) for production
- [ ] Audit logs immutable and time-stamped
- [ ] Request IDs tracked through middleware chain
- [ ] Sensitive data redaction in logs (passwords, tokens)
- [ ] Log retention policy (e.g., 90 days)

### Health Checks
- [ ] Database connectivity check
- [ ] Prisma client queryable
- [ ] Authentication endpoint responsive
- [ ] Key API endpoints returning expected data
- [ ] Critical business logic verified (payment, attendance, results)

### Deployment Verification
- [ ] Full build: `npm run build --workspaces`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] All environment variables validated
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All critical tests pass

### Rollback Procedures
- [ ] Database rollback script documented
- [ ] Application rollback to previous version procedure
- [ ] DNS/redirect update procedure if domain changes
- [ ] Stakeholder communication plan for rollout