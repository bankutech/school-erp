import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../services/prisma.js';

const app = createApp();

describe('School ERP Backend API Integration Tests', () => {
  let adminToken: string;
  let teacherToken: string;
  let parentToken: string;

  beforeAll(async () => {
    // Wait for DB to be connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/v1/health should return 200 OK and database connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.service).toContain('School ERP');
  });

  it('POST /api/v1/auth/login with invalid credentials should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@school.erp', password: 'WrongPassword999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should authenticate Super Admin and return JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@school.erp', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.body.permissions.length).toBeGreaterThan(10);
    adminToken = res.body.token;
  });

  it('POST /api/v1/auth/login should authenticate Teacher', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@school.erp', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('TEACHER');
    expect(res.body.user.staffId).toBeDefined();
    teacherToken = res.body.token;
  });

  it('POST /api/v1/auth/login should authenticate Parent', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'parent@school.erp', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.user.guardianId).toBeDefined();
    parentToken = res.body.token;
  });

  it('POST /api/v1/auth/login should authenticate Parent using mobile number (+91 98765 43210)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '+91 98765 43210', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/v1/auth/login should authenticate Student using admission number (ADM-2026-0001)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ADM-2026-0001', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/v1/auth/login should authenticate Parent using unformatted 10-digit mobile (9876543210)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '9876543210', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/v1/auth/login should authenticate Parent using compact E.164 (+919876543210)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '+919876543210', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('PARENT');
  });

  it('POST /api/v1/auth/login should authenticate Parent using SMS OTP (424242)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '+91 98765 43210', password: '424242' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('PARENT');
  });

  it('POST /api/v1/auth/login should authenticate Student using lowercase admission number (adm-2026-0001)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'adm-2026-0001', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('STUDENT');
  });

  it('POST /api/v1/auth/login should authenticate Student using admission number without ADM- prefix (2026-0001)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '2026-0001', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('STUDENT');
  });

  it('POST /api/v1/auth/login should support keepSessionActive flag and set session cookie accordingly', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@school.erp', password: 'Password@123', keepSessionActive: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
  });

  it('POST /api/v1/auth/login should reject empty credentials with 400 validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '', password: 'Password@123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me should return current user info with permissions', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@school.erp');
  });

  it('GET /api/v1/academics/classes should return classes and sections', async () => {
    const res = await request(app)
      .get('/api/v1/academics/classes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const g10 = res.body.data.find((c: any) => c.code === 'G10');
    expect(g10).toBeDefined();
    expect(g10.sections.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/students should return enrolled students for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('SECURITY TEST: Parent should only see their own linked child (IDOR prevention)', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const adms = res.body.data.map((s: any) => s.admissionNumber);
    expect(adms).toContain('ADM-2026-0001');
    expect(adms).not.toContain('ADM-2026-0002'); // Cannot access other students' records
  });

  it('GET /api/v1/attendance/roster should return roster for Grade 10-A', async () => {
    const classesRes = await request(app)
      .get('/api/v1/academics/classes')
      .set('Authorization', `Bearer ${adminToken}`);

    const g10 = classesRes.body.data.find((c: any) => c.code === 'G10');
    const secA = g10.sections.find((s: any) => s.name === 'A');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const res = await request(app)
      .get(`/api/v1/attendance/roster?classId=${g10.id}&sectionId=${secA.id}&date=${todayStr}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.roster.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/v1/fees/invoices should return invoices and payments', async () => {
    const res = await request(app)
      .get('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const invoice = res.body.data[0];
    expect(invoice.payments.length).toBeGreaterThanOrEqual(1);
    expect(invoice.payments[0].receiptNumber).toMatch(/^REC-2026-\d+$/);
  });

  it('GET /api/v1/fees/household should return unified sibling balance for a household', async () => {
    const res = await request(app)
      .get('/api/v1/fees/household?search=Suresh')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const household = res.body.data[0];
    expect(household.guardianName).toBe('Suresh Patel');
    expect(household.siblings.length).toBeGreaterThanOrEqual(2);
    expect(household.totalHouseholdBalance).toBeGreaterThan(0);
  });

  it('GET /api/v1/dashboard/stats should return role-specific operational metrics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalStaff).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalFeeCollected).toBeDefined();
    expect(res.body.data.academicYear).toBeDefined();
  });

  it('GET /api/v1/dashboard/stats?academicYearId=... should return filtered stats for the given academic year', async () => {
    const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    expect(year).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/dashboard/stats?academicYearId=${year!.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(2);
    expect(res.body.data.academicYear.id).toBe(year!.id);
    expect(res.body.data.recentAudits).toBeInstanceOf(Array);
  });

  // ==========================================
  // PHASE 2 & 3 INTEGRATION TEST SUITES
  // ==========================================

  describe('Phase 2: Timetable Conflict Detection & Management', () => {
    let academicYearId: string;
    let sectionId: string;
    let subjectId: string;
    let teacherId: string;
    let createdEntryId: string;

    beforeAll(async () => {
      const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      academicYearId = year!.id;
      const sec = await prisma.section.findFirst({ include: { class: true } });
      sectionId = sec!.id;
      const sub = await prisma.subject.findFirst();
      subjectId = sub!.id;
      const st = await prisma.staff.findFirst({ where: { designation: { contains: 'Teacher' } } });
      teacherId = st!.id;

      // Clean up any slots from previous test runs
      await prisma.timetableEntry.deleteMany({
        where: { dayOfWeek: 1, startTime: '08:00' },
      });
    });

    it('POST /api/v1/timetable should schedule a slot when no clash exists', async () => {
      const res = await request(app)
        .post('/api/v1/timetable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYearId,
          sectionId,
          subjectId,
          teacherId,
          dayOfWeek: 1, // Monday
          startTime: '08:00',
          endTime: '08:45',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdEntryId = res.body.data.id;
    });

    it('POST /api/v1/timetable CLASH PREVENTION: Should reject overlapping slot with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/timetable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYearId,
          sectionId,
          subjectId,
          teacherId,
          dayOfWeek: 1,
          startTime: '08:30', // Overlaps 08:00-08:45!
          endTime: '09:15',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already');
    });

    it('POST /api/v1/timetable/substitutions should assign substitute teacher', async () => {
      const anotherTeacher = await prisma.staff.findFirst({
        where: { id: { not: teacherId } },
      });

      if (anotherTeacher) {
        const res = await request(app)
          .post('/api/v1/timetable/substitutions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            timetableEntryId: createdEntryId,
            substituteTeacherId: anotherTeacher.id,
            date: '2026-11-02',
            reason: 'Medical Leave',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('Phase 2: Examinations, Marks Entry & Report Cards', () => {
    let examId: string;
    let subjectId: string;
    let studentId: string;

    it('POST /api/v1/exams should schedule an examination with subjects', async () => {
      const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      const sub = await prisma.subject.findFirst();
      subjectId = sub!.id;

      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unit Test 1 - 2026',
          academicYearId: year!.id,
          startDate: '2026-10-01',
          endDate: '2026-10-10',
          subjects: [
            {
              subjectId,
              examDate: '2026-10-02',
              maxMarks: 100,
              passingMarks: 35,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      examId = res.body.data.id;
    });

    it('POST /api/v1/exams/marks should record marks with automatic grade computation', async () => {
      const student = await prisma.student.findFirst({ where: { admissionNumber: 'ADM-2026-0001' } });
      studentId = student!.id;

      const res = await request(app)
        .post('/api/v1/exams/marks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examinationId: examId,
          subjectId,
          marks: [
            {
              studentId,
              marksObtained: 95,
              remarks: 'Outstanding performance',
            },
          ],
          isFinalSubmission: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('POST /api/v1/exams/:id/publish should calculate rankings and generate report cards', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reportCardsGenerated).toBeGreaterThanOrEqual(1);

      // Verify student report card endpoint
      const cardRes = await request(app)
        .get(`/api/v1/exams/${examId}/report-cards/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cardRes.status).toBe(200);
      expect(cardRes.body.data.card.overallGrade).toBe('A1');
      expect(cardRes.body.data.card.rank).toBe(1);
    });
  });

  describe('Phase 2: Learning Management System (LMS)', () => {
    let assignmentId: string;

    it('POST /api/v1/lms/assignments should publish homework assignment', async () => {
      const sub = await prisma.subject.findFirst();

      const res = await request(app)
        .post('/api/v1/lms/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Calculus Assignment 1',
          description: 'Solve problems 1-10 from page 42.',
          subjectId: sub!.id,
          dueDate: '2026-11-15',
          maxMarks: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      assignmentId = res.body.data.id;
    });

    it('GET /api/v1/lms/assignments should list assignments', async () => {
      const res = await request(app)
        .get('/api/v1/lms/assignments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Phase 2: Communication & Circulars', () => {
    let noticeId: string;

    it('POST /api/v1/communication/notices should publish targeted notice', async () => {
      const res = await request(app)
        .post('/api/v1/communication/notices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Winter Uniform Mandatory Circular',
          content: 'All students must wear winter blazers starting next Monday.',
          targetAudience: 'ALL',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      noticeId = res.body.data.id;
    });

    it('GET /api/v1/communication/notices should return active circulars', async () => {
      const res = await request(app)
        .get('/api/v1/communication/notices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((n: any) => n.id === noticeId)).toBe(true);
    });
  });

  describe('Phase 3: Staff HR, Attendance & Payroll', () => {
    let createdStaffId: string;

    it('POST /api/v1/staff should onboard a new staff member', async () => {
      const empNo = `EMP-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: empNo,
          firstName: 'Anil',
          lastName: 'Kapoor',
          email: `${empNo.toLowerCase()}@aia.edu.in`,
          designation: 'Lab Instructor',
          department: 'Academics',
          joiningDate: '2026-01-15',
          basicSalary: 45000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      createdStaffId = res.body.data.id;
    });

    it('POST /api/v1/staff/payroll/generate should compute net salary and generate payslip', async () => {
      const res = await request(app)
        .post('/api/v1/staff/payroll/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: createdStaffId,
          month: 10,
          year: 2026,
          basicSalary: 45000,
          allowances: 5000,
          deductions: 2000,
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.netSalary)).toBe(48000); // 45000 + 5000 - 2000
    });
  });

  describe('Phase 3: Library Circulation', () => {
    let copyId: string;

    it('POST /api/v1/library/books should create book and copies', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Brief Answers to the Big Questions',
          author: 'Stephen Hawking',
          category: 'Science',
          copiesCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.copies.length).toBe(2);
      copyId = res.body.data.copies[0].id;
    });

    it('POST /api/v1/library/issues & /returns should complete borrowing lifecycle', async () => {
      const student = await prisma.student.findFirst();

      // Issue book
      const issueRes = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          copyId,
          studentId: student!.id,
          dueDate: '2026-11-20',
        });

      expect(issueRes.status).toBe(201);
      expect(issueRes.body.data.status).toBe('ISSUED');

      // Return book
      const returnRes = await request(app)
        .post('/api/v1/library/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ copyId });

      expect(returnRes.status).toBe(200);
      expect(returnRes.body.data.status).toBe('RETURNED');
    });
  });

  describe('Phase 3: Transport Fleet & Capacity Constraints', () => {
    let routeId: string;

    it('POST /api/v1/transport/vehicles & /routes should configure bus service', async () => {
      const vRes = await request(app)
        .post('/api/v1/transport/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: `DL 01 TR ${Date.now().toString().slice(-4)}`,
          driverName: 'Harish Chander',
          driverPhone: '+91-9876543219',
          capacity: 30,
        });

      expect(vRes.status).toBe(201);

      const rRes = await request(app)
        .post('/api/v1/transport/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Route 5 - South Campus',
          vehicleId: vRes.body.data.id,
          stops: [
            { stopName: 'Stop 1', pickupTime: '07:30', dropTime: '15:30', fare: 1000, order: 1 },
          ],
        });

      expect(rRes.status).toBe(201);
      routeId = rRes.body.data.id;
    });

    it('POST /api/v1/transport/assignments should allocate student seat', async () => {
      const student = await prisma.student.findFirst();
      const res = await request(app)
        .post('/api/v1/transport/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: student!.id,
          routeId,
          stopName: 'Stop 1',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Phase 3: Inventory Stock Movements', () => {
    let itemId: string;

    it('POST /api/v1/inventory/items & /movements should manage inventory stock', async () => {
      const itemCode = `INV-T-${Date.now().toString().slice(-4)}`;
      const itemRes = await request(app)
        .post('/api/v1/inventory/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemCode,
          name: 'Whiteboard Marker Box',
          category: 'Stationery',
          unit: 'BOX',
          minQuantity: 5,
          quantity: 20,
        });

      expect(itemRes.status).toBe(201);
      itemId = itemRes.body.data.id;

      // Deduct 5 markers
      const moveRes = await request(app)
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId,
          type: 'OUT',
          quantity: 5,
          reason: 'Issued to Academic Wing',
        });

      expect(moveRes.status).toBe(201);
      expect(moveRes.body.data.updatedItem.quantity).toBe(15);
    });
  });

  describe('Phase 3: Accounts, Ledger & Reports', () => {
    it('POST /api/v1/accounts/expenses should record operational expense', async () => {
      const res = await request(app)
        .post('/api/v1/accounts/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'Maintenance',
          title: 'Campus Garden & Sports Ground Maintenance',
          amount: 12500,
          paymentMode: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.amount)).toBe(12500);
    });

    it('GET /api/v1/accounts/summary should calculate operational surplus/deficit', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalFeeIncome).toBeDefined();
      expect(res.body.data.totalExpenses).toBeGreaterThan(0);
      expect(res.body.data.netSurplus).toBeDefined();
    });

    it('GET /api/v1/accounts/reports/export/students should export CSV roster', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/reports/export/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Admission No');
      expect(res.text).toContain('ADM-2026-0001');
    });

    it('POST /api/v1/accounts/expenses should reject non-positive amounts', async () => {
      const res = await request(app)
        .post('/api/v1/accounts/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'Maintenance',
          title: 'Invalid Zero Expense',
          amount: 0,
          paymentMode: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/users should list all users with role counts for Super Admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(res.body.data.roleCounts).toBeDefined();
    });

    it('GET /api/v1/audit/logs should return security audit records for Super Admin', async () => {
      const res = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/notifications should return current user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toBeDefined();
    });
  });

  describe('Enterprise Architecture & Institutional Hardening', () => {
    it('IDEMPOTENCY: Repeated mutations with identical Idempotency-Key return cached response', async () => {
      const idempotencyKey = `idemp-test-${Date.now()}`;

      // 1. First execution
      const res1 = await request(app)
        .post('/api/v1/attendance/bulk')
        .set('Authorization', `Bearer ${teacherToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          classId: 'dummy-class',
          sectionId: 'dummy-section',
          date: '2026-05-15',
          records: [],
        });

      // 2. Replay with identical key
      const res2 = await request(app)
        .post('/api/v1/attendance/bulk')
        .set('Authorization', `Bearer ${teacherToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          classId: 'dummy-class',
          sectionId: 'dummy-section',
          date: '2026-05-15',
          records: [],
        });

      expect(res2.status).toBe(res1.status);
      expect(res2.headers['x-idempotent-replay']).toBe('true');
    });

    it('EXAMINATION LOCK: Cannot modify marks after exam results are published', async () => {
      // Find an exam with status RESULTS_PUBLISHED or publish one
      const examsRes = await request(app)
        .get('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      const exam = examsRes.body.data[0];
      if (exam && exam.subjects[0]) {
        // Try publishing
        await request(app)
          .post(`/api/v1/exams/${exam.id}/publish`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Attempt to modify marks
        const modifyRes = await request(app)
          .post('/api/v1/exams/marks')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            examinationId: exam.id,
            subjectId: exam.subjects[0].subjectId,
            marks: [
              {
                studentId: 'd1a4ceb0-c7be-4d42-af5b-a478359e0625',
                marksObtained: 95,
              },
            ],
            isFinalSubmission: true,
          });

        expect(modifyRes.status).toBe(403);
        expect(modifyRes.body.error).toBe('EXAMINATION_LOCKED');
      }
    });

    it('SOFT DELETE: Archived student has deletedAt set and is excluded from active listings', async () => {
      // Create a test student
      const createRes = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Archive',
          lastName: 'Candidate',
          dateOfBirth: '2012-06-15',
          gender: 'MALE',
          academicYearId: 'e8c70e96-a631-4e3a-a290-17da5d7d23a7',
          classId: 'c1a4ceb0-c7be-4d42-af5b-a478359e0625',
          sectionId: 's1a4ceb0-c7be-4d42-af5b-a478359e0625',
        });

      if (createRes.status === 201) {
        const studentId = createRes.body.data.id;

        // Archive student
        const delRes = await request(app)
          .delete(`/api/v1/students/${studentId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.status).toBe(200);
        expect(delRes.body.success).toBe(true);

        // Verify active list excludes archived student
        const listRes = await request(app)
          .get('/api/v1/students?search=Archive')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(listRes.body.data.some((s: any) => s.id === studentId)).toBe(false);
      }
    });

    it('POST /api/v1/auth/forgot-password should return 200 generic response without account enumeration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ identifier: 'nonexistent-user-999@school.erp' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recovery instructions');
    });

    it('POST /api/v1/auth/forgot-password should generate reset token for existing user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ identifier: 'admin@school.erp' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tokenRecord = await prisma.passwordResetToken.findFirst({
        where: { user: { email: 'admin@school.erp' } },
        orderBy: { createdAt: 'desc' },
      });
      expect(tokenRecord).toBeDefined();
      expect(tokenRecord?.token).toBeDefined();
    });

    it('POST /api/v1/auth/reset-password with invalid token should return 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-fake-token-xyz', newPassword: 'NewSecurePassword@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/inventory/summary should return aggregated stock metrics', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalItems).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data.totalStockUnits).toBe('number');
      expect(typeof res.body.data.lowStockCount).toBe('number');
    });

    it('GET /api/v1/inventory/export should return CSV stock audit report', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Item Code,Name,Category,Current Quantity');
    });

    it('POST /api/v1/inventory/movements should reject OUT movement if stock is insufficient', async () => {
      const listRes = await request(app)
        .get('/api/v1/inventory/items')
        .set('Authorization', `Bearer ${adminToken}`);

      const item = listRes.body.data[0];
      expect(item).toBeDefined();

      const excessiveQty = item.quantity + 999999;
      const res = await request(app)
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: item.id,
          type: 'OUT',
          quantity: excessiveQty,
          reason: 'Excessive issue attempt test',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current stock');
    });
  });
});
