import { Router } from 'express';
import { getApplications, createApplication, reviewApplication } from './admissions.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateAdmissionApplicationSchema,
  ReviewAdmissionSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

// Public / applicant creation endpoint (or admin created)
router.post(
  '/',
  validateRequest(CreateAdmissionApplicationSchema),
  createApplication
);

// Protected routes
router.use(authenticateToken);

router.get(
  '/',
  requirePermission(PERMISSIONS.ADMISSIONS_READ),
  getApplications
);

router.patch(
  '/:id/review',
  requirePermission(PERMISSIONS.ADMISSIONS_APPROVE),
  validateRequest(ReviewAdmissionSchema),
  reviewApplication
);

export default router;
