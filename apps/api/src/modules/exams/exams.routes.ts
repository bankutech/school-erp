import { Router } from 'express';
import {
  getExaminations,
  createExamination,
  updateExamStatus,
  getSubjectMarksRoster,
  recordMarks,
  publishExamResults,
  getReportCards,
  getStudentReportCard,
} from './exams.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateExaminationSchema,
  RecordMarksSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// List examinations
router.get(
  '/',
  requirePermission(PERMISSIONS.EXAMS_READ),
  getExaminations
);

// Create examination
router.post(
  '/',
  requirePermission(PERMISSIONS.EXAMS_WRITE),
  validateRequest(CreateExaminationSchema),
  createExamination
);

// Update status
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.EXAMS_WRITE),
  updateExamStatus
);

// Marks entry roster
router.get(
  '/:id/subjects/:subjectId/roster',
  requirePermission(PERMISSIONS.MARKS_ENTER),
  getSubjectMarksRoster
);

// Record/Submit marks
router.post(
  '/marks',
  requirePermission(PERMISSIONS.MARKS_ENTER),
  validateRequest(RecordMarksSchema),
  recordMarks
);

// Publish results & generate report cards
router.post(
  '/:id/publish',
  requirePermission(PERMISSIONS.MARKS_PUBLISH),
  publishExamResults
);

// Get Report Cards
router.get(
  '/:id/report-cards',
  requirePermission(PERMISSIONS.EXAMS_READ),
  getReportCards
);

// Get Printable Student Report Card
router.get(
  '/:id/report-cards/:studentId',
  requirePermission(PERMISSIONS.EXAMS_READ),
  getStudentReportCard
);

export default router;
