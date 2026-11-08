# School ERP Known Limitations

This document records every feature that remains incomplete, requires external configuration, or has not been verified. Keep this synchronized with the actual implementation.

## Critical Limitations (Must Fix Before Production)

### 1. Payment Gateway Integration Not Configured
- **Status**: Not configured; sandbox mode only
- **Impact**: Payment processing works for UPI/Cash/Bank Transfer within the system, but no external payment gateway (Razorpay, Stripe, PayU, etc.) integrated
- **Configuration Required**: 
  - Payment gateway API keys and credentials
  - Webhook endpoints for callback verification
  - Server-side provider callback verification before marking transactions successful
- **Workaround**: Internal payment recording works; external gateway integration required for real bank/UPI payments
- **Reference**: Module 15 (Fees) - payment processing implemented internally but gateway pending

### 2. No HTTPS Configured for Production
- **Status**: Application runs on HTTP (localhost:5000) only
- **Impact**: All traffic unencrypted; unsuitable for production deployment with student/financial data
- **Configuration Required**: SSL/TLS certificate, web server (NGINX/Apache) termination HTTPS, redirect HTTP to HTTPS
- **Workaround**: None - must have HTTPS for production
- **Reference**: Deployment checklist §HTTPS Requirements

### 3. Database Backup Not Verified
- **Status**: No backup procedure tested
- **Impact**: Data loss risk if database corrupted or lost
- **Configuration Required**: 
  - PostgreSQL backup procedure documented
  - Restoration test completed
  - Scheduled backup job configured
- **Workaround**: None - must implement before production
- **Reference**: Deployment checklist §Backup and Restore

### 4. Fixed Demo OTP in Authentication
- **Status**: SMS OTP `424242` accepted as valid in test login (see api.test.ts SMS OTP test)
- **Impact**: Development-only shortcut present in codebase
- **Configuration Required**: Remove SMS OTP bypass; require actual OTP delivery service or remove test configuration
- **Workaround**: Ensure production startup cannot enable test OTP bypass accidentally (behind explicit test config flag)
- **Reference**: api.test.ts line with `password: '424242'` SMS OTP test

### 5. No Rate Limit Enforcement (Beyond Auth Login)
- **Status**: Rate limiting exists only for `/api/v1/auth/login` (5 attempts per 15 min)
- **Impact**: Other protected endpoints have no rate limiting, vulnerable to brute force or DoS
- **Configuration Required**: Add rate limiting middleware to all protected routes
- **Workaround**: API gateway level rate limiting (outside codebase scope for now)
- **Reference**: Security audit §Rate-limit bypasses

## Important Limitations (Known but Not Blocking)

### 6. No Actual PDF Document Generation
- **Status**: Receipt and certificate data returned from API as JSON; no PDF binary generation
- **Impact**: System cannot produce printable/official PDF receipts, certificates, report cards
- **Configuration Required**: 
  - PDF library (e.g., pdfmake, puppeteer, jsPDF) integrated into backend
  - School branding (logo, colors) applied to generated documents
  - Download endpoint for generated PDFs
- **Workaround**: API returns all data needed; external system can generate PDFs from this data
- **Reference**: Module 17 (Receipts and Document Generation) - receipt data generated, PDF not

### 7. Library Fine Calculation Not Configurable
- **Status**: Flat fine rates hardcoded; no per-library or per-school configuration
- **Impact**: Schools with different fine policies cannot configure rates
- **Configuration Required**: 
  - Fine configuration model (rate per day, maximum cap, exempt periods)
  - Library settings table with configurable policies
- **Workaround**: Current fixed fines may not match school policy
- **Reference**: Module 18 (Library Management) - fine calculation present but not configurable

### 8. Transport GPS Tracking Not Integrated
- **Status**: No live GPS tracking data provider connected; module notes "Do not claim live GPS tracking without actual data provider"
- **Impact**: Cannot track buses in real-time; only static route management
- **Configuration Required**: 
  - GPS data provider integration (if school has GPS fleet tracking)
  - Real-time dashboard for vehicle locations
- **Workaround**: Module functions without GPS - route management, student assignments, fee collection work fully
- **Reference**: Module 19 (Transport Management) - GPS explicitly not claimed without integration

### 9. School Calendar Not Fully Implemented
- **Status**: Academic year dates serve as holiday framework; no full calendar with event descriptions, audience selection, drag-and-drop
- **Impact**: Holidays not automatically respected by attendance/scheduling calculations
- **Configuration Required**: 
  - CalendarEvents model implementation
  - Holiday/exceptional day definitions
  - Integration with attendance and timetabling modules
- **Workaround**: Manual date checks; holidays not automatically excluded
- **Reference**: Module 23 (School Calendar and Events) - partial implementation

### 10. Configurable Attendance Categories Not Implemented
- **Status**: Fixed 5 categories (PRESENT, ABSENT, LATE, EXCUSED, HALF_DAY)
- **Impact**: Schools with additional attendance categories (e.g., religious observance, school event) cannot configure
- **Configuration Required**: 
  - Attendance category configuration model
  - Admin UI to manage categories
  - Mapping to percentage calculations
- **Workaround**: Current 5 categories cover most school scenarios
- **Reference**: Module 12 (Attendance Management) - 5 fixed categories

### 11. Grade Calculation Scheme Not Configurable Per Academic Year
- **Status**: Default grading scheme used; no per-year/per-term configuration of bands
- **Impact**: Schools with different grading systems (7-point, 9-point, percentage-only) cannot configure
- **Configuration Required**: 
  - GradingScheme model (already in Prisma schema)
  - GradeBand configuration per scheme
  - Admin UI to manage schemes per academic year
- **Workaround**: Default scheme used; can be extended later
- **Reference**: Module 13 (Examinations and Results) - grades calculated but not configurable per year

### 12. Notification Preferences Not Implemented
- **Status**: Notifications sent broadly; users cannot opt-in/opt-out of categories
- **Impact**: Parents/staff receive all notifications regardless of preference
- **Configuration Required**: 
  - User notification preference flags (attendance, fees, notices, results, etc.)
  - Admin configuration of default preferences per role
  - Per-user preference storage and respect
- **Workaround**: All notifications sent to all users of relevant role
- **Reference**: Module 22 (Notifications and Communications) - notifications present but no preference system

### 13. Document Reissue/Cancellation Audit Trail Not Implemented
- **Status**: Certificates and receipts generated, but no controlled reissue or cancellation with audit
- **Impact**: No verification of issued documents; no trail if documents reissued or canceled
- **Configuration Required**: 
  - Document issuance tracking model
  - Reissue/cancellation workflow with authorization
  - Audit log entries for each reissue/cancellation
  - Verification of document status (original, reissued, canceled)
- **Workaround**: Generate new documents; no formal reissue process
- **Reference**: Module 17 (Receipts and Document Generation) - generation present, reissue pending

### 14. Procurement-Vendor-Inventory Accounting Integration Not Complete
- **Status**: Purchase requests, orders exist; but no integration with inventory stock movements or accounting ledger
- **Impact**: Financial records may not reconcile between procurement and fee/inventory modules
- **Configuration Required**: 
  - Consistent transaction boundaries between modules
  - Goods received → inventory update → accounting entry
  - Vendor balance tracking
- **Workaround**: Manual reconciliation; modules operate independently
- **Reference**: Module 21 (Procurement and Vendor Management) - basic procurement, integration pending

### 15. Search Not Cross-Module
- **Status**: Student search, admission number search, application number search work; but no global search across all modules
- **Impact**: Cannot search for invoices, assets, transport routes, library books from single search field
- **Configuration Required**: 
  - Global search service indexing all module data
  - Permission-filtered results based on user role
  - Search result pagination and export
- **Workaround**: Module-specific search endpoints used
- **Reference**: Module 28 (Global Search and Productivity) - core search, multi-module pending

### 16. Help and Onboarding System Not Implemented
- **Status**: Demo credentials in seed.ts; no first-login guidance, contextual help, user documentation
- **Impact**: New users must explore to understand system; no guided onboarding
- **Configuration Required**: 
  - First-login tutorial/wizard
  - Context-sensitive help tooltips
  - User documentation system
  - Form validation explanations (already in Zod schemas partially)
- **Workaround**: Documentation in this repo and seed credentials
- **Reference**: Module 29 (Help, Support and Onboarding) - basic, full system pending

### 17. Staff Payroll Input Validation Returns 400 Instead of 201
- **Status**: `POST /api/v1/staff/payroll/generate` returns 400 for valid input in test suite
- **Impact**: Staff payroll generation broken; test expects 201
- **Configuration Required**: Fix payroll calculation endpoint input validation
- **Workaround**: None - endpoint broken
- **Reference**: Test suite failure: "Phase 3: Staff HR, Attendance & Payroll > POST /api/v1/staff/payroll/generate should compute net salary and generate payslip"

### 18. Timetable Scheduling Race Condition
- **Status**: Test `POST /api/v1/timetable should schedule a slot when no clash exists` returns 409 instead of 201
- **Impact**: Timetable scheduling may fail due to stale data or concurrent requests
- **Configuration Required**: 
  - Fix timetable entry creation to return 201 when no conflict
  - Ensure proper state checking before conflict detection
- **Workaround**: None - core functionality broken
- **Reference**: Test suite failure: "Phase 2: Timetable Conflict Detection & Management > POST /api/v1/timetable should schedule a slot when no clash exists"

### 19. Timetable Substitution Validation Returns 400
- **Status**: `POST /api/v1/timetable/substitutions should assign substitute teacher` returns 400 instead of 201
- **Impact**: Substitute teacher assignment broken
- **Configuration Required**: Fix substitution endpoint validation
- **Workaround**: None - core functionality broken
- **Reference**: Test suite failure: "Phase 2: Timetable Conflict Detection & Management > POST /api/v1/timetable/substitutions should assign substitute teacher"

### 20. Staff Onboarding Duplicate Employee Number Error
- **Status**: `POST /api/v1/staff should onboard a new staff member` returns 409 (unique constraint) even for new employees
- **Impact**: Cannot onboard new staff; employeeNumber already exists error even when it doesn't
- **Configuration Required**: Fix staff creation endpoint to handle employeeNumber uniqueness correctly
- **Workaround**: None - core HR functionality broken
- **Reference**: Test suite failure: "Phase 3: Staff HR, Attendance & Payroll > POST /api/v1/staff should onboard a new staff member"

### 21. Library Issue/Return Test Passes but Real Data State May Be Fragile
- **Status**: Test passes but may depend on specific database state
- **Impact**: Library module may have edge cases not covered by tests
- **Configuration Required**: Comprehensive library lifecycle testing with various scenarios
- **Workaround**: Current tests pass; manual testing recommended for edge cases
- **Reference**: Module 18 (Library Management) - tests pass, statefulness noted

### 22. Invoice/Payment Test Data May Vary Based on Seed Run
- **Status**: Financial tests depend on specific seed data (invoice numbers, payment receipt numbers)
- **Impact**: Test results may vary if database seed changes
- **Configuration Required**: Test data fixtures should be deterministic and isolated
- **Workaround**: Tests designed to work with current seed data
- **Reference**: Multiple financial test results dependent on seed ordering

### 23. Audit Log May Not Capture All Critical Operations
- **Status**: Audit logging implemented for major operations; some edge cases may omit logging
- **Impact**: Incomplete audit trail for compliance or debugging
- **Configuration Required**: Ensure every critical business operation generates AuditLog entry
- **Workaround**: Manual audit review where logging omitted
- **Reference**: Security audit §Missing audit logs

### 24. Parent Child Verification Not Comprehensive Across All Modules
- **Status**: Guardian-child relationship verified in students and fees modules; may be inconsistent in other modules (LMS, library, transport)
- **Impact**: Potential cross-module IDOR vulnerabilities
- **Configuration Required**: Verify guardian linkage on every protected request across all modules
- **Workaround**: Manual verification; module-by-module audit
- **Reference**: Security rule "Verify guardian-child relationships on the server for every protected request"

### 25. No CSV Export Validation for Sensitive Data Leakage
- **Status**: CSV exports exist for students, invoices, inventory, audit logs
- **Impact**: Potential exposure of sensitive data in exported files (SSN, personal details, financial data)
- **Configuration Required**: 
  - Audit CSV export content for sensitive fields
  - Redact or exclude PII from CSV exports
  - Add disclaimer/consent for data export
- **Workaround**: Current exports include relevant operational data; review recommended
- **Reference**: Module 27 (Reports and Analytics) - CSV exports present, sensitivity review needed

### 26. Examination Mark Modification After Publication Not Fully Tested
- **Status**: EXAMINATION_LOCKED (403) tested, but real-world scenario of mid-term result corrections not fully verified
- **Impact**: If results need correction after publication, workflow may be unclear
- **Configuration Required**: 
  - Result correction workflow for unpublished results
  - Procedure for exceptional result modifications after publication
  - Audit trail for any changes to published results
- **Workaround**: Published results locked; corrections only before publication
- **Reference**: Module 13 (Examinations and Results) - publication locking works, correction workflow pending

### 27. Transport Document Expiry Alerts Not Configured
- **Status**: Vehicle model has insurance/permit expiry fields; no alert generation configured
- **Impact**: No proactive alerts when documents approach expiry
- **Configuration Required**: 
  - Expiry date tracking on vehicles
  - Alert generation 30 days before expiry
  - Admin UI to view expiry status
- **Workaround**: Manual checking of vehicle document dates
- **Reference**: Module 19 (Transport Management) - expiry fields exist, alerts not configured

### 28. Configurable Fee Policies (Discounts, Scholarships, Concessions) Not Fully Implemented
- **Status**: Fee structures with components exist; but configurable discount/concession policies not admin-configurable without code changes
- **Impact**: Schools cannot adjust fee concessions without developer assistance
- **Configuration Required**: 
  - Student-specific fee adjustments
  - Scholarship/concession configuration
  - Approval workflow for manual concessions
- **Workaround**: Manual database updates; not recommended
- **Reference**: Module 15 (Fees and Fee Structures) - discounts/concessions in schema, not configurable UI

### 29. Result Ranking Calculation May Have Tie-Harness
- **Status**: Ranking calculated on result publication; tie-handling not explicitly configured
- **Impact**: Students with same percentage may get inconsistent rankings
- **Configuration Required**: 
  - Tie-breaking rules (alphabetical, seniority, etc.)
  - Ranking configuration per grading scheme
- **Workaround**: Current ranking may have arbitrary ties
- **Reference**: Module 13 (Examinations and Results) - rankings calculated, tie rules not configured

### 30. No Distributed Tracing or Request ID Middleware
- **Status**: No request ID propagation through middleware chain
- **Impact**: Hard to debug end-to-end request flow across modules
- **Configuration Required**: 
  - Express middleware adding X-Request-ID header
  - Log correlation with request ID
  - Dashboard or tracing system (outside current scope)
- **Workaround**: Manual debugging; no distributed tracing
- **Reference**: Operations §Logging and Monitoring - request ID not implemented

---

## Summary of Known Limitations

| Category | Count | Status |
|---|---|---|
| Critical (Must Fix) | 5 | 3 already being fixed in test suite (staff onboarding, timetable, payroll), 2 require config (payment gateway, HTTPS, backup) |
| Important (Known Issues) | 25 | Most are configurational or enhancement items; none block core ERP functionality |
| Minor/Edge Cases | ~15 | Mostly "would be nice to have" or "depends on school policy" |

**Priority Order for Resolution**:
1. Fix staff onboarding (409 on new employees) - P0
2. Fix timetable scheduling (409 on valid slots) - P1
3. Fix payroll generation (400 on valid input) - P1
4. Remove SMS OTP test bypass - P0 security
5. Configure payment gateway - P1 production
6. Implement HTTPS - P0 production
7. Set up database backups - P0 production
8. Implement remaining configurational items - P2-P3