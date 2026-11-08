import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { EnrolmentStatus, CreateStudentInput, PromoteStudentInput } from '@school-erp/shared';

export async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, sectionId, academicYearId, search, status = 'ACTIVE', page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * take;

    const where: any = {
      deletedAt: null,
    };
    if (status) {
      where.isActive = status === 'ACTIVE';
    }

    if (classId || sectionId || academicYearId) {
      where.enrolments = {
        some: {
          ...(classId && { classId: String(classId) }),
          ...(sectionId && { sectionId: String(sectionId) }),
          ...(academicYearId && { academicYearId: String(academicYearId) }),
          status: 'ACTIVE',
        },
      };
    }

    if (search) {
      where.OR = [
        { admissionNumber: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
      ];
    }

    // Role-based scoping: Parents can ONLY view their linked children!
    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.json({ success: true, data: [], meta: { total: 0, page: pageNum, limit: take, totalPages: 0 } });
      }
      where.guardians = {
        some: { guardianId: req.user.guardianId },
      };
    }

    // Students can ONLY view their own record!
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.json({ success: true, data: [], meta: { total: 0, page: pageNum, limit: take, totalPages: 0 } });
      }
      where.id = req.user.studentId;
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          enrolments: {
            where: { status: 'ACTIVE' },
            include: { class: true, section: true, academicYear: true },
          },
          guardians: {
            include: { guardian: true },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: students,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    // Enforce data boundary
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId || req.user.studentId !== id) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access limited to own records.' });
      }
    }

    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.status(403).json({ success: false, message: 'Forbidden. No linked guardian account profile.' });
      }
      const isLinked = await prisma.studentGuardian.findFirst({
        where: { studentId: id, guardianId: req.user.guardianId },
      });
      if (!isLinked) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access limited to linked children.' });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        guardians: { include: { guardian: true } },
        enrolments: {
          include: { class: true, section: true, academicYear: true },
          orderBy: { enrolledAt: 'desc' },
        },
        attendance: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { payments: true },
        },
        marks: {
          include: { examination: true, examSubject: { include: { subject: true } } },
        },
        certificates: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateStudentInput = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Student
      const student = await tx.student.create({
        data: {
          admissionNumber: data.admissionNumber,
          firstName: data.firstName,
          middleName: data.middleName || null,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          bloodGroup: data.bloodGroup || null,
          emergencyContact: data.emergencyContact || null,
          medicalNotes: data.medicalNotes || null,
        },
      });

      // 2. Guardians
      for (const g of data.guardians) {
        let guardian = await tx.guardian.findFirst({ where: { phone: g.phone } });
        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              name: g.name,
              relation: g.relation,
              phone: g.phone,
              email: g.email || null,
              occupation: g.occupation || null,
              address: data.address || null,
            },
          });
        }
        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            isPrimary: g.isPrimary,
          },
        });
      }

      // 3. Active Enrolment
      const enrolment = await tx.enrolment.create({
        data: {
          studentId: student.id,
          academicYearId: data.academicYearId,
          classId: data.classId,
          sectionId: data.sectionId,
          status: EnrolmentStatus.ACTIVE,
        },
      });

      // 4. Audit
      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'STUDENT_MANUAL_REGISTRATION',
          entity: 'Student',
          entityId: student.id,
          metadata: { admissionNumber: student.admissionNumber, enrolmentId: enrolment.id },
        },
      });

      return { student, enrolment };
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function promoteStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentIds, targetAcademicYearId, targetClassId, targetSectionId }: PromoteStudentInput = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Mark current enrolments as PROMOTED
      await tx.enrolment.updateMany({
        where: {
          studentId: { in: studentIds },
          status: EnrolmentStatus.ACTIVE,
        },
        data: { status: EnrolmentStatus.PROMOTED },
      });

      // Create new enrolments for the target year
      const newEnrolments = [];
      for (const studentId of studentIds) {
        const enrolment = await tx.enrolment.create({
          data: {
            studentId,
            academicYearId: targetAcademicYearId,
            classId: targetClassId,
            sectionId: targetSectionId,
            status: EnrolmentStatus.ACTIVE,
          },
        });
        newEnrolments.push(enrolment);
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'STUDENTS_PROMOTED',
          entity: 'Enrolment',
          metadata: {
            count: studentIds.length,
            targetYear: targetAcademicYearId,
            targetClass: targetClassId,
          },
        },
      });

      return newEnrolments;
    });

    return res.json({
      success: true,
      message: `Successfully promoted ${result.length} students.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function issueCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { type, remarks } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const year = new Date().getFullYear();
    const count = await prisma.certificate.count();
    const prefix = type === 'TRANSFER_CERTIFICATE' ? 'TC' : 'BC';
    const certificateNo = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

    const cert = await prisma.certificate.create({
      data: {
        studentId: id,
        type: type || 'BONAFIDE',
        certificateNo,
        remarks: remarks || null,
        issuedBy: req.user ? `${req.user.email}` : 'Authorized School Authority',
      },
      include: { student: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: cert,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const student = await prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'STUDENT_ARCHIVED',
        entity: 'Student',
        entityId: id,
        metadata: { admissionNumber: student.admissionNumber },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} successfully archived.`,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContact,
      medicalNotes,
      isActive,
    } = req.body;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(middleName !== undefined && { middleName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender !== undefined && { gender }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(medicalNotes !== undefined && { medicalNotes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        enrolments: {
          include: {
            class: true,
            section: true,
          },
        },
        guardians: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'STUDENT_UPDATED',
        entity: 'Student',
        entityId: id,
        metadata: {
          admissionNumber: updated.admissionNumber,
          changes: req.body,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Student details updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
