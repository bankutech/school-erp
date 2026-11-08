import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import {
  CreateStaffInput,
  CreateLeaveRequestInput,
  ReviewLeaveRequestInput,
  MarkStaffAttendanceInput,
  GeneratePayslipInput,
  UserRoleType,
} from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get Staff Directory
 */
export async function getStaffList(req: Request, res: Response, next: NextFunction) {
  try {
    const { department, search, isActive } = req.query;

    const where: any = {};
    if (department) where.department = String(department);
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { employeeNumber: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where,
      include: {
        user: { select: { id: true, role: true, email: true } },
        _count: {
          select: { leaves: true, payslips: true },
        },
      },
      orderBy: { employeeNumber: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: staffList,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Staff Member
 */
export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateStaffInput = req.body;

    const existing = await prisma.staff.findFirst({
      where: {
        OR: [
          { employeeNumber: input.employeeNumber },
          { email: input.email },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A staff member with this Employee Number or Email already exists.',
      });
    }

    const staff = await prisma.staff.create({
      data: {
        employeeNumber: input.employeeNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        designation: input.designation,
        department: input.department,
        joiningDate: new Date(input.joiningDate),
        qualification: input.qualification || null,
        basicSalary: new Decimal(input.basicSalary || 0),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Staff member onboarded successfully.',
      data: staff,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Staff Detail with HR summary
 */
export async function getStaffDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        leaves: { orderBy: { createdAt: 'desc' }, take: 10 },
        payslips: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
        teacherAssignments: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Leaves (Role Scoped)
 */
export async function getLeaves(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { status, staffId } = req.query;

    const where: any = {};
    if (status) where.status = String(status);

    if (
      user.role === UserRoleType.TEACHER ||
      (user.staffId && user.role !== UserRoleType.SUPER_ADMIN && user.role !== UserRoleType.PRINCIPAL && user.role !== UserRoleType.HR_MANAGER)
    ) {
      where.staffId = user.staffId;
    } else if (staffId) {
      where.staffId = String(staffId);
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Request Leave (Staff)
 */
export async function requestLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const input: CreateLeaveRequestInput = req.body;

    let staffId = user.staffId;
    if (!staffId) {
      // Find staff by email if not directly linked
      const staff = await prisma.staff.findUnique({ where: { email: user.email } });
      if (!staff) {
        return res.status(403).json({ success: false, message: 'Only staff members can apply for leave.' });
      }
      staffId = staff.id;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        staffId,
        leaveType: input.leaveType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        status: 'PENDING',
      },
      include: {
        staff: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted for approval.',
      data: leave,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Review Leave (Approve/Reject)
 */
export async function reviewLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const input: ReviewLeaveRequestInput = req.body;
    const reviewerName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user!.email;

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.status,
        approvedBy: reviewerName,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Leave request has been ${input.status.toLowerCase()}.`,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Mark Staff Attendance
 */
export async function markStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const input: MarkStaffAttendanceInput = req.body;
    const [y, m, d] = String(input.date).split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const record = await prisma.staffAttendance.upsert({
      where: {
        staffId_date: {
          staffId: input.staffId,
          date: dateObj,
        },
      },
      update: {
        status: input.status,
        checkIn: input.checkIn || null,
        checkOut: input.checkOut || null,
      },
      create: {
        staffId: input.staffId,
        date: dateObj,
        status: input.status,
        checkIn: input.checkIn || null,
        checkOut: input.checkOut || null,
      },
      include: {
        staff: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Staff attendance recorded.',
      data: record,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Staff Attendance for a specific date
 */
export async function getStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date query parameter is required.' });
    }

    const [y, m, d] = String(date).split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const records = await prisma.staffAttendance.findMany({
      where: { date: dateObj },
      include: { staff: true },
    });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Generate Payslip
 */
export async function generatePayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const input: GeneratePayslipInput = req.body;

    if (input.basicSalary < 0 || (input.allowances && input.allowances < 0) || (input.deductions && input.deductions < 0)) {
      return res.status(400).json({ success: false, message: 'Salary components cannot be negative.' });
    }

    const net = Number(input.basicSalary) + Number(input.allowances || 0) - Number(input.deductions || 0);

    const payslip = await prisma.payslip.upsert({
      where: {
        staffId_month_year: {
          staffId: input.staffId,
          month: input.month,
          year: input.year,
        },
      },
      update: {
        basicSalary: new Decimal(input.basicSalary),
        allowances: new Decimal(input.allowances || 0),
        deductions: new Decimal(input.deductions || 0),
        netSalary: new Decimal(net),
        status: 'GENERATED',
      },
      create: {
        staffId: input.staffId,
        month: input.month,
        year: input.year,
        basicSalary: new Decimal(input.basicSalary),
        allowances: new Decimal(input.allowances || 0),
        deductions: new Decimal(input.deductions || 0),
        netSalary: new Decimal(net),
        status: 'GENERATED',
      },
      include: {
        staff: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Payslip generated successfully.',
      data: payslip,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Payslips
 */
export async function getPayslips(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year, staffId } = req.query;

    const where: any = {};
    if (month) where.month = parseInt(String(month), 10);
    if (year) where.year = parseInt(String(year), 10);
    if (staffId) where.staffId = String(staffId);

    // Staff/Teacher scoping: Non-HR/Admin roles can only view their own payslips
    if (req.user?.role === 'TEACHER' || req.user?.role === 'LIBRARIAN' || req.user?.role === 'TRANSPORT_MANAGER') {
      if (!req.user.staffId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where.staffId = req.user.staffId;
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        staff: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Mark Payslip Paid
 */
export async function markPayslipPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const payslip = await prisma.payslip.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Payslip marked as PAID and disbursed.',
      data: payslip,
    });
  } catch (error) {
    return next(error);
  }
}
