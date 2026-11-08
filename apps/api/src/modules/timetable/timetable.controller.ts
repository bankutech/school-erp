import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { CreateTimetableEntryInput, CreateSubstitutionInput } from '@school-erp/shared';

/**
 * Helper to check time overlapping clashes
 */
async function checkTimetableClashes(entry: CreateTimetableEntryInput) {
  const { academicYearId, sectionId, teacherId, classroomId, dayOfWeek, startTime, endTime } = entry;

  // 1. Check Section Clash
  const sectionConflict = await prisma.timetableEntry.findFirst({
    where: {
      academicYearId,
      sectionId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: {
      subject: true,
      teacher: true,
      section: { include: { class: true } },
    },
  });

  if (sectionConflict) {
    return {
      hasConflict: true,
      type: 'SECTION_CLASH',
      message: `Section ${sectionConflict.section.class.name}-${sectionConflict.section.name} already has ${sectionConflict.subject.name} with ${sectionConflict.teacher.firstName} ${sectionConflict.teacher.lastName} scheduled from ${sectionConflict.startTime} to ${sectionConflict.endTime}.`,
    };
  }

  // 2. Check Teacher Clash
  const teacherConflict = await prisma.timetableEntry.findFirst({
    where: {
      academicYearId,
      teacherId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: {
      subject: true,
      teacher: true,
      section: { include: { class: true } },
    },
  });

  if (teacherConflict) {
    return {
      hasConflict: true,
      type: 'TEACHER_CLASH',
      message: `Teacher ${teacherConflict.teacher.firstName} ${teacherConflict.teacher.lastName} is already assigned to ${teacherConflict.section.class.name}-${teacherConflict.section.name} (${teacherConflict.subject.name}) from ${teacherConflict.startTime} to ${teacherConflict.endTime}.`,
    };
  }

  // 3. Check Classroom Clash (if specified)
  if (classroomId) {
    const classroomConflict = await prisma.timetableEntry.findFirst({
      where: {
        academicYearId,
        classroomId,
        dayOfWeek,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        classroom: true,
        section: { include: { class: true } },
        subject: true,
      },
    });

    if (classroomConflict) {
      return {
        hasConflict: true,
        type: 'CLASSROOM_CLASH',
        message: `Classroom ${classroomConflict.classroom?.name || 'Selected room'} is already occupied by ${classroomConflict.section.class.name}-${classroomConflict.section.name} (${classroomConflict.subject.name}) from ${classroomConflict.startTime} to ${classroomConflict.endTime}.`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Get Timetable Entries
 * Supports filtering by sectionId, teacherId, academicYearId, dayOfWeek
 */
export async function getTimetableEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const { sectionId, teacherId, academicYearId, dayOfWeek } = req.query;

    const where: any = {};
    if (sectionId) where.sectionId = String(sectionId);
    if (teacherId) where.teacherId = String(teacherId);
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (dayOfWeek) where.dayOfWeek = parseInt(String(dayOfWeek), 10);

    const entries = await prisma.timetableEntry.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        section: {
          include: {
            class: true,
          },
        },
        classroom: true,
        substitutions: {
          include: {
            substituteTeacher: true,
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create a new Timetable Entry with Conflict Detection
 */
export async function createTimetableEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateTimetableEntryInput = req.body;

    if (input.startTime >= input.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
      });
    }

    // Clash detection
    const clash = await checkTimetableClashes(input);
    if (clash.hasConflict) {
      return res.status(409).json({
        success: false,
        conflictType: clash.type,
        message: clash.message,
      });
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        academicYearId: input.academicYearId,
        sectionId: input.sectionId,
        subjectId: input.subjectId,
        teacherId: input.teacherId,
        classroomId: input.classroomId || null,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      },
      include: {
        subject: true,
        teacher: true,
        section: { include: { class: true } },
        classroom: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Timetable entry scheduled successfully without conflicts.',
      data: entry,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Delete a Timetable Entry
 */
export async function deleteTimetableEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const existing = await prisma.timetableEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found.',
      });
    }

    await prisma.timetableEntry.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Timetable Substitution
 */
export async function createSubstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateSubstitutionInput = req.body;

    const entry = await prisma.timetableEntry.findUnique({
      where: { id: input.timetableEntryId },
      include: { teacher: true },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found.',
      });
    }

    if (entry.teacherId === input.substituteTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'Substitute teacher cannot be the same as the original teacher.',
      });
    }

    const [y, m, d] = String(input.date).split('-').map(Number);
    const subDate = new Date(Date.UTC(y, m - 1, d));

    const substitution = await prisma.timetableSubstitution.upsert({
      where: {
        timetableEntryId_date: {
          timetableEntryId: input.timetableEntryId,
          date: subDate,
        },
      },
      update: {
        substituteTeacherId: input.substituteTeacherId,
        reason: input.reason || null,
      },
      create: {
        timetableEntryId: input.timetableEntryId,
        originalTeacherId: entry.teacherId,
        substituteTeacherId: input.substituteTeacherId,
        date: subDate,
        reason: input.reason || null,
      },
      include: {
        substituteTeacher: true,
        timetableEntry: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Teacher substitution assigned successfully.',
      data: substitution,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Classrooms
 */
export async function getClassrooms(_req: Request, res: Response, next: NextFunction) {
  try {
    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: classrooms,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Classroom
 */
export async function createClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, capacity, type } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Classroom name is required.' });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        capacity: Number(capacity) || 40,
        type: type || 'REGULAR',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Classroom added successfully.',
      data: classroom,
    });
  } catch (error) {
    return next(error);
  }
}
