import { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  getAssignmentDetail,
  submitAssignment,
  gradeSubmission,
} from './lms.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateAssignmentSchema,
  SubmitAssignmentSchema,
  GradeSubmissionSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

router.get(
  '/assignments',
  requirePermission(PERMISSIONS.LMS_READ),
  getAssignments
);

router.post(
  '/assignments',
  requirePermission(PERMISSIONS.LMS_WRITE),
  validateRequest(CreateAssignmentSchema),
  createAssignment
);

router.get(
  '/assignments/:id',
  requirePermission(PERMISSIONS.LMS_READ),
  getAssignmentDetail
);

router.post(
  '/assignments/:id/submit',
  requirePermission(PERMISSIONS.LMS_SUBMIT),
  validateRequest(SubmitAssignmentSchema),
  submitAssignment
);

router.patch(
  '/submissions/:id/grade',
  requirePermission(PERMISSIONS.LMS_GRADE),
  validateRequest(GradeSubmissionSchema),
  gradeSubmission
);

export default router;
