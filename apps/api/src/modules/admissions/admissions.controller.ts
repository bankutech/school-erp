import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { Prisma } from '@prisma/client';
import { AdmissionStatus, EnrolmentStatus, CreateAdmissionApplicationInput, ReviewAdmissionInput } from '@school-erp/shared';

export async function getApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, classId, academicYearId, search, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) where.status = String(status);
    if (classId) where.classId = String(classId);
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (search) {
      where.OR = [
        { applicationNo: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { guardianName: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
      ];
    }

    const [total, applications] = await Promise.all([
      prisma.admissionApplication.count({ where }),
      prisma.admissionApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          class: true,
          academicYear: true,
          allocatedSection: true,
          student: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: applications,
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

export async function createApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateAdmissionApplicationInput = req.body;

    // Generate unique application number e.g. APP-2026-0001
    const year = new Date().getFullYear();
    const count = await prisma.admissionApplication.count();
    const applicationNo = `APP-${year}-${String(count + 1).padStart(4, '0')}`;

    const application = await prisma.admissionApplication.create({
      data: {
        applicationNo,
        academicYearId: data.academicYearId,
        classId: data.classId,
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        bloodGroup: data.bloodGroup || null,
        previousSchool: data.previousSchool || null,
        guardianName: data.guardianName,
        guardianRelation: data.guardianRelation,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null,
        guardianOccupation: data.guardianOccupation || null,
        status: AdmissionStatus.SUBMITTED,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Admission application submitted successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status, reviewNotes, sectionId }: ReviewAdmissionInput = req.body;

    const application = await prisma.admissionApplication.findUnique({
      where: { id },
      include: { class: true, academicYear: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // If enrolling, execute atomic transaction
    if (status === AdmissionStatus.ENROLLED) {
      if (!sectionId && !application.allocatedSectionId) {
        return res.status(400).json({
          success: false,
          message: 'An allocated section is required to enrol a student.',
        });
      }

      const targetSectionId = sectionId || application.allocatedSectionId!;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Generate unique admission number
        const year = new Date().getFullYear();
        const studentCount = await tx.student.count();
        const admissionNumber = `ADM-${year}-${String(studentCount + 1).padStart(4, '0')}`;

        // 2. Create Student
        const student = await tx.student.create({
          data: {
            admissionNumber,
            firstName: application.firstName,
            middleName: application.middleName,
            lastName: application.lastName,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
            email: application.email,
            phone: application.phone,
            address: application.address,
            bloodGroup: application.bloodGroup,
          },
        });

        // 3. Create or link Guardian
        let guardian = await tx.guardian.findFirst({
          where: { phone: application.guardianPhone },
        });

        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              name: application.guardianName,
              relation: application.guardianRelation,
              phone: application.guardianPhone,
              email: application.guardianEmail,
              occupation: application.guardianOccupation,
              address: application.address,
            },
          });
        }

        // Link student to guardian
        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            isPrimary: true,
          },
        });

        // 4. Create active enrolment
        const enrolment = await tx.enrolment.create({
          data: {
            studentId: student.id,
            academicYearId: application.academicYearId,
            classId: application.classId,
            sectionId: targetSectionId,
            status: EnrolmentStatus.ACTIVE,
          },
        });

        // 5. Atomically link initial fee ledger invoice if a fee structure exists
        const defaultFeeStructure = await tx.feeStructure.findFirst({
          where: { classId: application.classId, academicYearId: application.academicYearId },
          include: { components: true },
        });

        if (defaultFeeStructure) {
          const invCount = await tx.invoice.count();
          const invoiceNumber = `INV-${year}-${String(invCount + 1).padStart(5, '0')}`;
          await tx.invoice.create({
            data: {
              invoiceNumber,
              studentId: student.id,
              academicYearId: application.academicYearId,
              feeStructureId: defaultFeeStructure.id,
              title: `${application.class.name} Initial Enrolment Fee`,
              dueDate: new Date(Date.now() + 30 * 86400000),
              subtotal: defaultFeeStructure.totalAmount,
              totalAmount: defaultFeeStructure.totalAmount,
              balance: defaultFeeStructure.totalAmount,
              paidAmount: new Prisma.Decimal(0.0),
              status: 'UNPAID',
              lines: {
                create: defaultFeeStructure.components.map((c) => ({
                  description: c.name,
                  amount: c.amount,
                })),
              },
            },
          });
        }

        // 6. Update admission application
        const updatedApp = await tx.admissionApplication.update({
          where: { id: application.id },
          data: {
            status: AdmissionStatus.ENROLLED,
            reviewNotes: reviewNotes || application.reviewNotes,
            allocatedSectionId: targetSectionId,
            studentId: student.id,
          },
        });

        // 6. Audit log
        await tx.auditLog.create({
          data: {
            userId: req.user?.id,
            action: 'STUDENT_ENROLLED_FROM_ADMISSION',
            entity: 'Student',
            entityId: student.id,
            metadata: {
              admissionNo: student.admissionNumber,
              applicationNo: application.applicationNo,
              enrolmentId: enrolment.id,
            },
          },
        });

        return { student, enrolment, application: updatedApp };
      });

      return res.status(200).json({
        success: true,
        message: 'Applicant successfully enrolled as a student.',
        data: result,
      });
    }

    // Normal status update (UNDER_REVIEW, APPROVED, REJECTED)
    const updated = await prisma.admissionApplication.update({
      where: { id },
      data: {
        status,
        reviewNotes: reviewNotes !== undefined ? reviewNotes : application.reviewNotes,
        ...(sectionId && { allocatedSectionId: sectionId }),
      },
      include: { class: true, allocatedSection: true },
    });

    return res.status(200).json({
      success: true,
      message: `Application updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
