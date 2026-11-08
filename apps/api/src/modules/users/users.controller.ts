import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../services/prisma.js';
import { logAuditEvent } from '../../services/audit.js';
import { UserRoleType } from '@prisma/client';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim() || '';
    const role = req.query.role as UserRoleType | undefined;
    const isActiveParam = req.query.isActive as string | undefined;

    const where: any = {};

    if (role && Object.values(UserRoleType).includes(role)) {
      where.role = role;
    }

    if (isActiveParam !== undefined && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users, roleCounts] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          staffId: true,
          studentId: true,
          guardianId: true,
          staff: {
            select: {
              id: true,
              employeeNumber: true,
              designation: true,
              department: true,
            },
          },
          student: {
            select: {
              id: true,
              admissionNumber: true,
              enrolments: {
                where: { status: 'ACTIVE' },
                select: {
                  class: { select: { name: true } },
                  section: { select: { name: true } },
                },
                take: 1,
              },
            },
          },
          guardian: {
            select: {
              id: true,
              relation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    const formattedRoleCounts = Object.fromEntries(
      roleCounts.map((r) => [r.role, r._count.id])
    );

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        roleCounts: formattedRoleCounts,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone, role, staffId, studentId, guardianId } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'email, password, firstName, lastName, and role are required fields.',
      });
    }

    if (!Object.values(UserRoleType).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid role. Allowed values: ${Object.values(UserRoleType).join(', ')}`,
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A user account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        role,
        isActive: true,
        staffId: staffId || null,
        studentId: studentId || null,
        guardianId: guardianId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const targetId = String(id);

    if (req.user?.id === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Forbidden Operation',
        message: 'Administrators cannot deactivate their own active account.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: !existingUser.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // If deactivated, revoke all active sessions
    if (!updated.isActive) {
      await prisma.session.deleteMany({
        where: { userId: targetId },
      });
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: updated.isActive ? 'USER_ACTIVATE' : 'USER_SUSPEND',
      entity: 'User',
      entityId: updated.id,
      metadata: { previousStatus: existingUser.isActive, newStatus: updated.isActive },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User account ${updated.isActive ? 'activated' : 'suspended'} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const targetId = String(id);

    if (req.user?.id === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Forbidden Operation',
        message: 'You cannot change your own administrative role.',
      });
    }

    if (!role || !Object.values(UserRoleType).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid role. Allowed values: ${Object.values(UserRoleType).join(', ')}`,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_ROLE_CHANGE',
      entity: 'User',
      entityId: updated.id,
      metadata: { previousRole: existingUser.role, newRole: role },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const targetId = String(id);

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'New password must be at least 6 characters in length.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetId },
      data: { passwordHash },
    });

    // Invalidate existing sessions so user must log in with new password
    await prisma.session.deleteMany({
      where: { userId: targetId },
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_PASSWORD_RESET',
      entity: 'User',
      entityId: targetId,
      metadata: { targetEmail: user.email },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Active sessions terminated.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const targetId = String(id);

    if (req.user?.id === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Forbidden Operation',
        message: 'You cannot delete your own user account.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found.',
      });
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: targetId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: targetId } }),
      prisma.notification.deleteMany({ where: { userId: targetId } }),
      prisma.user.delete({ where: { id: targetId } }),
    ]);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_DELETE',
      entity: 'User',
      entityId: targetId,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
