import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import {
  CreateExaminationInput,
  RecordMarksInput,
  ExamStatus,
} from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Determine letter grade from percentage using CBSE 9-point scale or default bands
 */
async function getGradeForPercentage(percentage: number): Promise<string> {
  const scheme = await prisma.gradingScheme.findFirst({
    where: { isDefault: true },
    include: { bands: { orderBy: { minPercentage: 'desc' } } },
  });

  if (scheme && scheme.bands.length > 0) {
    for (const band of scheme.bands) {
      if (percentage >= Number(band.minPercentage) && percentage <= Number(band.maxPercentage)) {
        return band.grade;
      }
    }
  }

  // Standard fallback
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

/**
 * Get all examinations
 */
export async function getExaminations(req: Request, res: Response, next: NextFunction) {
  try {
    const { academicYearId, status } = req.query;

    const where: any = {};
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (status) where.status = String(status);

    const exams = await prisma.examination.findMany({
      where,
      include: {
        academicYear: true,
        term: true,
        subjects: {
          include: {
            subject: {
              include: { class: true },
            },
          },
          orderBy: { examDate: 'asc' },
        },
        _count: {
          select: { marks: true, reportCards: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create a new Examination with subjects
 */
export async function createExamination(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateExaminationInput = req.body;

    const exam = await prisma.examination.create({
      data: {
        name: input.name,
        academicYearId: input.academicYearId,
        termId: input.termId || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: ExamStatus.SCHEDULED,
        subjects: {
          create: input.subjects.map((s) => ({
            subjectId: s.subjectId,
            examDate: new Date(s.examDate),
            maxMarks: new Decimal(s.maxMarks || 100),
            passingMarks: new Decimal(s.passingMarks || 35),
          })),
        },
      },
      include: {
        subjects: {
          include: { subject: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Examination scheduled successfully.',
      data: exam,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Update Examination Status
 */
export async function updateExamStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!Object.values(ExamStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid examination status.',
      });
    }

    const updated = await prisma.examination.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: `Exam status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Marks Roster for a specific exam and subject
 */
export async function getSubjectMarksRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const examinationId = String(req.params.id);
    const subjectId = String(req.params.subjectId);
    const { sectionId } = req.query;

    const examSubject = await prisma.examinationSubject.findUnique({
      where: {
        examinationId_subjectId: {
          examinationId,
          subjectId,
        },
      },
      include: {
        subject: { include: { class: true } },
        examination: true,
      },
    });

    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not part of this examination.',
      });
    }

    // Get active enrolments
    const enrolmentWhere: any = {
      classId: examSubject.subject.classId,
      status: 'ACTIVE',
    };
    if (sectionId) {
      enrolmentWhere.sectionId = String(sectionId);
    }

    const enrolments = await prisma.enrolment.findMany({
      where: enrolmentWhere,
      include: {
        student: true,
        section: true,
      },
      orderBy: [
        { section: { name: 'asc' } },
        { rollNumber: 'asc' },
        { student: { lastName: 'asc' } },
      ],
    });

    // Get existing marks
    const existingMarks = await prisma.studentMark.findMany({
      where: {
        examinationId,
        examSubjectId: examSubject.id,
      },
    });

    const marksMap = new Map(existingMarks.map((m) => [m.studentId, m]));

    const roster = enrolments.map((enr) => {
      const mark = marksMap.get(enr.studentId);
      return {
        studentId: enr.studentId,
        enrolmentId: enr.id,
        rollNumber: enr.rollNumber,
        admissionNumber: enr.student.admissionNumber,
        firstName: enr.student.firstName,
        lastName: enr.student.lastName,
        sectionName: enr.section.name,
        marksObtained: mark ? Number(mark.marksObtained) : null,
        grade: mark?.grade || null,
        remarks: mark?.remarks || '',
        isFinal: mark?.isFinal || false,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        examSubject: {
          id: examSubject.id,
          subjectName: examSubject.subject.name,
          subjectCode: examSubject.subject.code,
          className: examSubject.subject.class.name,
          maxMarks: Number(examSubject.maxMarks),
          passingMarks: Number(examSubject.passingMarks),
          examDate: examSubject.examDate,
        },
        roster,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Record Marks (Teacher/Admin)
 */
export async function recordMarks(req: Request, res: Response, next: NextFunction) {
  try {
    const input: RecordMarksInput = req.body;
    const staffId = req.user?.staffId || null;

    const examSubject = await prisma.examinationSubject.findUnique({
      where: {
        examinationId_subjectId: {
          examinationId: input.examinationId,
          subjectId: input.subjectId,
        },
      },
      include: {
        examination: true,
      },
    });

    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: 'Exam subject record not found.',
      });
    }

    if (examSubject.examination.status === ExamStatus.RESULTS_PUBLISHED) {
      return res.status(403).json({
        success: false,
        error: 'EXAMINATION_LOCKED',
        message: 'Official results have already been published for this examination. Marks are locked against further modification.',
      });
    }

    const maxMarks = Number(examSubject.maxMarks);

    // Validate marks values
    for (const item of input.marks) {
      if (item.marksObtained < 0 || item.marksObtained > maxMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks obtained (${item.marksObtained}) must be between 0 and maximum marks (${maxMarks}).`,
        });
      }
    }

    // Process marks atomically in transaction
    const savedMarks = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of input.marks) {
        const enrolment = await tx.enrolment.findFirst({
          where: { studentId: item.studentId, status: 'ACTIVE' },
        });

        if (!enrolment) continue;

        const percentage = (item.marksObtained / maxMarks) * 100;
        const grade = await getGradeForPercentage(percentage);

        const record = await tx.studentMark.upsert({
          where: {
            enrolmentId_examinationId_examSubjectId: {
              enrolmentId: enrolment.id,
              examinationId: input.examinationId,
              examSubjectId: examSubject.id,
            },
          },
          update: {
            marksObtained: new Decimal(item.marksObtained),
            grade,
            remarks: item.remarks || null,
            isFinal: input.isFinalSubmission,
            enteredById: staffId,
          },
          create: {
            examinationId: input.examinationId,
            examSubjectId: examSubject.id,
            studentId: item.studentId,
            enrolmentId: enrolment.id,
            marksObtained: new Decimal(item.marksObtained),
            grade,
            remarks: item.remarks || null,
            isFinal: input.isFinalSubmission,
            enteredById: staffId,
          },
        });

        results.push(record);
      }

      return results;
    });

    return res.status(200).json({
      success: true,
      message: `Successfully recorded marks for ${savedMarks.length} students.`,
      count: savedMarks.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Publish Exam Results & Generate Automated Report Cards
 */
export async function publishExamResults(req: Request, res: Response, next: NextFunction) {
  try {
    const examinationId = String(req.params.id);

    const exam = await prisma.examination.findUnique({
      where: { id: examinationId },
      include: {
        subjects: true,
      },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    // Compute total max marks for the exam
    let totalMaxMarks = 0;
    for (const sub of exam.subjects) {
      totalMaxMarks += Number(sub.maxMarks);
    }

    // Fetch all marks for this exam grouped by enrolment
    const allMarks = await prisma.studentMark.findMany({
      where: { examinationId },
      include: {
        enrolment: {
          include: {
            section: true,
          },
        },
      },
    });

    // Group marks by enrolment
    const enrolmentMarksMap = new Map<string, typeof allMarks>();
    for (const mark of allMarks) {
      const list = enrolmentMarksMap.get(mark.enrolmentId) || [];
      list.push(mark);
      enrolmentMarksMap.set(mark.enrolmentId, list);
    }

    // Calculate aggregated results for each enrolment
    interface StudentSummary {
      enrolmentId: string;
      totalMarks: number;
      percentage: number;
      grade: string;
      sectionId: string;
    }

    const summaries: StudentSummary[] = [];

    for (const [enrolmentId, marks] of enrolmentMarksMap.entries()) {
      let totalObtained = 0;
      for (const m of marks) {
        totalObtained += Number(m.marksObtained);
      }
      const percentage = totalMaxMarks > 0 ? (totalObtained / totalMaxMarks) * 100 : 0;
      const grade = await getGradeForPercentage(percentage);

      summaries.push({
        enrolmentId,
        totalMarks: totalObtained,
        percentage,
        grade,
        sectionId: marks[0]?.enrolment?.sectionId || '',
      });
    }

    // Group by section for ranking
    const sectionGroups = new Map<string, StudentSummary[]>();
    for (const s of summaries) {
      const list = sectionGroups.get(s.sectionId) || [];
      list.push(s);
      sectionGroups.set(s.sectionId, list);
    }

    // Assign ranks per section
    const rankedSummaries: (StudentSummary & { rank: number })[] = [];
    for (const group of sectionGroups.values()) {
      group.sort((a, b) => b.totalMarks - a.totalMarks);
      group.forEach((s, idx) => {
        rankedSummaries.push({ ...s, rank: idx + 1 });
      });
    }

    // Atomically upsert ReportCards & update exam status
    await prisma.$transaction(async (tx) => {
      for (const s of rankedSummaries) {
        await tx.reportCard.upsert({
          where: {
            examinationId_enrolmentId: {
              examinationId,
              enrolmentId: s.enrolmentId,
            },
          },
          update: {
            totalMarks: new Decimal(s.totalMarks),
            maxMarksTotal: new Decimal(totalMaxMarks),
            percentage: new Decimal(s.percentage),
            overallGrade: s.grade,
            rank: s.rank,
            generatedAt: new Date(),
          },
          create: {
            examinationId,
            enrolmentId: s.enrolmentId,
            totalMarks: new Decimal(s.totalMarks),
            maxMarksTotal: new Decimal(totalMaxMarks),
            percentage: new Decimal(s.percentage),
            overallGrade: s.grade,
            rank: s.rank,
          },
        });
      }

      await tx.examination.update({
        where: { id: examinationId },
        data: { status: ExamStatus.RESULTS_PUBLISHED },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Exam results published and ${rankedSummaries.length} report cards generated successfully.`,
      reportCardsGenerated: rankedSummaries.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Report Cards list or student specific card
 */
export async function getReportCards(req: Request, res: Response, next: NextFunction) {
  try {
    const examinationId = String(req.params.id);
    const { studentId, sectionId } = req.query;

    const where: any = { examinationId };
    if (studentId) {
      where.enrolment = { studentId: String(studentId) };
    }
    if (sectionId) {
      where.enrolment = { ...where.enrolment, sectionId: String(sectionId) };
    }

    // Role-based data isolation for report cards
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where.enrolment = { ...where.enrolment, studentId: req.user.studentId };
    }

    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where.enrolment = {
        ...where.enrolment,
        student: { guardians: { some: { guardianId: req.user.guardianId } } },
      };
    }

    const cards = await prisma.reportCard.findMany({
      where,
      include: {
        enrolment: {
          include: {
            student: true,
            class: true,
            section: true,
          },
        },
        examination: {
          include: {
            academicYear: true,
            term: true,
          },
        },
      },
      orderBy: [
        { rank: 'asc' },
        { totalMarks: 'desc' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get detailed printable report card for a student
 */
export async function getStudentReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const examinationId = String(req.params.id);
    const studentId = String(req.params.studentId);

    // Enforce data boundary
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId || req.user.studentId !== studentId) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to own report card.' });
      }
    }

    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.status(403).json({ success: false, message: 'Forbidden. No linked guardian account profile.' });
      }
      const isLinked = await prisma.studentGuardian.findFirst({
        where: { studentId, guardianId: req.user.guardianId },
      });
      if (!isLinked) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to linked children.' });
      }
    }

    const card = await prisma.reportCard.findFirst({
      where: {
        examinationId,
        enrolment: { studentId },
      },
      include: {
        examination: {
          include: {
            academicYear: true,
            term: true,
          },
        },
        enrolment: {
          include: {
            student: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Report card not found or results not published yet.',
      });
    }

    // Get subject wise marks
    const marks = await prisma.studentMark.findMany({
      where: {
        examinationId,
        studentId,
      },
      include: {
        examSubject: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        examSubject: { subject: { name: 'asc' } },
      },
    });

    // Get school info
    const school = await prisma.schoolSettings.findFirst();

    return res.status(200).json({
      success: true,
      data: {
        school,
        card,
        marks: marks.map((m) => ({
          subjectName: m.examSubject.subject.name,
          subjectCode: m.examSubject.subject.code,
          maxMarks: Number(m.examSubject.maxMarks),
          passingMarks: Number(m.examSubject.passingMarks),
          marksObtained: Number(m.marksObtained),
          grade: m.grade,
          remarks: m.remarks,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}
