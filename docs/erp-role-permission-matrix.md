# School ERP Role Permission Matrix

## Permission Model

The ERP enforces server-side granular permissions rather than role names alone. Every API route verifies that the requesting user's role has the required permission token. Super Admin always has all permissions.

### Permission Syntax
- `PERMISSIONS.FEES_READ`: 'fees:read'
- `PERMISSIONS.FEES_WRITE`: 'fees:write'
- Full list in `packages/shared/src/roles.ts`

### Role Hierarchy
- SUPER_ADMIN: All 32 permissions
- PRINCIPAL: 25 permissions (subset of SUPER_ADMIN)
- ADMINISTRATOR: 25 permissions (limited academic/admissions control)
- TEACHER: 14 permissions (class/section scoped)
- ACCOUNTANT: 7 permissions (financial domain only)
- HR_MANAGER: 6 permissions (staff HR domain)
- LIBRARIAN: 4 permissions (library domain)
- TRANSPORT_MANAGER: 3 permissions (transport domain)
- PARENT: 6 permissions (linked children only)
- STUDENT: 5 permissions (own profile only)

## Detailed Permission Matrix

| Permission Key | Description | Super | Principal | Admin | Teacher | Accountant | HR Manager | Librarian | Transport | Parent | Student |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **users:read** | View user list | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **users:write** | Create/update users | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **roles:manage** | Manage roles/permissions | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **academic:read** | View academic structure | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **academic:write** | Create/update academic structure | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **admissions:read** | View admission applications | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **admissions:write** | Create/edit admissions | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **admissions:approve** | Approve/reject applications | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **students:read** | View student records | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **students:write** | Create/update students | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **students:certificates** | Issue certificates | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **attendance:read** | View attendance records | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **attendance:mark** | Mark attendance | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **attendance:correct** | Correct attendance records | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **timetable:read** | View timetables | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **timetable:write** | Create/edit timetables | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **exams:read** | View examination schedules | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **exams:write** | Create/edit examinations | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **marks:enter** | Enter examination marks | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **marks:publish** | Publish examination results | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **fees:read** | View fee structures/invoices | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **fees:write** | Create/edit fee structures | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **fees:collect** | Collect/record payments | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **fees:refund** | Process refunds/reversals | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **accounts:read** | View accounts/expenses | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **accounts:write** | Create/edit accounts/expenses | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **reports:view** | View operational reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| **settings:manage** | Manage school configuration | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **audit:read** | View audit logs | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **lms:read** | View LMS assignments/homework | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **lms:write** | Create/edit LMS assignments | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **lms:submit** | Submit LMS assignments (student) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **lms:grade** | Grade LMS submissions (teacher) | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **communication:read** | View notices/messages | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **communication:write** | Create/edit notices/messages | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **staff:read** | View staff directory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| **staff:write** | Create/edit staff records | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **leave:request** | Submit leave request (staff) | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **leave:approve** | Approve/reject leave requests | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **payroll:read** | View payroll/payslips | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **payroll:process** | Process payroll | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **library:read** | View library catalog | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **library:write** | Create/edit book records | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **library:issue** | Issue/return books | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| **transport:read** | View transport routes/vehicles | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **transport:write** | Create/edit transport routes | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **inventory:read** | View inventory/stock levels | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **inventory:write** | Create/edit inventory items | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **inventory:issue** | Issue assets/consumables | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Access Scoping Rules

### Super Admin
- System-wide access to all entities and operations
- Can manage users, roles, and permissions
- Can configure school-wide settings
- Can access all audit logs
- No record-level scoping (system-level only)

### Principal
- School-wide oversight across all modules
- Can view any student, staff, or fee record within the school
- Can approve/reject admissions and leave requests
- Can publish examination results
- Cannot modify another user's password or credentials

### Administrator
- School operations management
- Can manage user accounts and roles
- Can configure academic structure (classes, sections, subjects)
- Can process admissions from application to enrollment
- Can view and collect fees
- Cannot access staff payroll details (HR scope separate)
- Cannot modify another user's credentials

### Teacher
- Assigned classes and subjects only
- Cannot access records for classes they are not assigned to teach
- Marks submission limited to assigned subjects/classes
- Attendance only for assigned sections
- Timetable only for assigned classes/sections
- Cannot access unrelated fee records, staff payroll or administrative secrets
- Can view own timetable and marks

### Accountant
- Financial domain only
- Can view student records (for fee assessment)
- Can create and manage fee structures, invoices, payments
- Can view expense records
- Cannot view staff payroll details beyond own department
- Cannot access student grades or examination results
- Can generate receipts and financial reports

### HR Manager
- Staff HR domain
- Can view and manage staff records
- Can process leave requests and approvals
- Can view payroll and generates payslips
- Cannot access student records or fee information
- Cannot access academic structure (classes, subjects, timetables)
- Can view inventory and transport (read-only)

### Librarian
- Library domain
- Can manage book catalog and copies
- Can issue/return books to students/staff
- Can view student records for book borrowing history
- Cannot access fee records, examination results, or staff payroll
- Cannot modify academic structure or admissions

### Transport Manager
- Transport domain
- Can manage vehicles, routes, and assignments
- Can view student transport allocations
- Cannot access student academic records or fee details
- Cannot modify library records or staff payroll
- Can view inventory (stationery, fuel, maintenance items)

### Parent
- Linked children only
- Can view own children's student records
- Can view attendance for linked children
- Can view examination results for linked children
- Can view fee invoices and payment history for linked children
- Can make payments for linked children's invoices
- Can view timetables for linked children
- Can view notices and communications directed to parents
- Cannot view other students' records (IDOR prevention)
- Cannot access staff payroll or administrative secrets
- Cannot modify other students' records

### Student
- Own profile only
- Can view own timetable
- Can view own marks and grades
- Can submit LMS assignments
- Can view own attendance
- Can view own library issued books
- Can view own fee balance (limited)
- Can view own notices and communications
- Cannot access other students' records
- Cannot view staff payroll or fee details of other students
- Cannot modify own record without authorization

## Anti-IDOR Protections

### Parent Queries
- `/api/v1/students` and `/api/v1/fees/invoices` automatically scoped by `guardianId` on server
- Parent token restricted to linked child IDs via `studentGuardian` relationship verification
- Server query: `WHERE studentId IN (SELECT studentId FROM StudentGuardian WHERE guardianId = :guardianId)`

### Student Queries
- Strictly pinned to `req.user.studentId`
- Even SUPER_ADMIN cannot bypass without explicit entity ID authorization
- Server query: `WHERE id = :studentId AND isActive = true`

### Teacher Assignment Verification
- Before marking attendance or entering marks, server verifies teacher is assigned to the class/section
- Query: `SELECT * FROM TeacherAssignment WHERE teacherId = :teacherId AND sectionId = :sectionId`
- Before publishing results, verify teacher's examination assignment
- Query: `SELECT * FROM TeacherAssignment WHERE teacherId = :teacherId AND subjectId = :subjectId`

## Permission Enforcement Code Path

Every protected endpoint follows this authorization chain:

1. **`authenticateToken` middleware**: Verifies JWT, checks session revocation in DB, attaches `req.user` with role and permissions
2. **`requirePermission` middleware**: Checks if `req.user.permissions` includes all required permission keys
   - Short-circuits for `SUPER_ADMIN`
   - Returns 403 if any required permission missing
3. **Route-level scoping**: Additional `WHERE` clauses in Prisma queries based on user role and ID
   - Parents: `guardianId` filter
   - Students: `studentId` filter
   - Teachers: `classId`/`sectionId` assignment verification
4. **Business logic validation**: Domain-specific checks (e.g., teacher can only mark attendance for assigned sections)

### Example Authorization Flow

```
POST /api/v1/attendance/bulk
    │
    ├─ authenticateToken → req.user = { role: 'TEACHER', staffId: 's1', permissions: ['attendance:mark'] }
    │
    ├─ requirePermission(PERMISSIONS.ATTENDANCE_MARK) → passes
    │
    ├─ Teacher assignment check:
    │   SELECT * FROM Section WHERE id = 'secA' AND classTeacherId = 's1' OR EXISTS
    │   (SELECT * FROM TeacherAssignment WHERE teacherId = 's1' AND sectionId = 'secA')
    │   → passes (teacher is assigned)
    │
    ├─ Bulk attendance upsert with unique constraint [studentId, date, periodNumber]
    │   → succeeds or returns 409 duplicate
    │
    └─ Audit log: ACTION = 'ATTENDANCE_MARKED', entityId = attendance record IDs
```

## Permission Gap Analysis

| Gap Identified | Risk | Recommendation |
|---|---|---|
| `leave:request` only for TEACHER role | HR staff or administrators may need to submit leaves too | Add `HR_MANAGER` and `ADMINISTRATOR` to `leave:request` or create generic `staff:leave:submit` permission |
| No `fees:refund` for PRINCIPAL | Principal cannot process refunds without accountant | Add `PERMISSIONS.FEES_REFUND` to Principal's DEFAULT_ROLE_PERMISSIONS |
| No `audit:read` for PRINCIPAL | Principal cannot review audit logs for oversight | Consider adding limited audit read permission for principal |
| `transport:write` missing for ACCOUNTANT | Accountant may need to record transport-related expenses | Add conditional transport write permission for accountant role |
| Parent `communication:write` missing | Parents cannot post class notices or circulars | Intentional - parent communication should be one-way (read) or via approved channels only |
| Student `library:issue` already included | OK - students can issue books | No change needed |
| Missing `exam:publish` for principal | Review and approve result publication | Add to principal permissions if not already covered by `marks:publish` |
| Teacher cannot `fees:collect` | Correct - teachers should not handle fees | No change needed - proper separation |
| Accountant cannot `students:write` | Correct - accountants shouldn't create student records | No change needed - proper separation |