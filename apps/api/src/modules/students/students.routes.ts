import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  promoteStudents,
  issueCertificate,
  archiveStudent,
  updateStudent,
} from './students.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateStudentSchema,
  PromoteStudentSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  requirePermission(PERMISSIONS.STUDENTS_READ),
  getStudents
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_READ),
  getStudentById
);

router.post(
  '/',
  requirePermission(PERMISSIONS.STUDENTS_WRITE),
  validateRequest(CreateStudentSchema),
  createStudent
);

router.post(
  '/promote',
  requirePermission(PERMISSIONS.STUDENTS_WRITE),
  validateRequest(PromoteStudentSchema),
  promoteStudents
);

router.post(
  '/:id/certificates',
  requirePermission(PERMISSIONS.STUDENTS_CERTIFICATES),
  issueCertificate
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_WRITE),
  updateStudent
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_WRITE),
  updateStudent
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_WRITE),
  archiveStudent
);

export default router;
