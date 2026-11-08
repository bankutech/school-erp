import { Router } from 'express';
import {
  getStaffList,
  createStaff,
  getStaffDetail,
  getLeaves,
  requestLeave,
  reviewLeave,
  markStaffAttendance,
  getStaffAttendance,
  generatePayslip,
  getPayslips,
  markPayslipPaid,
} from './staff.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateStaffSchema,
  CreateLeaveRequestSchema,
  ReviewLeaveRequestSchema,
  MarkStaffAttendanceSchema,
  GeneratePayslipSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Staff Directory
router.get(
  '/',
  requirePermission(PERMISSIONS.STAFF_READ),
  getStaffList
);

router.post(
  '/',
  requirePermission(PERMISSIONS.STAFF_WRITE),
  validateRequest(CreateStaffSchema),
  createStaff
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.STAFF_READ),
  getStaffDetail
);

// Leaves
router.get(
  '/leaves/all',
  getLeaves
);

router.post(
  '/leaves/request',
  requirePermission(PERMISSIONS.LEAVE_REQUEST),
  validateRequest(CreateLeaveRequestSchema),
  requestLeave
);

router.patch(
  '/leaves/:id/review',
  requirePermission(PERMISSIONS.LEAVE_APPROVE),
  validateRequest(ReviewLeaveRequestSchema),
  reviewLeave
);

// Staff Attendance
router.post(
  '/attendance/mark',
  requirePermission(PERMISSIONS.STAFF_WRITE),
  validateRequest(MarkStaffAttendanceSchema),
  markStaffAttendance
);

router.get(
  '/attendance/records',
  requirePermission(PERMISSIONS.STAFF_READ),
  getStaffAttendance
);

// Payroll
router.get(
  '/payroll/payslips',
  requirePermission(PERMISSIONS.PAYROLL_READ),
  getPayslips
);

router.post(
  '/payroll/generate',
  requirePermission(PERMISSIONS.PAYROLL_PROCESS),
  validateRequest(GeneratePayslipSchema),
  generatePayslip
);

router.patch(
  '/payroll/payslips/:id/paid',
  requirePermission(PERMISSIONS.PAYROLL_PROCESS),
  markPayslipPaid
);

export default router;
