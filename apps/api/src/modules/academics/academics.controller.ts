import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { PERMISSIONS } from '@school-erp/shared';

// Academic Years
export async function getAcademicYears(_req: Request, res: Response, next: NextFunction) {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { enrolments: true } },
      },
    });
    return res.json({ success: true, data: years });
  } catch (error) {
    next(error);
  }
}

export async function createAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }

    const year = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: !!isCurrent,
      },
    });

    return res.status(201).json({ success: true, data: year });
  } catch (error) {
    next(error);
  }
}

// Classes & Sections
export async function getClasses(_req: Request, res: Response, next: NextFunction) {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { order: 'asc' },
      include: {
        sections: {
          include: {
            classTeacher: true,
            _count: { select: { enrolments: true } },
          },
        },
        subjects: true,
      },
    });
    return res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
}

export async function createClass(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, order } = req.body;
    const newClass = await prisma.class.create({
      data: { name, code, order: order || 1 },
    });
    return res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    next(error);
  }
}

export async function createSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, classId, roomNumber, capacity, classTeacherId } = req.body;
    const section = await prisma.section.create({
      data: {
        name,
        classId,
        roomNumber,
        capacity: capacity || 40,
        classTeacherId: classTeacherId || null,
      },
    });
    return res.status(201).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
}

// Subjects
export async function getSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query;
    const subjects = await prisma.subject.findMany({
      where: classId ? { classId: String(classId) } : undefined,
      include: { class: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, classId, isElective, creditHours } = req.body;
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        classId,
        isElective: !!isElective,
        creditHours: creditHours || 1.0,
      },
    });
    return res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
}

// Teacher Assignments
export async function getTeacherAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, sectionId, academicYearId } = req.query;
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        ...(teacherId && { teacherId: String(teacherId) }),
        ...(sectionId && { sectionId: String(sectionId) }),
        ...(academicYearId && { academicYearId: String(academicYearId) }),
      },
      include: {
        teacher: true,
        subject: true,
        section: { include: { class: true } },
        academicYear: true,
      },
    });
    return res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
}

export async function createTeacherAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, subjectId, sectionId, academicYearId } = req.body;
    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, subjectId, sectionId, academicYearId },
    });
    return res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}
