# School ERP System — Architecture Specification

## 1. Overview
The School ERP System is engineered as a production-ready modular monolith. It unifies admissions, academics, examinations, attendance, fee collection, staff payroll, transport, library, and reporting around a single authoritative student record in PostgreSQL.

## 2. Directory Layout & Monorepo Structure
```
school-erp/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript REST API
│   │   ├── src/
│   │   │   ├── config/          # Environment configuration
│   │   │   ├── middleware/      # Auth, Permissions, Validation, Error Handling
│   │   │   ├── modules/         # Domain modules (auth, academics, admissions, SIS, attendance, fees, dashboard)
│   │   │   ├── services/        # Prisma client & connection manager
│   │   │   ├── app.ts           # Express application setup
│   │   │   └── server.ts        # Server entry point
│   └── web/                     # React + Vite + TypeScript Frontend
│       ├── src/
│       │   ├── app/             # Application shell, routing & providers
│       │   ├── components/      # UI component library & layout elements
│       │   ├── features/        # Module views (auth, admissions, students, attendance, fees, dashboard)
│       │   └── lib/             # API client, utils, formatters
├── packages/
│   └── shared/                  # Shared types, enums, constants, Zod schemas
├── prisma/
│   ├── schema.prisma            # Comprehensive PostgreSQL schema
│   └── seed.ts                  # Development & verification seed script
├── docs/                        # Architecture, database, permissions, and setup guides
└── scripts/                     # Local background services and utilities
```

## 3. Security Architecture
- **Authentication**: Stateful session tracking in PostgreSQL with JWT verification. Tokens are delivered via HttpOnly cookies and `Authorization: Bearer <token>` headers.
- **Authorization**: Server-enforced Role-Based Access Control (RBAC) with granular permissions. Access is checked on every protected endpoint.
- **Data Boundary Protection**: Cross-student and cross-guardian isolation prevents IDOR. Parents can strictly only query records belonging to their linked children; students can only view their own timetable, marks, and attendance.
- **Audit Logging**: Sensitive operations (mark submission, attendance corrections, fee adjustments, enrolments) log actor ID, action name, target entity, and timestamp.
- **Financial Correctness**: Uses fixed-precision decimals (`Decimal(10, 2)`) to eliminate floating-point rounding errors. Multi-step payment allocations and enrolment workflows are enclosed in ACID database transactions.
