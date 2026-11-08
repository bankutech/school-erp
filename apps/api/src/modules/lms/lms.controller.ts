import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import {
  CreateAssignmentInput,
  SubmitAssignmentInput,
  GradeSubmissionInput,
  UserRoleType,
} from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get Assignments list scoped to caller's role
 */
export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { subjectId, classId } = req.query;

    const where: any = {};
    if (subjectId) where.subjectId = String(subjectId);
    if (classId) where.subject = { classId: String(classId) };

    // Scoping by role
    if (user.role === UserRoleType.TEACHER && user.staffId) {
      where.teacherId = user.staffId;
    } else if (user.role === UserRoleType.STUDENT && user.studentId) {
      // Find student's active enrolment class
      const enrolment = await prisma.enrolment.findFirst({
        where: { studentId: user.studentId, status: 'ACTIVE' },
      });
      if (enrolment) {
        where.subject = { classId: enrolment.classId };
      }
    } else if (user.role === UserRoleType.PARENT && user.guardianId) {
      // Find linked students
      const links = await prisma.studentGuardian.findMany({
        where: { guardianId: user.guardianId },
        include: { student: { include: { enrolments: { where: { status: 'ACTIVE' } } } } },
      });
      const classIds = links.flatMap((l) => l.student.enrolments.map((e) => e.classId));
      if (classIds.length > 0) {
        where.subject = { classId: { in: classIds } };
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        subject: {
          include: { class: true },
        },
        teacher: true,
        _count: {
          select: { submissions: true },
        },
        submissions: user.studentId
          ? {
              where: { studentId: user.studentId },
            }
          : false,
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create a new assignment (Teacher/Admin)
 */
export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateAssignmentInput = req.body;
    let teacherId = req.user?.staffId;

    if (!teacherId) {
      // If admin created, find a staff record or fallback
      const staff = await prisma.staff.findFirst({ where: { isActive: true } });
      if (!staff) {
        return res.status(400).json({ success: false, message: 'No staff available to assign as author.' });
      }
      teacherId = staff.id;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: input.title,
        description: input.description,
        subjectId: input.subjectId,
        teacherId,
        dueDate: new Date(input.dueDate),
        maxMarks: input.maxMarks ? new Decimal(input.maxMarks) : new Decimal(100),
        fileUrl: input.fileUrl || null,
      },
      include: {
        subject: { include: { class: true } },
        teacher: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment published successfully.',
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Assignment detail with submissions
 */
export async function getAssignmentDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const user = req.user!;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: { include: { class: true } },
        teacher: true,
        submissions: {
          include: {
            student: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Filter submissions if student
    let submissionsList = assignment.submissions;
    if (user.role === UserRoleType.STUDENT && user.studentId) {
      submissionsList = submissionsList.filter((s) => s.studentId === user.studentId);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...assignment,
        submissions: submissionsList,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Submit homework assignment (Student)
 */
export async function submitAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignmentId = String(req.params.id);
    const user = req.user!;
    const input: SubmitAssignmentInput = req.body;

    let studentId = user.studentId;
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments.',
      });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        content: input.content || null,
        fileUrl: input.fileUrl || null,
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId,
        content: input.content || null,
        fileUrl: input.fileUrl || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Homework submitted successfully.',
      data: submission,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Grade student submission (Teacher)
 */
export async function gradeSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const submissionId = String(req.params.id);
    const input: GradeSubmissionInput = req.body;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const maxMarks = submission.assignment.maxMarks ? Number(submission.assignment.maxMarks) : 100;
    if (input.marksGiven < 0 || input.marksGiven > maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Grade marks (${input.marksGiven}) must be between 0 and maximum marks (${maxMarks}).`,
      });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksGiven: new Decimal(input.marksGiven),
        feedback: input.feedback || null,
        gradedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}
