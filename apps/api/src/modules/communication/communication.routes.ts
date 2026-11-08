import { Router } from 'express';
import {
  getNotices,
  createNotice,
  deleteNotice,
  getMessages,
  sendMessage,
  markMessageRead,
} from './communication.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateNoticeSchema,
  SendMessageSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Notices
router.get(
  '/notices',
  requirePermission(PERMISSIONS.COMMUNICATION_READ),
  getNotices
);

router.post(
  '/notices',
  requirePermission(PERMISSIONS.COMMUNICATION_WRITE),
  validateRequest(CreateNoticeSchema),
  createNotice
);

router.delete(
  '/notices/:id',
  requirePermission(PERMISSIONS.COMMUNICATION_WRITE),
  deleteNotice
);

// Messages
router.get(
  '/messages',
  requirePermission(PERMISSIONS.COMMUNICATION_READ),
  getMessages
);

router.post(
  '/messages',
  requirePermission(PERMISSIONS.COMMUNICATION_WRITE),
  validateRequest(SendMessageSchema),
  sendMessage
);

router.patch(
  '/messages/:id/read',
  requirePermission(PERMISSIONS.COMMUNICATION_READ),
  markMessageRead
);

export default router;
