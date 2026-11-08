import { PrismaClient, UserRoleType, Gender, EnrolmentStatus, AttendanceStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. School Settings
  await prisma.schoolSettings.deleteMany();
  const school = await prisma.schoolSettings.create({
    data: {
      schoolName: 'Antigravity International Academy',
      code: 'AIA001',
      address: 'Plot 42, Knowledge Park III, Greater Noida, Delhi NCR 201306',
      phone: '+91-11-23456789',
      email: 'admissions@aia.edu.in',
      website: 'https://aia.edu.in',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log('✅ School Settings configured:', school.schoolName);

  // 2. Academic Year
  const currentYear = await prisma.academicYear.upsert({
    where: { name: '2026-2027' },
    update: { isCurrent: true },
    create: {
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
    },
  });
  console.log('✅ Academic Year configured:', currentYear.name);

  // 3. Classes & Sections
  const grade10 = await prisma.class.upsert({
    where: { code: 'G10' },
    update: {},
    create: {
      name: 'Grade 10',
      code: 'G10',
      order: 10,
    },
  });

  const grade9 = await prisma.class.upsert({
    where: { code: 'G9' },
    update: {},
    create: {
      name: 'Grade 9',
      code: 'G9',
      order: 9,
    },
  });

  // Staff: Teacher & Accountant
  const teacherStaff = await prisma.staff.upsert({
    where: { employeeNumber: 'EMP-2026-001' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-001',
      firstName: 'Vikram',
      lastName: 'Sharma',
      email: 'vikram.sharma@aia.edu.in',
      phone: '+91-9876500001',
      designation: 'Senior Mathematics Teacher',
      department: 'Academics',
      joiningDate: new Date('2020-06-01'),
      basicSalary: 65000.0,
    },
  });

  const accountantStaff = await prisma.staff.upsert({
    where: { employeeNumber: 'EMP-2026-002' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-002',
      firstName: 'Rajesh',
      lastName: 'Verma',
      email: 'rajesh.verma@aia.edu.in',
      phone: '+91-9876500002',
      designation: 'Senior Accountant',
      department: 'Administration',
      joiningDate: new Date('2019-03-15'),
      basicSalary: 55000.0,
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { classId_name: { classId: grade10.id, name: 'A' } },
    update: { classTeacherId: teacherStaff.id },
    create: {
      name: 'A',
      classId: grade10.id,
      roomNumber: 'Room 204',
      capacity: 35,
      classTeacherId: teacherStaff.id,
    },
  });

  const sectionB = await prisma.section.upsert({
    where: { classId_name: { classId: grade10.id, name: 'B' } },
    update: {},
    create: {
      name: 'B',
      classId: grade10.id,
      roomNumber: 'Room 205',
      capacity: 35,
    },
  });

  // 4. Subjects
  const mathSubject = await prisma.subject.upsert({
    where: { classId_code: { classId: grade10.id, code: 'MATH10' } },
    update: {},
    create: {
      name: 'Mathematics',
      code: 'MATH10',
      classId: grade10.id,
      creditHours: 4.0,
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: { classId_code: { classId: grade10.id, code: 'SCI10' } },
    update: {},
    create: {
      name: 'Science (Physics & Chemistry)',
      code: 'SCI10',
      classId: grade10.id,
      creditHours: 4.0,
    },
  });

  // Teacher assignment
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_subjectId_sectionId_academicYearId: {
        teacherId: teacherStaff.id,
        subjectId: mathSubject.id,
        sectionId: sectionA.id,
        academicYearId: currentYear.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherStaff.id,
      subjectId: mathSubject.id,
      sectionId: sectionA.id,
      academicYearId: currentYear.id,
    },
  });

  // 5. Default Passwords (hash = bcrypt 10 rounds)
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Users for all 10 roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.erp' },
    update: { role: UserRoleType.SUPER_ADMIN },
    create: {
      email: 'admin@school.erp',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRoleType.SUPER_ADMIN,
    },
  });

  const principalUser = await prisma.user.upsert({
    where: { email: 'principal@school.erp' },
    update: {},
    create: {
      email: 'principal@school.erp',
      passwordHash,
      firstName: 'Dr. Ramesh',
      lastName: 'Gupta',
      role: UserRoleType.PRINCIPAL,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.erp' },
    update: { staffId: teacherStaff.id },
    create: {
      email: 'teacher@school.erp',
      passwordHash,
      firstName: 'Vikram',
      lastName: 'Sharma',
      role: UserRoleType.TEACHER,
      staffId: teacherStaff.id,
    },
  });

  const accountantUser = await prisma.user.upsert({
    where: { email: 'accountant@school.erp' },
    update: { staffId: accountantStaff.id },
    create: {
      email: 'accountant@school.erp',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Verma',
      role: UserRoleType.ACCOUNTANT,
      staffId: accountantStaff.id,
    },
  });

  // 6. Students, Guardians & Enrolments
  const student1 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM-2026-0001' },
    update: { phone: '+91-9876500010' },
    create: {
      admissionNumber: 'ADM-2026-0001',
      firstName: 'Aarav',
      middleName: 'Kumar',
      lastName: 'Patel',
      dateOfBirth: new Date('2010-08-14'),
      gender: Gender.MALE,
      email: 'aarav.patel@student.aia.edu.in',
      phone: '+91-9876500010',
      address: 'Flat 302, Palm Heights, Sector 62, Noida',
      bloodGroup: 'B+',
    },
  });

  const student2 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM-2026-0002' },
    update: {},
    create: {
      admissionNumber: 'ADM-2026-0002',
      firstName: 'Ananya',
      lastName: 'Iyer',
      dateOfBirth: new Date('2010-11-22'),
      gender: Gender.FEMALE,
      email: 'ananya.iyer@student.aia.edu.in',
      phone: '+91-9876543211',
      address: 'House 14, Silver Oak Estate, Noida',
      bloodGroup: 'O+',
    },
  });

  const student3 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM-2026-0003' },
    update: {},
    create: {
      admissionNumber: 'ADM-2026-0003',
      firstName: 'Priya',
      middleName: 'Kumari',
      lastName: 'Patel',
      dateOfBirth: new Date('2013-05-18'),
      gender: Gender.FEMALE,
      email: 'priya.patel@student.aia.edu.in',
      phone: '+91-9876543212',
      address: 'Flat 302, Palm Heights, Sector 62, Noida',
      bloodGroup: 'B+',
    },
  });

  // Guardians
  const guardian1 = await prisma.guardian.upsert({
    where: { email: 'suresh.patel@gmail.com' },
    update: { phone: '+91 98765 43210' },
    create: {
      name: 'Suresh Patel',
      relation: 'Father',
      phone: '+91 98765 43210',
      email: 'suresh.patel@gmail.com',
      occupation: 'Software Architect',
    },
  });

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: student1.id, guardianId: guardian1.id } },
    update: {},
    create: {
      studentId: student1.id,
      guardianId: guardian1.id,
      isPrimary: true,
    },
  });

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: student3.id, guardianId: guardian1.id } },
    update: {},
    create: {
      studentId: student3.id,
      guardianId: guardian1.id,
      isPrimary: false,
    },
  });

  // Student & Parent User Accounts
  await prisma.user.upsert({
    where: { email: 'student@school.erp' },
    update: { studentId: student1.id, phone: null },
    create: {
      email: 'student@school.erp',
      passwordHash,
      firstName: 'Aarav',
      lastName: 'Patel',
      phone: null,
      role: UserRoleType.STUDENT,
      studentId: student1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'parent@school.erp' },
    update: { guardianId: guardian1.id, phone: '+91 98765 43210' },
    create: {
      email: 'parent@school.erp',
      passwordHash,
      firstName: 'Suresh',
      lastName: 'Patel',
      phone: '+91 98765 43210',
      role: UserRoleType.PARENT,
      guardianId: guardian1.id,
    },
  });

  // Enrolments
  await prisma.enrolment.upsert({
    where: { studentId_academicYearId: { studentId: student1.id, academicYearId: currentYear.id } },
    update: {},
    create: {
      studentId: student1.id,
      academicYearId: currentYear.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      rollNumber: 1,
      status: EnrolmentStatus.ACTIVE,
    },
  });

  await prisma.enrolment.upsert({
    where: { studentId_academicYearId: { studentId: student2.id, academicYearId: currentYear.id } },
    update: {},
    create: {
      studentId: student2.id,
      academicYearId: currentYear.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      rollNumber: 2,
      status: EnrolmentStatus.ACTIVE,
    },
  });

  await prisma.enrolment.upsert({
    where: { studentId_academicYearId: { studentId: student3.id, academicYearId: currentYear.id } },
    update: {},
    create: {
      studentId: student3.id,
      academicYearId: currentYear.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      rollNumber: 3,
      status: EnrolmentStatus.ACTIVE,
    },
  });

  // 7. Attendance Records
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  await prisma.attendanceRecord.upsert({
    where: {
      studentId_date_periodNumber: {
        studentId: student1.id,
        date: today,
        periodNumber: 0,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      date: today,
      periodNumber: 0,
      status: AttendanceStatus.PRESENT,
      recordedById: teacherStaff.id,
    },
  });

  await prisma.attendanceRecord.upsert({
    where: {
      studentId_date_periodNumber: {
        studentId: student2.id,
        date: today,
        periodNumber: 0,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      date: today,
      periodNumber: 0,
      status: AttendanceStatus.PRESENT,
      recordedById: teacherStaff.id,
    },
  });

  // 8. Fee Structure, Invoices & Payment
  const feeStructure = await prisma.feeStructure.upsert({
    where: {
      academicYearId_classId_name: {
        academicYearId: currentYear.id,
        classId: grade10.id,
        name: 'Grade 10 Annual Composite Fee 2026-27',
      },
    },
    update: {},
    create: {
      name: 'Grade 10 Annual Composite Fee 2026-27',
      academicYearId: currentYear.id,
      classId: grade10.id,
      totalAmount: 80000.0,
      components: {
        create: [
          { name: 'Tuition Fee (Term 1 & 2)', amount: 60000.0, isMandatory: true },
          { name: 'Computer & Science Labs', amount: 12000.0, isMandatory: true },
          { name: 'Sports & Co-Curricular', amount: 8000.0, isMandatory: true },
        ],
      },
    },
    include: { components: true },
  });

  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-00001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-00001',
      studentId: student1.id,
      academicYearId: currentYear.id,
      feeStructureId: feeStructure.id,
      title: 'Term 1 Tuition & Composite Fee',
      dueDate: new Date('2026-05-15'),
      subtotal: 80000.0,
      totalAmount: 80000.0,
      paidAmount: 40000.0,
      balance: 40000.0,
      status: InvoiceStatus.PARTIALLY_PAID,
      lines: {
        create: [
          { description: 'Tuition Fee (Term 1 & 2)', amount: 60000.0 },
          { description: 'Computer & Science Labs', amount: 12000.0 },
          { description: 'Sports & Co-Curricular', amount: 8000.0 },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: { receiptNumber: 'REC-2026-00001' },
    update: {},
    create: {
      receiptNumber: 'REC-2026-00001',
      invoiceId: invoice1.id,
      amount: 40000.0,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI/2026/04/99818812',
      notes: 'First installment paid online by Suresh Patel',
      collectedById: accountantStaff.id,
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-00003' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-00003',
      studentId: student3.id,
      academicYearId: currentYear.id,
      feeStructureId: feeStructure.id,
      title: 'Term 1 Tuition & Composite Fee',
      dueDate: new Date('2026-05-15'),
      subtotal: 80000.0,
      totalAmount: 80000.0,
      paidAmount: 0.0,
      balance: 80000.0,
      status: InvoiceStatus.UNPAID,
      lines: {
        create: [
          { description: 'Tuition Fee (Term 1 & 2)', amount: 60000.0 },
          { description: 'Computer & Science Labs', amount: 12000.0 },
          { description: 'Sports & Co-Curricular', amount: 8000.0 },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔐 DEMO LOGIN CREDENTIALS (All passwords: Password@123)');
  console.log('1. Super Admin: admin@school.erp');
  console.log('2. Principal:   principal@school.erp');
  console.log('3. Teacher:     teacher@school.erp');
  console.log('4. Accountant:  accountant@school.erp');
  console.log('5. Parent:      parent@school.erp');
  console.log('6. Student:     student@school.erp');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
