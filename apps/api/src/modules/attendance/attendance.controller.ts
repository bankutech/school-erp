import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { BulkAttendanceInput, AttendanceCorrectionInput, AttendanceStatus } from '@school-erp/shared';

export async function getAttendanceRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, sectionId, date, periodNumber, academicYearId } = req.query;

    if (!classId || !sectionId || !date) {
      return res.status(400).json({
        success: false,
        message: 'classId, sectionId, and date query parameters are required.',
      });
    }

    const [y, m, d] = String(date).split('-').map(Number);
    const queryDate = new Date(Date.UTC(y, m - 1, d));

    // 1. Get all active enrolments for this class and section
    const enrolments = await prisma.enrolment.findMany({
      where: {
        classId: String(classId),
        sectionId: String(sectionId),
        status: 'ACTIVE',
        ...(academicYearId ? { academicYearId: String(academicYearId) } : {}),
      },
      include: {
        student: true,
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    const period = parseInt(String(periodNumber || '0'), 10);

    // 2. Get existing attendance for this date and period
    const existing = await prisma.attendanceRecord.findMany({
      where: {
        classId: String(classId),
        sectionId: String(sectionId),
        date: queryDate,
        periodNumber: period,
      },
    });

    const attendanceMap = new Map(existing.map((r) => [r.studentId, r]));

    // 3. Assemble roster with current status or default PRESENT
    const roster = enrolments.map((e) => {
      const record = attendanceMap.get(e.studentId);
      return {
        studentId: e.studentId,
        enrolmentId: e.id,
        rollNumber: e.rollNumber,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        gender: e.student.gender,
        attendanceId: record?.id || null,
        status: record?.status || AttendanceStatus.PRESENT,
        remarks: record?.remarks || '',
      };
    });

    return res.json({
      success: true,
      data: {
        date: String(date),
        periodNumber: periodNumber ? parseInt(String(periodNumber), 10) : null,
        classId,
        sectionId,
        totalStudents: enrolments.length,
        markedCount: existing.length,
        isMarked: existing.length > 0,
        roster,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markBulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data: BulkAttendanceInput = req.body;
    const targetDate = new Date(data.date);
    const period = data.periodNumber || 0;

    // Teacher authorization check: If user is teacher, verify they are assigned or class teacher
    if (req.user?.role === 'TEACHER') {
      if (!req.user.staffId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. No staff record linked to your teacher user account.',
        });
      }
      const isClassTeacher = await prisma.section.findFirst({
        where: { id: data.sectionId, classTeacherId: req.user.staffId },
      });
      const isAssigned = await prisma.teacherAssignment.findFirst({
        where: { sectionId: data.sectionId, teacherId: req.user.staffId },
      });

      if (!isClassTeacher && !isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to mark attendance for this section.',
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const saved = [];

      for (const item of data.records) {
        const record = await tx.attendanceRecord.upsert({
          where: {
            studentId_date_periodNumber: {
              studentId: item.studentId,
              date: targetDate,
              periodNumber: period as any,
            },
          },
          update: {
            status: item.status,
            remarks: item.remarks || null,
            recordedById: req.user?.staffId || null,
          },
          create: {
            studentId: item.studentId,
            classId: data.classId,
            sectionId: data.sectionId,
            date: targetDate,
            periodNumber: period,
            status: item.status,
            remarks: item.remarks || null,
            recordedById: req.user?.staffId || null,
          },
        });
        saved.push(record);
      }

      // Automated Parental Absence Alert Trigger
      const absentStudentIds = data.records
        .filter((r) => r.status === AttendanceStatus.ABSENT)
        .map((r) => r.studentId);

      if (absentStudentIds.length > 0) {
        const studentGuardians = await tx.studentGuardian.findMany({
          where: { studentId: { in: absentStudentIds } },
          include: {
            student: true,
            guardian: {
              include: { user: true },
            },
          },
        });

        for (const sg of studentGuardians) {
          if (sg.guardian.user) {
            const studentName = `${sg.student.firstName} ${sg.student.lastName}`;
            const periodLabel = period === 0 ? 'Daily Homeroom' : `Period ${period}`;
            await tx.notification.create({
              data: {
                userId: sg.guardian.user.id,
                title: 'Attendance Alert: Absence Recorded',
                message: `${studentName} was marked ABSENT for ${periodLabel} on ${data.date}. If this was unexpected, please contact the school administration.`,
                type: 'ALERT',
                link: '/attendance',
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'ATTENDANCE_MARKED',
          entity: 'AttendanceRecord',
          metadata: {
            date: data.date,
            classId: data.classId,
            sectionId: data.sectionId,
            count: data.records.length,
          },
        },
      });

      return saved;
    });

    return res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${result.length} students.`,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function correctAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { attendanceId, status, reason }: AttendanceCorrectionInput = req.body;

    const existing = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { student: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const previousStatus = existing.status;

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.attendanceRecord.update({
        where: { id: attendanceId },
        data: {
          status,
          remarks: `Corrected: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'ATTENDANCE_CORRECTED',
          entity: 'AttendanceRecord',
          entityId: attendanceId,
          metadata: {
            studentId: existing.studentId,
            admissionNumber: existing.student.admissionNumber,
            date: existing.date,
            from: previousStatus,
            to: status,
            reason,
          },
        },
      });

      return record;
    });

    return res.json({
      success: true,
      message: 'Attendance record corrected successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentAttendanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = String(req.params.studentId);

    // Access check for Parent / Student
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;

    // Documented calculation rule: (Present + Late + 0.5 * HalfDay) / Total * 100
    const effectivePresent = present + late + halfDay * 0.5;
    const percentage = total > 0 ? ((effectivePresent / total) * 100).toFixed(2) : '100.00';

    return res.json({
      success: true,
      data: {
        totalDays: total,
        present,
        absent,
        late,
        excused,
        halfDay,
        percentage: parseFloat(percentage),
        records: records.slice(0, 50),
      },
    });
  } catch (error) {
    next(error);
  }
}
