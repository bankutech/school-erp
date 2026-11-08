# School ERP — Enterprise School Management & Institutional Governance System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748.svg?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing_(61%2F61)-729B1B.svg?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA%20Compliant-purple.svg?style=flat-square&logo=w3c&logoColor=white)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

An enterprise-grade, full-stack School Management & Educational Resource Planning (ERP) platform built with a modular monorepo architecture. Engineered for K-12 schools, CBSE/ICSE institutions, and multi-campus academies to manage end-to-end academic governance, admissions pipelines, student records, fee collection, examinations, automated payroll, library circulations, transport logistics, and audit security.

---

## 🏛️ Executive Overview & Institutional Architecture

Traditional education software often suffers from fragmented silos — disparate tools for attendance, separate desktop billing packages, and manual paper roll-calls.

**School ERP** unifies these operations into a unified institutional workspace:
- **Calm, High-Density Institutional UX:** Inspired by Swiss archival systems and modern ERPs (Frappe Education, PowerSchool), built with clean typography, tabular data alignment, and keyboard accessibility.
- **Strict Role-Based Isolation:** 10 distinct operational roles with 48 server-enforced permission tokens and cryptographic anti-IDOR scoping (guardians see only their linked children; faculty see only their assigned rosters).
- **Relational Financial Integrity:** Strict fixed-precision decimal arithmetic (`DECIMAL(10, 2)`), double-entry transaction boundaries, idempotent fee payment processing, and verifiable fiscal receipt generation.
- **Conflict-Free Scheduling Engine:** Real-time timetable matrix with automated teacher, room, and section overlap detection.
- **In-App Demo Persona Switcher:** Built-in header switcher allowing evaluators to instantaneously toggle between Super Admin, Principal, Teacher, Accountant, Parent, and Student views with zero logout friction.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["CLIENT DEVICES & INTERACTION SURFACES"]
        Desktop["Desktop & Laptop Consoles (1280px - 1920px)"]
        Tablet["Administrative Tablets (768px - 1024px)"]
        Mobile["Parent & Faculty Mobile Phones (375px - 430px)"]
        CmdPalette["Global Command Palette (Ctrl + K) & Quick Actions"]
        PersonaBar["1-Click Demo Persona Switcher (RBAC Evaluation)"]
    end

    subgraph FrontendApp["FRONTEND WEB MONOREPO (apps/web — React 18 + Vite 6 + Tailwind CSS)"]
        Router["React Router v6 with v7 Transition Flags & Lazy-Loaded Chunks"]
        AuthCtx["AuthContext & AcademicContext (State Hydration & Session Storage)"]
        QueryCache["TanStack React Query v5 (Optimistic Mutation & Stale-Time Cache)"]
        
        subgraph ViewModules["Domain View Modules"]
            V_SIS["Student Information System & 360° Dossiers"]
            V_Att["90-Second Fast Roll-Call Attendance"]
            V_Fee["Tuition Billing, POS Receipts & Sibling Split"]
            V_Time["Weekly Timetable & Conflict Matrix"]
            V_Exam["CBSE Examination Lifecycle & Report Cards"]
            V_LMS["Coursework, Homework & Submissions"]
            V_Staff["Faculty HR, Leaves & Automated Payroll"]
            V_Trans["Transport Fleet & Route Assignment"]
            V_Lib["Library Cataloging & Barcode Loans"]
            V_Inv["Asset Inventory & Low-Stock Alerts"]
            V_Acc["General Ledger, Vouchers & CSV Exports"]
            V_Exec["Executive Cockpit & Trend Telemetry (Recharts)"]
        end
    end

    subgraph BackendAPI["MODULAR REST API GATEWAY (apps/api — Node.js v24 + Express + TypeScript)"]
        SecurityMW["Security Middleware (Helmet, CORS, Cookie-Parser, Rate-Limiter)"]
        AuthMW["Authentication Middleware (JWT Bearer / Session Cookies)"]
        RBACMW["Granular RBAC Enforcer (48 Permission Tokens + Anti-IDOR Scoping)"]
        ZodMW["Isomorphic Request Validator (Zod Schemas from @school-erp/shared)"]
        IdempotencyMW["Idempotency Filter (X-Idempotency-Key Deduplication)"]
        AuditService["Immutable Audit Service (Action, Actor, Resource, IP & Timestamp)"]

        subgraph ModuleControllers["Domain Controllers (/api/v1/*)"]
            C_Auth["Auth & Multi-Identifier Login Controller"]
            C_SIS["Students & Certificate Controller"]
            C_Att["Attendance & Batch Upsert Controller"]
            C_Fee["Fees, Invoicing & Receipts Controller"]
            C_Time["Timetable & Conflict Detection Controller"]
            C_Exam["Exams, Moderation & Report Card Controller"]
            C_Staff["Staff HR & Automated Payroll Controller"]
            C_Trans["Transport Fleet & Stops Controller"]
            C_Lib["Library & Fines Circulation Controller"]
            C_Inv["Inventory Stock Movement Controller"]
            C_Acc["Accounts Ledger & Financial Summary Controller"]
            C_Dash["Dashboard Telemetry & Aggregation Controller"]
        end
    end

    subgraph SharedPkg["SHARED CONTRACTS (@school-erp/shared)"]
        Contracts["DTOs, Role Enums, 48 Permissions, Zod Validation Schemas"]
    end

    subgraph DatabaseLayer["DATABASE PERSISTENCE (PostgreSQL 16 + Prisma ORM)"]
        PrismaClient["Prisma 6.2 Client Engine"]
        PostgresDB[("PostgreSQL 16 Relational Engine<br/>Composite Uniques • Foreign Keys • Decimal(10,2)")]
    end

    ClientLayer --> FrontendApp
    FrontendApp --> BackendAPI
    FrontendApp -.-> SharedPkg
    BackendAPI -.-> SharedPkg
    BackendAPI --> DatabaseLayer
```

---

## 🚦 Comprehensive Module Matrix

### 1. Admissions & Enrollment Funnel (`/admissions`)
- **Application Intake:** Public and administrative inquiry capture (`APP-2026-XXXX`).
- **Review Pipeline:** Status transitions from `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` → `ENROLLED`.
- **Atomic Enrollment:** Approving an applicant allocates student roll numbers, section seats, and parent linkages in one ACID transaction.

### 2. Student Information System (SIS) (`/students`)
- **360° Dossier Drawer:** Personal demographic data, guardian links, enrollment timeline, fee ledger, and historical attendance.
- **Document Generation:** Official institutional certificates with tamper-evident serial numbers (Transfer Certificate `TC-2026-XXXX`, Bonafide Certificate `BC-2026-XXXX`).
- **Student ID Cards:** Printable identity cards with student barcode, blood group, emergency contacts, and academic session.

### 3. Attendance & Roll Call (`/attendance`)
- **The 90-Second Rule:** Fast, keyboard-navigable roster (`Present`, `Absent`, `Late`, `Excused`) with batch bulk-save.
- **Duplicate Prevention:** Database-level composite unique constraint `@@unique([studentId, date, periodNumber])`.
- **Telemetry Visualizations:** Monthly classroom attendance heatmaps and rate percentage indicators.

### 4. Conflict-Free Timetable Management (`/timetable`)
- **Automated Clash Detection:** Real-time prevention of overlapping bookings:
  - Teacher cannot be assigned to two classes simultaneously.
  - Section cannot have multiple subjects during overlapping hours.
  - Classroom / Laboratory cannot be double-booked.
- **Substitute Teacher Management:** Faculty leave trigger with substitute allocation.

### 5. Examination Lifecycle & Report Cards (`/exams`)
- **Schedule Management:** Term schedules, subject-wise maximum and passing marks.
- **Marks Moderation:** Faculty entry grid with CBSE standard grade points (`A1` to `E`).
- **Immutable Publication:** Once results are published, mark records are locked (`403 EXAMINATION_LOCKED`) against tampering.
- **Printable Report Cards:** Consolidated academic report cards with attendance percentage and principal remarks.

### 6. Coursework & LMS (`/lms`)
- **Assignment Distribution:** Class-wise coursework assignments with due dates and syllabus topics.
- **Digital Submissions:** Student homework submissions with file attachments and turn-in timestamps.
- **Faculty Evaluation:** Scoring rubric with qualitative teacher feedback notes.

### 7. Staff HR & Automated Payroll (`/staff`)
- **Faculty Directory:** Employee master record (`EMP-2026-XXX`), department, designation, and qualification.
- **Automated Payroll Computation:** Formula-driven salary calculation:
  $$\text{Net Salary} = \text{Basic Salary} + \text{Allowances} - \text{Deductions}$$
- **Printable Payslips:** Itemized monthly salary slip generation with institutional stamp layout.

### 8. Tuition Fees & Bursar Invoicing (`/fees`)
- **Fee Structures:** Configurable breakdown (Tuition, Science Lab, Library, Sports, Transport).
- **Sibling & Household Consolidation:** Split lump-sum guardian payments across multiple siblings in one operation.
- **Dual Format Receipts:** Official A4 receipts and 80mm POS thermal slip formats with Indian Rupee (`₹`) formatting.

### 9. Library Catalog & Circulation (`/library`)
- **Catalog Management:** ISBN indexing, author classifications, and individual copy barcodes (`BC-XXXX-X`).
- **Circulation Lifecycle:** Issue and return tracking with automatic overdue calculation.

### 10. Transport Fleet & Route Assignment (`/transport`)
- **Fleet Roster:** School bus registrations, driver credentials, and passenger seating capacities.
- **Route Planning:** Multi-stop route tracking and student seat allocation to specific boarding stops.

### 11. Asset Inventory & Stock Movements (`/inventory`)
- **Stock Tracking:** School supplies, lab chemicals, stationery, and uniforms with unit allocations.
- **Stock In / Out Ledger:** Audit-tracked movements with minimum safety threshold alerts.

### 12. Financial Accounting & Exports (`/accounts`)
- **Double-Entry Summaries:** Real-time revenue versus operational expenditure balance sheets.
- **Voucher Ledger:** Categorized expenses with transaction dates and receipts.
- **CSV Data Exporter:** One-click CSV export engine for administrative records and audit scrutiny.

### 13. Institutional Communications (`/communication`)
- **Circular Broadcasting:** Official campus notices filtered by audience (`ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`).
- **Urgent Broadcasts:** Pinned priority alerts and event agendas.

### 14. Governance, RBAC & Security Audit (`/users`, `/audit`)
- **Granular RBAC:** Server-side verification across 48 discrete permissions.
- **Audit Trails:** Immutable logging of actor ID, IP address, user-agent, action type, and affected resource IDs.

---

## 👥 Role-Based Access Control (RBAC) & Persona Switcher

The platform comes pre-seeded with 6 evaluation personas accessible via the **In-App Demo Persona Switcher** in the top navigation header:

| Role | Operational Scope | Default Email | Demo Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Full institutional governance, security audit logs, system setup | `admin@school.erp` | `Password@123` |
| **Principal** | Academic policies, exam publishing, faculty oversight, admissions | `principal@school.erp` | `Password@123` |
| **Teacher** | Attendance roll-call, gradebook marks entry, LMS assignments | `teacher@school.erp` | `Password@123` |
| **Accountant** | Tuition invoicing, fee collection, POS receipts, expense vouchers | `accountant@school.erp` | `Password@123` |
| **Parent** | Student fees payment, child report card, attendance review | `parent@school.erp` | `Password@123` |
| **Student** | Timetable, class homework, exam results, library books | `student@school.erp` | `Password@123` |

*Note: Parents can also log in using their 10-digit mobile number (`9876543210`), and students can log in using their admission number (`ADM-2026-0001` or `2026-0001`).*

---

## 💻 Tech Stack & Monorepo Organization

```
school-erp/
├── apps/
│   ├── api/                   # Backend REST API (Node.js, Express, TypeScript)
│   │   ├── src/
│   │   │   ├── config/        # Environment and security configurations
│   │   │   ├── middleware/    # Auth, RBAC, Rate-Limiting, Idempotency, ErrorHandler
│   │   │   ├── modules/       # 14 Domain-Driven Feature Controllers & Routers
│   │   │   ├── services/      # Prisma ORM & Audit Logging Services
│   │   │   └── __tests__/     # 56 Vitest API Integration Tests
│   │   └── package.json
│   │
│   └── web/                   # Frontend SPA Cockpit (React 18, Vite 6, Tailwind CSS)
│       ├── src/
│       │   ├── components/    # Layout, FrappeLogo, CommandPalette, Recharts Widgets
│       │   ├── context/       # AuthContext (with Persona Switcher) & AcademicContext
│       │   ├── features/      # 14 Operational Views (Students, Fees, Timetable, etc.)
│       │   └── lib/           # Axios HTTP client with Bearer token interceptor
│       └── package.json
│
├── packages/
│   └── shared/                # Shared Isomorphic TypeScript Library
│       ├── src/               # Roles, DTO interfaces, Permission tokens, Zod schemas
│       └── package.json
│
├── prisma/
│   ├── schema.prisma          # PostgreSQL relational schema (30+ models)
│   └── seed.ts                # Deterministic institutional seed data
│
├── docs/                      # Architectural specs, database ERDs, test plans
├── scripts/                   # System verification & supervisor scripts
└── package.json               # Monorepo workspaces definition
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v24.x` (LTS recommended)
- **PostgreSQL**: `v15` or `v16` running on port `5432`
- **npm**: `v9.x` or `v10.x`

### 1. Clone the Repository
```bash
git clone https://github.com/bankutech/school-erp.git
cd school-erp
```

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

Configure your `.env` variables if needed:
```env
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_erp?schema=public
SESSION_SECRET=dev-school-erp-super-secret-key-change-in-production-min-32-chars
SESSION_EXPIRY_HOURS=24
DEFAULT_CURRENCY=INR
DEFAULT_CURRENCY_SYMBOL=₹
DEFAULT_TIMEZONE=Asia/Kolkata
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Push the schema to PostgreSQL and populate realistic demo accounts:
```bash
# Push Prisma schema to PostgreSQL
npm run prisma:generate
npx prisma db push --schema=./prisma/schema.prisma

# Seed institutional faculty, students, classes, and demo accounts
npx tsx prisma/seed.ts
```

### 5. Launch the Development Services
Start both API and Frontend in parallel or individually:

```bash
# Run backend API server (http://localhost:5000)
npm run dev:api

# Run web frontend (http://localhost:5173) in a second terminal
npm run dev:web
```

Navigate to **`http://localhost:5173`** to access the School ERP portal.

---

## 🧪 Testing & Verification

The project includes unit, integration, and full end-to-end operational verification suites:

### 1. Backend API Integration Tests (56 Tests)
```bash
npm run test --workspace=apps/api
```
*Covers RBAC enforcement, anti-IDOR checks, examination publication locks, timetable conflict prevention, and fee invoice allocations.*

### 2. Frontend Component & Accessibility Tests (5 Tests)
```bash
npm run test --workspace=apps/web
```
*Covers Student Information System accessibility, Login View form autofill, and Operations Cockpit metrics rendering.*

### 3. Full Monorepo End-to-End Operational Verification (10 Phases)
```bash
npx tsx scripts/verify-full-system.ts
```
*Validates the entire 10-phase operational lifecycle against a live backend in ~8 seconds.*

### 4. Production Monorepo Build
```bash
npm run build
```
*Executes TypeScript compilation across all packages and outputs code-split, minified Vite chunks.*

---

## ♿ Design System & Accessibility (WCAG 2.2 AA)

- **Contrast Ratios:** Text and interactive elements meet or exceed `4.5:1` contrast against backgrounds.
- **Reduced Motion:** Supports `@media (prefers-reduced-motion)` with calm, instantaneous transitions.
- **Keyboard Navigation:** Full hands-on-keyboard support via <kbd>Tab</kbd>, <kbd>Esc</kbd>, and global <kbd>Ctrl + K</kbd> command palette.
- **Screen Reader Announcements:** Dedicated ARIA live region announcements (`#sr-live-region`) on view transitions.
- **Tabular Data:** Tabular numerals (`tabular-nums`) across all timestamps, roll codes, currency figures, and marks to prevent visual layout shifts.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

Developed with pride for **Antigravity / SRM Academy Institutional Governance**.
