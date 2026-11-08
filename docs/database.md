# School ERP System — Database Design & Schema Reference

## Authoritative Store: PostgreSQL 16
The database is normalized, version-controlled via Prisma migrations, and enforces strict relational integrity, foreign key cascades, and unique constraints.

### Core Domain Models

#### 1. Identity & Security
- `User`: Global accounts (Admin, Principal, Teacher, Accountant, Parent, Student, etc.) with bcrypt hashed passwords.
- `Session`: Active server-side sessions with expiry and revocation capability.
- `AuditLog`: Immutable history of critical business actions with metadata.

#### 2. Academic Structure
- `AcademicYear`: Versioned calendar years (e.g. "2026-2027") with an active `isCurrent` flag.
- `Class` & `Section`: Academic hierarchy (e.g. Grade 10 - Section A) with room allocation and assigned class teacher.
- `Subject`: Course subjects linked to classes with credit hours and elective flags.
- `TeacherAssignment`: Maps a teacher to a specific subject, section, and academic year.

#### 3. Students & Admissions
- `AdmissionApplication`: Pre-enrolment pipeline with unique `applicationNo` (e.g. `APP-2026-0001`), guardian contact, and review workflow.
- `Student`: Authoritative student profile with immutable `admissionNumber` (e.g. `ADM-2026-0001`).
- `Guardian` & `StudentGuardian`: Many-to-many relationship supporting multiple guardians with a primary contact flag.
- `Enrolment`: Connects a student to a specific academic year, class, and section without overwriting historical records upon promotion.

#### 4. Attendance
- `AttendanceRecord`: Daily or period-wise student presence.
- **Integrity Constraint**: `@@unique([studentId, date, periodNumber])` guarantees no duplicate records can ever be recorded for a student on the same date/session.

#### 5. Fees & Finance
- `FeeStructure` & `FeeComponent`: Academic fee plans broken into itemized components (Tuition, Lab, Sports).
- `Invoice` & `InvoiceLine`: Student billable charges with subtotal, concessions, balance, and due date.
- `Payment`: Financial transaction records with method (UPI, Cash, Bank Transfer), reference number, and receipt number (`REC-2026-00001`).
- **Precision**: Monetary columns utilize PostgreSQL `DECIMAL(10, 2)`.
