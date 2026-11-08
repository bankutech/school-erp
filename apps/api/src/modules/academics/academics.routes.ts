import { Router } from 'express';
import {
  getAcademicYears,
  createAcademicYear,
  getClasses,
  createClass,
  createSection,
  getSubjects,
  createSubject,
  getTeacherAssignments,
  createTeacherAssignment,
} from './academics.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateAcademicYearSchema,
  CreateClassSchema,
  CreateSectionSchema,
  CreateSubjectSchema,
  CreateTeacherAssignmentSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Academic Years
router.get('/years', getAcademicYears);
router.post(
  '/years',
  requirePermission(PERMISSIONS.ACADEMIC_WRITE),
  validateRequest(CreateAcademicYearSchema),
  createAcademicYear
);

// Classes & Sections
router.get('/classes', getClasses);
router.post(
  '/classes',
  requirePermission(PERMISSIONS.ACADEMIC_WRITE),
  validateRequest(CreateClassSchema),
  createClass
);
router.post(
  '/sections',
  requirePermission(PERMISSIONS.ACADEMIC_WRITE),
  validateRequest(CreateSectionSchema),
  createSection
);

// Subjects
router.get('/subjects', getSubjects);
router.post(
  '/subjects',
  requirePermission(PERMISSIONS.ACADEMIC_WRITE),
  validateRequest(CreateSubjectSchema),
  createSubject
);

// Teacher Assignments
router.get('/assignments', getTeacherAssignments);
router.post(
  '/assignments',
  requirePermission(PERMISSIONS.ACADEMIC_WRITE),
  validateRequest(CreateTeacherAssignmentSchema),
  createTeacherAssignment
);

export default router;
