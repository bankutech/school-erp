import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import {
  CreateNoticeInput,
  SendMessageInput,
  NoticeTarget,
  UserRoleType,
} from '@school-erp/shared';

/**
 * Get Notices with role/class audience filtering
 */
export async function getNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const now = new Date();

    const allowedAudiences: NoticeTarget[] = [NoticeTarget.ALL];

    if (
      user.role === UserRoleType.SUPER_ADMIN ||
      user.role === UserRoleType.PRINCIPAL ||
      user.role === UserRoleType.ADMINISTRATOR
    ) {
      // Admins see all notices
      allowedAudiences.push(
        NoticeTarget.STAFF,
        NoticeTarget.TEACHERS,
        NoticeTarget.STUDENTS,
        NoticeTarget.PARENTS,
        NoticeTarget.CLASS
      );
    } else if (user.role === UserRoleType.TEACHER) {
      allowedAudiences.push(NoticeTarget.STAFF, NoticeTarget.TEACHERS);
    } else if (
      user.role === UserRoleType.ACCOUNTANT ||
      user.role === UserRoleType.HR_MANAGER ||
      user.role === UserRoleType.LIBRARIAN ||
      user.role === UserRoleType.TRANSPORT_MANAGER
    ) {
      allowedAudiences.push(NoticeTarget.STAFF);
    } else if (user.role === UserRoleType.PARENT) {
      allowedAudiences.push(NoticeTarget.PARENTS);
    } else if (user.role === UserRoleType.STUDENT) {
      allowedAudiences.push(NoticeTarget.STUDENTS);
    }

    const where: any = {
      targetAudience: { in: allowedAudiences },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    };

    const notices = await prisma.notice.findMany({
      where,
      include: {
        publishedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create a new Notice
 */
export async function createNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateNoticeInput = req.body;
    const userId = req.user!.id;

    const notice = await prisma.notice.create({
      data: {
        title: input.title,
        content: input.content,
        targetAudience: input.targetAudience,
        targetClassId: input.targetClassId || null,
        targetSectionId: input.targetSectionId || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        publishedById: userId,
      },
      include: {
        publishedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Notice circular published successfully.',
      data: notice,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Delete a Notice
 */
export async function deleteNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const existing = await prisma.notice.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    await prisma.notice.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Notice removed successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get User Messages (Inbox & Sent)
 */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { type } = req.query; // 'inbox' or 'sent'

    const where = type === 'sent' ? { senderId: userId } : { receiverId: userId };

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Send an in-app message
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const senderId = req.user!.id;
    const input: SendMessageInput = req.body;

    if (senderId === input.receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a message to yourself.',
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: input.receiverId,
        subject: input.subject || null,
        body: input.body,
      },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Mark message as read
 */
export async function markMessageRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const message = await prisma.message.findFirst({
      where: { id, receiverId: userId },
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}
