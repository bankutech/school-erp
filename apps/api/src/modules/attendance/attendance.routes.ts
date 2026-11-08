import { Router } from 'express';
import {
  getAttendanceRoster,
  markBulkAttendance,
  correctAttendance,
  getStudentAttendanceSummary,
} from './attendance.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireIdempotency } from '../../middleware/idempotency.js';
import {
  BulkAttendanceSchema,
  AttendanceCorrectionSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

router.get(
  '/roster',
  requirePermission(PERMISSIONS.ATTENDANCE_READ),
  getAttendanceRoster
);

router.post(
  '/bulk',
  requirePermission(PERMISSIONS.ATTENDANCE_MARK),
  requireIdempotency,
  validateRequest(BulkAttendanceSchema),
  markBulkAttendance
);

router.patch(
  '/correct',
  requirePermission(PERMISSIONS.ATTENDANCE_CORRECT),
  validateRequest(AttendanceCorrectionSchema),
  correctAttendance
);

router.get(
  '/student/:studentId',
  requirePermission(PERMISSIONS.ATTENDANCE_READ),
  getStudentAttendanceSummary
);

export default router;
