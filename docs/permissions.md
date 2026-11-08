# School ERP System — Permissions & Access Control Matrix

The ERP enforces server-side granular permissions rather than role names alone. Every API route verifies that the requesting user's role has the required permission token.

| Role | Default Granular Permissions | Access Scoping |
| :--- | :--- | :--- |
| **Super Admin** | Complete access to all 32 permission keys | System-wide |
| **Principal** | Academic, SIS, Admissions, Attendance, Exams, Reports, Audits | School-wide oversight |
| **Administrator** | Users, Academics, Admissions, SIS, Attendance, Reports, Certs | School operations |
| **Teacher** | Assigned Class Attendance, Marks Entry, LMS, Circulars | Assigned sections only |
| **Accountant** | Fees Read/Write, Fee Collection, Invoicing, Receipts, Reports | Financial domain only |
| **Parent** | Attendance Read, Exams Read, Fees Read, Notices | Linked children only |
| **Student** | Timetable, Marks Read, LMS Submit, Notices | Own profile only |

### Anti-IDOR Protections
- In `/api/v1/students` and `/api/v1/fees/invoices`, parent queries are automatically scoped by `guardianId` on the server.
- Student queries are strictly pinned to `req.user.studentId`.
- Teachers cannot mark attendance or enter marks for classes they are not assigned to teach.
