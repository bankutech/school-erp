# School ERP Gap Analysis

## Missing Features

### Module 25: Discipline, Wellbeing and Student Support
- **Description**: Incident reporting, authorized incident review, follow-up actions, parent communication, counselor referrals, resolution status, restricted notes, access history, escalation workflow
- **Current State**: Not implemented in the codebase
- **Impact**: Low for initial MVP; school may have separate safeguarding processes
- **Implementation Effort**: Medium (new models, permissions, UI)
- **Dependencies**: Requires school safeguarding policy definition

### Module 26: Optional Hostel and Canteen Management
- **Description**: Hostel room allocation, fees, roll calls, visitor records; Canteen menu management, meal plans, consumption reports
- **Current State**: Not applicable to this school's context
- **Impact**: None - explicitly excluded from scope
- **Decision**: Keep excluded; add only if school adds these services

## Partially Implemented Features

### Module 16: Accounting and Financial Reporting
- **Current State**: Expense tracking, invoices, payments, summaries implemented. Missing: General ledger, journal entries, bank reconciliation, cash/bank accounts, daily collection reports, cashier-wise reports, accounting exports
- **Risk**: Calling "fee dashboard" a "complete accounting system" would violate Rule 5 (do not label simple dashboard as complete accounting)
- **Required**: Journal entries that balance, posted entries cannot be silently edited, external accounting software integration documented

### Module 17: Receipts and Document Generation
- **Current State**: Unique receipt numbers generated. Certificate generation (TC/BC). Receipt data returned from API. No PDF export generation (binary), no controlled reissue/cancellation, no audit history of document issuance
- **Risk**: Generating official documents with fabricated signatures or unverified information would violate Rule 5
- **Required**: PDF export capability, verification of issued documents, controlled reissue/cancellation with audit trail

### Module 21: Procurement and Vendor Management
- **Current State**: Purchase requests, approval workflow, quotations, purchase orders. Missing: Integration with inventory stock movements, vendor balances, goods received matching, purchase return processing
- **Risk**: Duplicate financial records between fee and procurement modules if reconciliation rules not established
- **Required**: Consistent transaction boundaries with inventory, clear ownership and reconciliation rules

### Module 23: School Calendar and Events
- **Current State**: Academic year dates serve as holiday framework. Examination dates in examination schedules. Event notices via notices module. Missing: Full calendar with event descriptions, audience selection, calendar views, export/subscription
- **Required**: Calendar events module with holiday/exceptional day respect for attendance/scheduling calculations

### Module 24: Student and Staff Document Management
- **Current State**: Secure document upload with file-type/size validation. Ownership associations. Audit logs. Missing: Controlled download, expiry dates, replacement history, retention rules, verified public URLs
- **Required**: controlled download endpoints, expiry/replacement tracking, non-guessable URLs, retention policy enforcement

### Module 28: Global Search and Productivity
- **Current State**: Student search, admission number search, application number search, guardian lookup. Missing: Asset search, route search, invoice search across all modules, quick navigation, recently accessed records
- **Required**: Cross-module search respecting permissions and record-level restrictions

### Module 29: Help, Support and Onboarding
- **Current State**: Demo credentials in seed.ts. Form validation explanations in Zod schemas. Missing: First-login guidance, contextual help, user documentation, useful empty states, clear error messages, support requests, issue status, administrative help information
- **Required**: WCAG 2.2 AA accessible help system, first-login tour, contextual inline help, support request form with status tracking

### Module 19: Transport Management (GPS)
- **Current State**: No live GPS tracking configured. GPS integration noted as "optional" without actual data provider.
- **Risk**: Claiming biometric/ GPS verification exists without actual integration violates Rule 5
- **Required**: Remove claims of GPS tracking unless integration configured, or integrate actual GPS data provider

### Module 13: Examinations and Results (Grade Calculation)
- **Current State**: Marks entered and validated. Grades calculated but using default scheme. Missing: Configurable grading scales per academic year, detailed subject-wise analysis, class performance analysis, reassessment records, result correction workflow
- **Required**: Configurable grading schemes per year/term, historical result preservation beyond publication

## Security Issues

### Cross-Student Data Leakage Risk
- **Location**: Parent token validation relies on `guardianId` linkage
- **Status**: Server-side verification implemented (see `students.controller.ts`, `fees.controller.ts`)
- **Test Evidence**: SECURITY TEST in api.test.ts passes - parent cannot access other students' records

### Payment State Fabrication
- **Location**: `fees.controller.ts` `recordPayment` function
- **Status**: Server-side balance verification before marking paid. Client success messages NOT treated as proof of payment
- **Test Evidence**: Payment amount validated against invoice balance; duplicate prevention via idempotency key

### IDOR Prevention
- **Location**: Student/fee routes across all modules
- **Status**: Role-based scoping enforced. Students see only own records. Parents see only linked children.
- **Test Evidence**: All IDOR test cases pass in api.test.ts

### Examination Mark Modification After Publication
- **Location**: `exams.controller.ts` marks endpoint
- **Status**: Locked after `POST :id/publish` (403 EXAMINATION_LOCKED returned)
- **Test Evidence**: EXAMINATION LOCK test passes

### Insufficient Input Validation
- **Location**: Various controllers using Zod validation
- **Status**: Zod schemas defined in `@school-erp/shared` package
- **Risk**: Custom server-side validation added where needed (fee amount vs balance, staff employee number uniqueness)

## Data Integrity Risks

### Enrolment-Attendance Consistency
- **Risk**: Student promoted to new grade/section but attendance records from previous period not migrated
- **Mitigation**: Attendance records tied to studentId (not classId/sectionId), preserved historically

### Fee Balance Recursion
- **Risk**: Split payments could theoretically exceed invoice total if multiple concurrent allocations
- **Mitigation**: Transactional balance updates with `isZero()` check; overpayment prevention

### Attendance Duplicate Prevention
- **Risk**: Unique constraint `@@unique([studentId, date, periodNumber])` prevents duplicates at DB level
- **Mitigation**: Application-level check before upsert; error response if constraint violated

### Staff Attendance Duplicate
- **Risk**: Unique constraint `@@unique([staffId, date])` prevents double-marking
- **Mitigation**: Same as attendance - DB constraint + application-level guard

## Duplicate Modules

### Student Archive vs. Soft Delete
- **Observation**: `archiveStudent` sets `isActive: false` and `deletedAt`. Some routes exclude archived students, some don't.
- **Risk**: Inconsistent behavior depending on endpoint
- **Recommendation**: Standardize on soft-delete pattern with consistent exclusion from active listings

### Bulk Operations
- **Observation**: `promoteStudents` and `markBulkAttendance` both use transactions but different patterns
- **Risk**: Inconsistent transaction boundaries
- **Recommendation**: Standardize on prisma.$transaction pattern with audit logging

### Fee Payment Entry Points
- **Observation**: `recordPayment`, `recordSplitPayment`, and potential direct invoice payment routes
- **Risk**: Multiple code paths for same financial operation
- **Recommendation**: Consolidate through single transactional entry point with idempotency key

## Unnecessary Code

### Authentication Flow Redundancy
- **Observation**: Both cookie-based (`session_token`) and Bearer JWT authentication supported
- **Risk**: Confusion about which auth method is active
- **Recommendation**: Document primary method (Bearer JWT in Authorization header) and deprecate cookie fallback

### Duplicate Permission Checks
- **Observation**: `requireRole` and `requirePermission` middleware both check auth but differ in scope
- **Risk**: Inconsistent authorization if both used incorrectly
- **Recommendation**: Use `requirePermission` for granular control; `requireRole` for high-level role checks only

## Documentation Inconsistencies

### Permission Matrix Discrepancies
- **Observation**: `docs/permissions.md` lists 32 permission keys. `packages/shared/src/roles.ts` defines PERMISSIONS enum and DEFAULT_ROLE_PERMISSIONS. Some route-level permissions differ from documented matrix.
- **Impact**: Potential authorization gaps if frontend and backend permissions diverge
- **Fix**: Align route permissions with shared PERMISSIONS enum

### Role Naming Conflicts
- **Observation**: `UserRoleType` enum in Prisma schema vs. `roles.ts` vs. `types.ts` all define role enums. Must stay in sync.
- **Impact**: Type mismatches if one source is updated without others
- **Fix**: Single source of truth - use `packages/shared/src/roles.ts` and ensure Prisma schema and types import from it

### Test Credentials Not Synchronized
- **Observation**: Demo credentials in seed.ts match `.env` but test file has additional login variations (mobile numbers, SMS OTP, etc.)
- **Risk**: Tests may pass with data that doesn't match production configuration
- **Fix**: Keep test credentials in sync with `.env`; add new credential variations as test configurations only