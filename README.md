# Antigravity Academy — Custom School ERP System

A production-grade, full-stack School Management & ERP system built from scratch with a modular monolith architecture. Conforms directly to the functional requirements baseline in `School ERP System.pdf`.

---

## 🌟 Architecture & Technology Stack

- **Frontend (`apps/web`)**: React 18, Vite, TypeScript (strict mode), Tailwind CSS, Lucide icons, React Router v6, TanStack Query v5, React Hook Form, Zod.
- **Backend API (`apps/api`)**: Node.js v24 (ARM64 native), Express, TypeScript, REST API under `/api/v1`, Zod schema validation, Argon2/bcrypt security, Audit logging.
- **Database (`prisma/`)**: PostgreSQL 16 with Prisma ORM (Binary Engine for ARM64/Windows compatibility), explicit foreign keys, composite unique constraints, fixed-precision `DECIMAL(10, 2)` monetary arithmetic.
- **Shared Package (`packages/shared`)**: DTO interfaces, enum contracts, permission tokens, and isomorphic Zod schemas.

---

## 🚦 Features & Implemented Modules (Phase 0 & Phase 1)

1. **Role-Based Access Control (RBAC)**:
   - 10 distinct system roles (Super Admin, Principal, Administrator, Teacher, Accountant, HR Manager, Librarian, Transport Manager, Parent, Student).
   - 32 granular permission tokens server-enforced on every protected route.
   - Anti-IDOR security: Parents can only access records for their linked children; students can only view their own records.

2. **School Setup & Academics**:
   - Academic Years with active year indicators.
   - Classes, Sections, Rooms, and Capacity.
   - Course Subjects with credit hours and elective indicators.
   - Teacher assignments linking faculty to specific subjects and sections.

3. **Admissions Pipeline**:
   - Online application intake with applicant and guardian details.
   - Unique application tracking numbers (`APP-2026-0001`).
   - Review workflow (Submitted -> Under Review -> Approved -> Enrolled).
   - Atomic seat allotment & enrolment converting approved applicants into full student records.

4. **Student Information System (SIS)**:
   - 360-degree student profile drawer (personal, guardians, enrolment history, fees, attendance).
   - Official Certificate generator (Transfer Certificates `TC-2026-0001`, Bonafide Certificates `BC-2026-0001`).

5. **Daily & Period Attendance**:
   - Class roster with instant status marking (Present, Absent, Late, Excused).
   - Duplicate-safe database constraints (`studentId + date + periodNumber`).
   - Single-click "Mark All Present" with bulk transactional save.

6. **Fee Management & Receipts**:
   - Fee structures with itemized components (Tuition, Labs, Sports, Library).
   - Batch invoice generation with payment due dates.
   - Real partial & full payments with overpayment prevention.
   - Official verifiable receipt numbers (`REC-2026-00001`).
   - Indian Rupee (`₹`) formatting.

7. **Role-Specific Dashboards**:
   - Live query metrics for Admins, Teachers, Accountants, Parents, and Students.
   - Today's attendance percentage, fee collections, outstanding balances, and recent audit logs.

---

## 🚀 Quick Start

```powershell
# 1. Start persistent local PostgreSQL supervisor (if using bundled binary)
node scripts/postgres-daemon.js

# 2. Synchronize database & seed demo accounts
npx prisma db push --schema=./prisma/schema.prisma
npx tsx prisma/seed.ts

# 3. Start Backend API (http://localhost:5000)
npx tsx watch apps/api/src/server.ts

# 4. Start Web Application (http://localhost:5173)
npm run dev --workspace=apps/web
```

---

## 🧪 Testing & Verification

```powershell
# Run backend API Vitest integration tests
npx vitest run apps/api/src/__tests__/api.test.ts

# Run the complete 6-step Milestone 1 verification workflow
npx tsx scripts/verify-milestone.ts
```

For complete architectural details and database schemas, see `docs/architecture.md`, `docs/database.md`, and `docs/setup.md`.
