# School ERP System — Local Development & Setup Guide

This guide walks through setting up and running the School ERP System locally on Windows (including native ARM64 and x64 environments).

---

## 1. Prerequisites
- **Node.js**: v20+ or v24+ (native ARM64 or x64)
- **npm**: v10+ or v11+
- **PostgreSQL**: v16+ (Portable standalone binary included under `C:\Users\Sagni\pgsql\pgsql` or local service)
- **PowerShell**: Execution policy set to `RemoteSigned`

---

## 2. Environment Configuration
Copy the provided `.env.example` to `.env`:
```powershell
cp .env.example .env
```

Default connection string:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_erp?schema=public
SESSION_SECRET=dev-school-erp-super-secret-key-change-in-production-min-32-chars
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
```

---

## 3. Database Initialization & Standalone Postgres
If running the bundled standalone PostgreSQL 16:
```powershell
node scripts/postgres-daemon.js
```
The supervisor daemon will:
1. Verify the data cluster in `C:\Users\Sagni\pgsql_data`.
2. Start PostgreSQL 16 on `127.0.0.1:5432`.
3. Create the `school_erp` database if not present.

---

## 4. Install Dependencies & Build Packages
From the repository root:
```powershell
# 1. Install monorepo dependencies
npm install

# 2. Build shared types & validation package
npm run build --workspace=packages/shared

# 3. Synchronize schema to PostgreSQL
npx prisma db push --schema=./prisma/schema.prisma

# 4. Seed demo users, academic structure, and initial records
npx tsx prisma/seed.ts
```

---

## 5. Running the Application

### Option A: Run Both in Development Mode
In separate terminal windows:

**Backend API (`http://localhost:5000`):**
```powershell
npx tsx watch apps/api/src/server.ts
```

**Frontend Web App (`http://localhost:5173`):**
```powershell
npm run dev --workspace=apps/web
```

### Option B: Production Build Verification
```powershell
npm run build --workspaces
```

---

## 6. Demo Credentials & Login Personas
All demo accounts use the standard password: `Password@123`

| Role | Email | Scope & Purpose |
| :--- | :--- | :--- |
| **Super Admin** | `admin@school.erp` | System configuration, all modules, audit logs |
| **Principal** | `principal@school.erp` | Academic oversight, approvals, reports |
| **Teacher** | `teacher@school.erp` | Assigned Grade 10-A, attendance & marks |
| **Accountant** | `accountant@school.erp` | Fee structures, invoicing, payments & receipts |
| **Parent** | `parent@school.erp` | Linked child (Aarav Patel) attendance & dues |
| **Student** | `student@school.erp` | Own timetable, results & records |

The Login screen features an **Instant Persona Switcher** allowing one-click sign-in for any role.

---

## 7. Running Tests
Execute the automated integration test suite:
```powershell
npx vitest run apps/api/src/__tests__/api.test.ts
```

Execute the full 6-step Milestone 1 verification:
```powershell
npx tsx scripts/verify-milestone.ts
```
