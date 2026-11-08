# School ERP Test Plan

## Test Strategy

### Testing Pyramid
- **Unit Tests**: 40% - Individual functions, utilities, validation schemas
- **Integration Tests**: 40% - API endpoint behavior, database transactions, Prisma operations
- **End-to-End Tests**: 20% - Complete user workflows from UI to database

### Test Methodologies

1. **Unit Tests**: Vitest with happy path and error path testing
   - Mock Prisma client where appropriate
   - Test Zod schema validation
   - Test utility functions (formatting, calculations)

2. **Integration Tests**: Supertest against real Express + Prisma
   - Use test database (not production)
   - Seed test data before each test suite
   - Test API contracts match frontend expectations
   - Verify RBAC enforcement on every endpoint

3. **End-to-End**: Vitest with @testing-library/react + Vitest browser
   - Complete user journeys
   - Role-based navigation verification
   - Form validation and submission
   - Accessibility checks

## Authentication Test Scenarios

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Valid Login** | - Login with admin@school.erp / Password@123<br>- Login with principal@school.erp / Password@123<br>- Login with teacher@school.erp / Password@123<br>- Login with accountant@school.erp / Password@123<br>- Login with parent@school.erp / Password@123<br>- Login with student@school.erp / Password@123 | All return 200 with success=true, valid JWT token, user role, and permissions |
| **Invalid Credentials** | - Wrong password for any user<br>- Non-existent email/identifier | All return 401 with success=false, error 'Unauthorized' |
| **Expired Session** | - Log out, then try authenticated request<br>- Manually expire session in DB | Returns 401 with success=false, error 'Session has been invalidated or expired' |
| **Revoked Session** | - Log out from one tab, access from another<br>- Admin revokes session via API | Immediate 401 in secondary tab; blacklisted token rejected |
| **Logout** | - POST /api/v1/auth/logout with valid token<br>- Verify session deleted from DB | Returns 200; subsequent requests with same token return 401 |
| **Password Recovery** | - POST /api/v1/auth/forgot-password with existing user email<br>- POST /api/v1/auth/forgot-password with non-existent email<br>- Reset password with valid token<br>- Reset password with invalid token | Existing user: 200 + recovery instructions<br>Non-existent: 200 + generic message (no enumeration)<br>Valid token: 200 + new password acceptance<br>Invalid token: 400 |
| **Unauthorized Access** | - GET protected route without token<br>- GET protected route with invalid token<br>- GET admin route as parent/student | All return 401 or 403 as appropriate |
| **Role Restrictions** | - Teacher attempting admin operations<br>- Parent accessing other students' records<br>- Student accessing fee records of others | All return 403 Forbidden with appropriate message |
| **Rate Limits** | - 5 failed login attempts per 15 minutes per IP/identifier<br>- 10 failed attempts per hour triggers progressive delay | After 5 failures: 429 or progressively longer delays<br>After 10: 30-minute lockout |

## Student Information System Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Student Creation** | - Create student with all fields (admissionNumber, name, DOB, gender, etc.)<br>- Create student with minimal required fields<br>- Create student with duplicate admissionNumber | 201 with student data<br>201 with defaults<br>409 Unique Constraint Violation |
| **Student Update** | - Update student profile fields<br>- Update with partial data<br>- Update with audit logging verification | 200 with updated data<br>AuditLog entry created with userId, action, entity, metadata |
| **Student Search/Filter** | - Search by admission number<br>- Search by name (first/last)<br>- Search by class/section/academic year<br>- Pagination validation (page 0, negative page)<br>- Large limit values | Correct results returned<br>Page defaults to 1, limit to 10<br>Validation errors for invalid params |
| **Student Search IDOR Prevention** | - Parent trying to access another parent's children<br>- Student trying to view another student's record | Parent: only sees linked children (403 for unlinked)<br>Student: 403 if not own record |
| **Student Promotion** | - Promote students to next grade/section<br>- Verify old enrolment status → PROMOTED<br>- Verify new enrolment status → ACTIVE<br>- Test with multiple students in transaction | Old enrolments marked PROMOTED<br>New enrolments created ACTIVE<br>All-or-nothing transaction |
| **Student Archive/Soft Delete** | - Archive student (isActive: false, deletedAt set)<br>- Verify excluded from active listings<br>- Verify audit log entry | Student inactive flag set<br>Active listings exclude archived<br>Audit log: STUDENT_ARCHIVED |
| **Certificate Issuance** | - Issue Transfer Certificate (TC-YYYY-NNNN)<br>- Issue Bonafide Certificate (BC-YYYY-NNNN)<br>- Verify certificate number uniqueness<br>- Link certificate to student | Unique certificate numbers<br>Linked to student via studentId<br>Audit log: CERTIFICATE_ISSUED |
| **Guardian Linking** | - Create guardian with contact details<br>- Link guardian to multiple students (siblings)<br>- Mark primary guardian<br>- Unlink guardian | Guardian created and linked<br>Multiple student links possible<br>Primary flag designates primary contact |

## Attendance Management Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Mark Attendance (Bulk)** | - Mark all students Present for a class/section/date<br>- Mark mixed statuses (Present, Absent, Late, Excused)<br>- Period-wise attendance (periodNumber > 0)<br>- Teacher unauthorized section attempt | Records created for each student<br>Each student gets appropriate status<br>403 if teacher not assigned to section |
| **Duplicate Prevention** | - Attempt to mark same student/date/period twice<br>- Bulk mark with existing records | 409 Conflict or upsert behavior (updates existing)<br>Unique constraint enforced at DB level |
| **Attendance Correction** | - Correct a previously marked attendance record<br>- Specify reason for correction (min 3 chars)<br>- Verify original status preserved in audit | Original status preserved<br>New status applied<br>Audit log: ATTENDANCE_CORRECTED with from/to/reason |
| **Attendance Summary** | - Get attendance summary for a student<br>- Calculate percentage: (Present + Late + 0.5*HalfDay) / Total * 100<br>- Filter by date range<br>- Export to CSV (if applicable) | Percentage calculated to 2 decimal places<br>Correct counts per status<br>Records ordered by date descending |
| **Holiday Handling** | - Mark attendance on school holiday<br>- Ensure holidays not counted in percentage<br>- Configure school calendar holidays | Holidays excluded from attendance percentage<br>Effective present count adjusted<br>Calendar integration required |
| **Bulk Update Transactionality** | - Mark 30 students present in one transaction<br>- Partial failure scenario (some already marked)<br>- Network interruption during bulk mark | All-or-nothing: either all saved or none<br>No partial updates to database<br>Error returned if any record fails |
| **Attendance Rate Calculation** | - Today's attendance rate: effectivePresent / attendanceTotal * 100<br>- Round to nearest whole number<br>- 0% when no students enrolled | Correct percentage displayed<br>Rounded as specified<br>Handles zero-division edge case |

## Examination and Results Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Exam Creation** | - Create examination with name, dates, academic year<br>- Add subjects with maxMarks, passingMarks<br>- Create examination in DRAFT status<br>- Publish examination to SCHEDULED | Examination created with ID<br>Subjects linked via ExaminationSubject<br>Status: DRAFT initially<br>Status transitions to SCHEDULED |
| **Marks Entry** | - Enter marks for each student per subject<br>- MarksObtained validated (0 to maxMarks)<br>- isFinalSubmission flag<br>- Non-final submission allows edits<br>- Final submission locks marks | Marks stored with obtained value<br>Validation: 0 <= marksObtained <= maxMarks<br>Final submission locks record<br>Non-final allows updates |
| **Marks Validation** | - Marks exceeding maxMarks → 400 error<br>- Negative marks → 400 error<br>- Missing marks → not treated as zero<br>- Marks for unenrolled students → error | Validation error response<br>Negative rejected<br>Missing → pending status, not zero<br>Enrollment verified before entry |
| **Automatic Grade Calculation** | - Marks entered → grade computed from grading scheme<br>- Configure grading scheme bands (A1, A2, B1, etc.)<br>- Verify gradePoint calculation<br>- Test with boundary percentages (e.g., exactly 90%) | Grade calculated per scheme bands<br>GradePoint from band configuration<br>Boundary cases handled correctly (inclusive/exclusive) |
| **Result Publication** | - Publish examination results → status RESULTS_PUBLISHED<br>- Calculate rankings and percentages<br>- Generate report cards for all enrolments<br>- Notify parents via notification system | Results published<br>Rank calculated (1 = highest)<br>Report cards generated per enrolment<br>Notifications sent to linked parents |
| **Result Correction (Unpublished)** | - Unpublished results can be modified<br>- Correction workflow: modify marks → re-publish<br>- Published results cannot be modified → 403 EXAMINATION_LOCKED | Unpublished: marks editable, then re-publishable<br>Published: 403 with error EXAMINATION_LOCKED<br>Attempt to modify after publish blocked |
| **Historical Result Preservation** | - Publish multiple examination versions<br>- Access previous published results<br>- Compare across terms/years | Previous versions preserved<br>Accessible via examination ID and version<br>Version history in audit logs |
| **Subject-wise Analysis** | - Pass/fail rates per subject<br>- Average marks per subject<br>- Distribution graph data<br>- Class comparison across subjects | Aggregated statistics computed<br>Distribution data for charting<br>Class comparison across subjects/terms |

## Fee and Financial Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Invoice Generation** | - Generate invoice for individual student<br>- Generate invoices for class/year level<br>- Prevent duplicate invoice for same student/year/fee plan<br>- Verify invoice number format (INV-YYYY-NNNNN) | Invoice created with unique number<br>Duplicate prevention via check<br>Format: INV-YYYY-NNNNN |
| **Partial Payment** | - Record payment for portion of invoice balance<br>- Invoice status → PARTIALLY_PAID<br>- Balance reduced by payment amount<br>- Re-markable: can add more payments later | Status updated correctly<br>Balance = total - paid<br>Remaining balance collectible |
| **Full Payment** | - Record payment for entire invoice balance<br>- Invoice status → PAID<br>- Balance → 0<br>- Receipt number generated (REC-YYYY-NNNNN) | Status updated to PAID<br>Balance = 0<br>Unique receipt number generated |
| **Duplicate Payment Prevention** | - Submit same payment twice with same idempotency key<br>- Submit same payment twice with different keys<br>- Both should succeed or first wins | First: 201 + receipt<br>Second with same key: 200 cached response<br>Second with different key: 409 or error (balance already 0) |
| **Overpayment Prevention** | - Payment amount > invoice balance → 400 error<br>- Payment amount = balance → 201 success<br>- Payment amount < balance → 201 partial | Amount > balance: 400 validation error<br>Amount = balance: 201 PAID<br>Amount < balance: 201 PARTIALLY_PAID |
| **Failed Payment** | - Simulate failed payment (e.g., insufficient funds)<br>- Balance unchanged after failed attempt<br>- Status remains UNPAID | Balance: unchanged (original value)<br>Status: UNPAID persists<br>No receipt number generated |
| **Refund Processing** | - Process refund for a completed payment<br>- Create reversal voucher record<br>- Restore balance to invoice<br>- Audit log: FEE_REFUND or PAYMENT_REVERSED | Refund amount returned to balance<br>Original payment marked refunded<br>Audit trail preserved |
| **Payment Reversal** | - Reverse a payment (different from refund)<br>- Maintain original transaction history<br>- New balance calculated from remaining records | Original transaction kept intact<br>Reversal recorded separately<br>Audit trail: both original and reversal |
| **Receipt Generation** | - Receipt number format: REC-YYYY-NNNNN<br>- Receipt corresponds to real transaction in DB<br>- Receipt includes: amount, method, reference, date, collector<br>- Verify receipt in invoice payments list | Receipt number unique and sequential<br>DB record matches receipt display<br>All payment fields visible |
| **Balance Reconciliation** | - Recalculate invoice balance from payments: total - sum(all payments)<br>- Reconcile after multiple partial payments<br>- Discrepancy detection and resolution | Balance = totalAmount - sum(payment.amounts)<br>After multiple payments: correct remaining<br>Any discrepancy flagged and resolved |
| **Household/Sibling Balances** | - Get household balance for guardian with multiple children<br>- Calculate total billed, total paid, total balance across all siblings<br>- Individual student balances visible<br>- Unpaid invoice list per student | Unified household balance returned<br>Per-sibling breakdown visible<br>Per-student unpaid invoices listed |
| **Expense Tracking** | - Create expense record (category, title, amount)<br>- View expense summaries by category<br>- Filter by date range<br>- View total expenses vs income | Expense created and stored<br>Category-wise summaries<br>Date-filtered results<br>Net surplus/deficit calculated |
| **Financial Anomaly Detection** | - Detect duplicate payment references (same UTR/ref number)<br>- Detect receipts with inconsistent payment states<br>- Detect unusual manual fee adjustments<br>- Detect repeated failed payment attempts<br>- Detect invoice-payment mismatches | Each anomaly surfaced as review alert<br>Not automatic fraud accusation<br>Requires authorized review |

## LMS (Homework/Learning) Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Assignment Creation** | - Create homework assignment with title, description, subject, due date<br>- Set maxMarks (optional)<br>- Attach file URL (optional)<br>- Publish to class/section | Assignment created with ID<br>Linked to subject and class<br>Due date stored<br>Max marks optional |
| **Assignment Listing** | - List assignments for a subject<br>- List assignments for a class/section<br>- Filter by due date range<br>- Search by title keyword | Correct assignments returned<br>Filtered by requested criteria<br>Search finds matching titles |
| **Assignment Submission** | - Student submits content or file URL<br>- Submission timestamp recorded<br>- Teacher receives notification<br>- Late submission flag if past dueDate | Submission created with submittedAt<br>Timestamp: current time or specified<br>Notification sent to teacher<br>Late flag if submittedAfter dueDate |
| **Teacher Feedback & Grading** | - Teacher enters marksGiven (0 to maxMarks)<br>- Add feedback text<br>- Mark as graded (gradedAt timestamp)<br>- Return to student with feedback | Marks and feedback stored<br>Graded timestamp set<br>Student notified of feedback |
| **Resubmission Rules** | - Allow resubmission before due date<br>- Disallow resubmission after due date<br>- Track number of submissions per student<br>- Maximum resubmission attempts configurable | Submission count tracked<br>Before dueDate: allowed to resubmit<br>After dueDate: blocked or late submission |
| **Learning Resources** | - Upload lesson plans or resources<br>- Link to specific subject/class<br>- File type and size validation<br>- Download permissions by role | Resources uploaded and stored<br>Linked to correct subject/class<br>Validation enforced<br>Appropriate download access |

## Staff HR and Payroll Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Staff Onboarding** | - Create staff with employeeNumber, name, email, designation, department<br>- Employee number must be unique<br>- Email must be unique<br>- Basic salary defaults to 0 if not provided | 201 with staff data<br>409 if employeeNumber or email exists<br>basicSalary: 0.00 if not provided |
| **Staff Update** | - Update staff profile fields<br>- Update designation or department<br>- Update basic salary<br>- Audit log on changes | 200 with updated data<br>Audit log: STAFF_UPDATED with changes metadata |
| **Leave Request** | - Submit casual/sick/maternity/privilege leave request<br>- Specify startDate, endDate, reason (min 1 char)<br>- Status → PENDING initially<br>- Approve/reject by authorized role | Leave request created<br>Status: PENDING<br>Approval by: HR Manager/Principal/Super Admin |
| **Leave Approval** | - Approve leave request → status APPROVED<br>- Reject leave request → status REJECTED<br>- Approval history preserved<br>- Notification to staff | Status updated to APPROVED/REJECTED<br>ApprovedBy field set<br>Notification sent to staff staffId |
| **Payslip Generation** | - Generate payslip for staff month/year<br>- Compute netSalary: basicSalary + allowances - deductions<br>- Status: DRAFT → GENERATED → PAID<br>- Print/payslip download | Net salary = basic + allowances - deductions<br>Correctly computed<br>Status transitions as specified |
| **Staff Attendance** | - Mark staff attendance (PRESENT/ABSENT/ON_LEAVE/HALF_DAY)<br>- Check-in/check-out timestamps<br>- Unique constraint: [staffId, date] prevents double-marking<br>- Correction preserves original value | Attendance record created/updated<br>Check-in/out times stored<br>409 if already marked for that date<br>Correction: original preserved, correction recorded |
| **Staff Attendance Correction** | - Correct previously marked staff attendance<br>- Specify reason for correction<br>- Original status preserved in audit | Original status kept<br>New status applied<br>Audit log: STAFF_ATTENDANCE_CORRECTED |
| **Payroll Reports** | - View total payroll by department<br>- View individual payslips<br>- View net salary totals<br>- Filter by month/year | Correct aggregation per department<br>Individual slips viewable<br>Totals computed accurately<br>Filtering works as expected |

## Library Management Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Book Creation** | - Create book with title, author, ISBN, category, publisher, edition<br>- Specify number of copies<br>- ISBN must be unique if provided | Book created with ID<br>Copies created (count specified)<br>ISBN unique enforced if provided |
| **Book Copy Status** | - Issue book copy to student<br>- Return book copy from student<br>- Track status changes (AVAILABLE → ISSUED → RETURNED → LOST → MAINTENANCE)<br>- Due date tracking | Status transitions tracked<br>Due date = issueDate + configurable period<br>Fines calculated for late returns |
| **Book Issue** | - Issue book to student with due date<br>- Validate student has no overdue books<br>- Record fine amount if late<br>- Decrement available copy count | Issue record created<br>Copy status: ISSUED<br>Due date set<br>Fine if past due date |
| **Book Return** | - Return book with optional fine amount<br>- Update copy status to RETURNED<br>- Clear due date<br>- Add fine to student's outstanding balance | Status: RETURNED<br>Due date cleared<br>Fine added if applicable<br>Fine: `fineAmount` field on issue record |
| **Fine Calculation** | - Configurable fine rates per library policy<br>- No fines for calendar-exempted periods<br>- Fine accrual: per-day or flat fee<br>- Maximum fine cap configurable | Fine calculated per policy rules<br>Exempt periods excluded<br>Per-day or flat rate as configured<br>Maximum cap enforced |
| **Borrowing History** | - View student's borrowed/returned books<br>- View overdue books list<br>- View total fines paid<br>- View books currently issued | History queryable per student<br>Overdue list: status=OVERDUE<br>Total fines: sum of all fineAmount<br>Current issues: status=ISSUED |
| **Book Search** | - Search by title, author, ISBN<br>- Filter by category<br>- Filter by availability status | Search returns matching books<br>Case-insensitive where applicable<br>Availability filter works |

## Transport Management Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Vehicle Creation** | - Create vehicle with vehicleNumber, driverName, driverPhone, capacity<br>- Vehicle number must be unique<br>- Status defaults to ACTIVE | 201 with vehicle data<br>409 if vehicleNumber exists<br>Status: ACTIVE by default |
| **Route Creation** | - Create route with name, vehicleId, stops (min 1)<br>- Stop includes: stopName, pickupTime, dropTime, fare, order<br>- Route assignments visible | Route created with ID<br>Stores all stop details<br>Assignments link students to route |
| **Student Transport Assignment** | - Assign student to route and stop<br>- Validate student not already assigned to another route<br>- Validate route capacity not exceeded<br>- Stop name matches student's residential area | Assignment created<br>Student linked to route/stop<br>Capacity checked (enrolled < max)<br>Stop appropriate for student location |
| **Transport Capacity Check** | - Enrolled students < vehicle capacity<br>- Route stops capacity per vehicle<br>- Waitlist if at capacity<br>- Over-assignment prevention | Capacity not exceeded<br>Enrolled count ≤ vehicle capacity<br>Waitlist created if needed<br>Over-assignment: 409 error |
| **Transport Document Expiry** | - Track insurance expiry date on vehicle<br>- Track permit expiry date<br>- Alert 30 days before expiry<br>- Prevent operation if expired | Expiry dates stored<br>Alerts generated proactively<br>403 if vehicle operated with expired docs |
| **Transport Route Search** | - Search routes by name<br>- Filter by vehicle<br>- View all stops on route<br>- View students assigned to route | Search returns matching routes<br>Vehicle filter narrows results<br>All stops displayed<br>Student assignments listed |

## Inventory Management Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Inventory Item Creation** | - Create item with itemCode, name, category, unit, minQuantity, quantity<br>- itemCode must be unique<br>- Default minQuantity: 5, default quantity: 0 | 201 with item data<br>409 if itemCode exists<br>Defaults applied if omitted |
| **Stock Movement** | - IN movement: increase quantity<br>- OUT movement: decrease quantity<br>- Validate sufficient stock before OUT<br>- ADJUSTMENT movement: set to specific quantity<br>- Reason required for each movement | Movement recorded<br>Quantity updated accordingly<br>OUT rejected if insufficient stock<br>Adjustment sets exact quantity |
| **Insufficient Stock Prevention** | - Attempt OUT movement with qty > current quantity<br>- Error message includes current stock level<br>- Transaction rolled back | 400 error with "Current stock" message<br>No negative stock unless configured<br>Quantity remains unchanged |
| **Low-Stock Alert** | - Item quantity ≤ minQuantity triggers alert<br>- Configurable minQuantity per item<br>- Report shows all low-stock items | Alert triggered when threshold breached<br>Report lists all items at or below min<br>Configurable per item |
| **Inventory Movement History** | - View all movements IN/OUT/ADJUSTMENT per item<br>- View who performed each movement<br>- View reason for each movement<br>- View date/time of each movement | Full history queryable per item<br>Actor (performedBy) recorded<br>Reason stored if provided<br>Timestamp: createdAt automatically |
| **Inventory Export** | - Export CSV with item code, name, category, current qty, min qty<br>- Include total stock units across items<br>- Filter by category or status | CSV export with all required columns<br>Total stock units computed<br>Filter by category works<br>Filter by min/max quantity |

## Report and Analytics Tests

| Test Category | Specific Tests | Expected Outcome |
|---|---|---|
| **Academic Reports** | - Students by grade and section<br>- Subject performance (marks, grades)<br>- Examination results summary<br>- Grade distribution chart data<br>- Promotion/retention rates | Correct student grouping<br>Performance aggregates<br>Result totals and percentages<br>Distribution data for charting<br>Promotion ratio calculated |
| **Admissions Reports** | - Applications by status (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ENROLLED)<br>- Admission conversion rate (enrolled / applied)<br>- Enrolment by grade/section<br>- Waiting-list statistics<br>- Application document completion rate | Status breakdown counts<br>Conversion: ENROLLED / total applications<br>Enrolment by grade/section<br>Waiting list count<br>Document completion % |
| **Financial Reports** | - Daily collections (date range)<br>- Monthly collections (per month)<br>- Outstanding invoices list<br>- Overdue balances (due date + unpaid)<br>- Payment-method breakdown (UPI/Cash/Bank)<br>- Refund totals<br>- Discounts and concessions total<br>- Fee collection by grade | All figures computed from source records<br>Date boundaries respected<br>Reports agree with underlying ledger<br>Breakdown by payment method<br>Refund amounts summed<br>Concessions total from fee adjustments |
| **HR Reports** | - Staff headcount by department<br>- Attendance summary (present/absent rates)<br>- Leave balances by type<br>- Department distribution<br>- Contract expiry alerts (if applicable) | Headcount per department<br>Attendance percentages per class<br>Leave balances per staff member<br>Department distribution chart<br>Expiry notifications if applicable |
| **Operations Reports** | - Library circulation (issues/returns over period)<br>- Overdue books list<br>- Transport assignments per vehicle<br>- Vehicle document expiry status<br>- Inventory levels (low-stock items) | Circulation counts per period<br>Overdue list with fines<br>Assignment per vehicle<br>Expiry alerts status<br>Low-stock item list |
| **Report Pagination** | - Paginate through large result sets<br>- Default page/limit (1/10 or 1/50)<br>- Custom page and limit parameters<br>- Link to next/prev pages in response | Pagination metadata in response<br>total, page, limit, totalPages<br>Custom params respected<br>Navigation links working |
| **Report Export (CSV)** | - Export report data as CSV<br>- Headers match data fields<br>- No sensitive data exposed (SSN, passwords, tokens)<br>- Downloadable from UI | CSV file downloads successfully<br>Headers: relevant data fields only<br>No secrets in export<br>File format correct |
| **Report Consistency** | - Dashboard KPI figures match report figures<br>- Reconcile daily/weekly/monthly totals<br>- Verify no double-counting across reports | All figures derive from same source<br>No contradictory data between reports<br>Audit trail for any adjustments |

## End-to-End Workflow Tests

### Workflow 1: Admission Application → Enrolment
1. Submit admission application via `POST /api/v1/admissions` → returns application with `applicationNo`
2. Admin reviews application via `PATCH /api/v1/admissions/:id/review` with status APPROVED/ENROLLED
3. System executes atomic transaction:
   - Creates student record with unique `admissionNumber` (ADM-YYYY-NNNN)
   - Creates/links guardian record
   - Creates active enrolment in target class/section with roll number
   - Generates initial invoice from fee structure
   - Updates application status to ENROLLED
4. Parent logs in, views linked child's student record
5. **Acceptance**: Student appears in student listings; invoice generated; application status ENROLLED

### Workflow 2: Student Creation → Guardian Linking → Parent Login
1. Super Admin creates student via `POST /api/v1/students` with guardian details
2. System creates guardian record (if not exists) and links via `StudentGuardian`
3. Parent user account created with `guardianId` linkage
4. Parent logs in via `POST /api/v1/auth/login` with parent credentials
5. Parent accesses child-specific dashboard (only linked child visible)
6. Parent views attendance, fees, assignments for own child
7. **Acceptance**: Parent can switch between multiple linked children; no unrelated student records visible

### Workflow 3: Teacher Login → Assigned Class → Attendance → Report
1. Teacher logs in via `POST /api/v1/auth/login`
2. Teacher calls `GET /api/v1/academics/classes` → sees assigned classes/sections only
3. Teacher marks attendance via `POST /api/v1/attendance/bulk` for assigned section
4. Teacher enters marks via `POST /api/v1/exams/marks` for assigned subject
5. Teacher or admin publishes results via `POST /api/v1/exams/:id/publish`
6. Parent logs in, views child's report card with grades and ranking
7. **Acceptance**: Teacher only sees assigned classes; parent sees own child's results; marks locked after publication

### Workflow 4: Invoice Generation → Payment Verification → Receipt → Updated Balance
1. Admin generates invoices via `POST /api/v1/fees/invoices/generate` for class/year
2. Parent logs in, views invoices for linked children
3. Parent makes payment via `POST /api/v1/fees/payments` with amount and method
4. System records payment, updates invoice balance and status
5. Receipt number generated (`REC-YYYY-NNNNN`)
6. Parent views receipt and updated outstanding balance
7. **Acceptance**: Payment recorded in DB; receipt number unique; balance = total - sum(all payments)

### Workflow 5: Staff Creation → Leave Request → Approval
1. Admin creates staff member via `POST /api/v1/staff`
2. Staff member logs in, submits leave request via `POST /api/v1/staff/leaves` (or frontend)
3. HR Manager/Principal approves/rejects via API or UI
4. Staff receives notification of approval/rejection
5. Staff views updated leave balance
6. **Acceptance**: Leave request workflow completes; approval recorded; staff notified; balance updated

### Workflow 6: Library Book Creation → Issue → Renewal → Return
1. Librarian creates book via `POST /api/v1/library/books` with copies
2. Librarian issues book via `POST /api/v1/library/issues` to student with due date
3. Student (or librarian) renews book via `POST /api/v1/library/renewals` (if no reservations)
4. Student returns book via `POST /api/v1/library/returns` with fine if late
5. Librarian views borrowing history and outstanding fines
6. **Acceptance**: Book tracked through lifecycle; due dates; fines; status transitions correct

### Workflow 7: Transport Route Creation → Student Assignment → Parent View
1. Admin creates vehicle via `POST /api/v1/transport/vehicles`
2. Admin creates route via `POST /api/v1/transport/routes` with stops
3. Admin assigns students to route via `POST /api/v1/transport/assignments`
4. Parent logs in, views transport details for linked child (route, stop, fare)
5. Parent receives transport announcements/notifications
6. **Acceptance**: Student assigned to correct route/stop; parent sees relevant transport info; capacity not exceeded

### Workflow 8: Asset Purchase → Stock Receipt → Assignment → Return
1. Admin creates inventory item via `POST /api/v1/inventory/items`
2. Admin records stock receipt via `POST /api/v1/inventory/movements` (type: IN, quantity)
3. Item assigned to department/employee via appropriate endpoint
4. Item returned or transferred via `POST /api/v1/inventory/movements` (type: OUT or ADJUSTMENT)
5. Admin views inventory history and current stock levels
6. **Acceptance**: Stock tracked from receipt through assignment; history preserved; no negative stock

### Workflow 9: Administrative Action → Audit Record → Report
1. Admin/authorized user performs any critical operation (student create, fee collect, attendance mark, marks publish, etc.)
2. System generates AuditLog entry with: userId, action, entity, entityId, metadata (actor, action, target, timestamps)
3. Audit log searchable by: action type, date range, actor, entity type
4. Super Admin views audit logs via `GET /api/v1/audit/logs`
5. **Acceptance**: Every critical operation logged; logs searchable; no sensitive data (passwords, tokens) in logs

## Test Data Management

### Test Database Setup
- Use separate test database or schema
- Run `npx tsx prisma/seed.ts` with test data before each test suite
- Clean up test data after suites (prisma migrate rollback or delete)
- Never run destructive tests against production data

### Test Isolation
- Each test suite should be independently executable
- Use `beforeAll` to set up prerequisite data (academic years, classes, users)
- Use `afterAll` to disconnect prisma and clean up
- Use `beforeEach` to reset test-specific state (not global state)
- Mock external services (email, SMS, payment gateways) where needed

### Test Credentials (from seed)
- Super Admin: admin@school.erp / Password@123
- Principal: principal@school.erp / Password@123
- Teacher: teacher@school.erp / Password@123
- Accountant: accountant@school.erp / Password@123
- Parent: parent@school.erp / Password@123 (guardianId linked to student1 ADM-2026-0001)
- Student: student@school.erp / Password@123 (studentId: student1)

### Test Environment Configuration
- NODE_ENV = 'test' or 'development'
- DATABASE_URL pointing to test database
- Session secret configured for test environment
- CORS origin set to test frontend URL
- API prefix for test routes

## Performance Testing Criteria

### Load Testing
- **Concurrent users**: 50 simultaneous API requests
- **Response times**:
  - Health check: < 50ms
  - Authentication login: < 200ms
  - Student list (admin): < 300ms with 100 students
  - Attendance roster: < 500ms with 1 class, 30 students
  - Invoice list: < 300ms with 50 invoices
  - Dashboard stats: < 500ms
- **Database query limits**: No queries fetching > 1000 records without pagination
- **N+1 query prevention**: Use Prisma `include` and `select` to fetch all needed data in 1-2 queries
- **Index utilization**: Key search/filter fields have database indexes

### Stress Testing
- **Concurrent payment attempts**: 10 simultaneous payment recordings for same invoice
- **Result**: Only one succeeds; others get 400 "exceeds balance" or idempotency key returns cached 200
- **Bulk attendance**: 30 students marked simultaneously in single transaction
- **Result**: All-or-nothing; either all 30 recorded or none
- **Database connection pool**: Max connections configured; no leaks under load

## Accessibility Testing Checklist

### WCAG 2.2 AA Compliance
- [ ] Text contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Keyboard navigation: Tab order logical, Focus visible on all interactive elements
- [ ] Screen reader labels: All images have alt text, All form fields labeled, All buttons have text or aria-label
- [ ] Focus management: Focus trap in modals, Focus returns to trigger after modal close
- [ ] Error messages: Associated with specific form fields, Clear description of problem
- [ ] Empty states: Descriptive, with guidance or next action
- [ ] Responsive design: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] No horizontal overflow on any viewport
- [ ] Text resizable up to 200% without loss of content or functionality
- [ ] Skip links: "Skip to main content" on pages with navigation bars
- [ ] ARIA labels: Used where visual meaning not conveyed by text alone
- [ ] Color is not the only means of conveying information (e.g., error status red + text message + icon)

### Testing Tools
- axe-core for automated accessibility scanning
- screen reader testing (NVDA, VoiceOver)
- Manual keyboard-only navigation
- Color contrast checker