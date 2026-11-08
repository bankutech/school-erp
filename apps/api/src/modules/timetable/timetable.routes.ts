import { Router } from 'express';
import {
  getTimetableEntries,
  createTimetableEntry,
  deleteTimetableEntry,
  createSubstitution,
  getClassrooms,
  createClassroom,
} from './timetable.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateTimetableEntrySchema,
  CreateSubstitutionSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Timetable schedules (teachers, students, parents, staff can view)
router.get(
  '/',
  requirePermission(PERMISSIONS.TIMETABLE_READ),
  getTimetableEntries
);

// Create entry (admin/principal/timetable manager)
router.post(
  '/',
  requirePermission(PERMISSIONS.TIMETABLE_WRITE),
  validateRequest(CreateTimetableEntrySchema),
  createTimetableEntry
);

// Delete entry
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.TIMETABLE_WRITE),
  deleteTimetableEntry
);

// Assign substitution
router.post(
  '/substitutions',
  requirePermission(PERMISSIONS.TIMETABLE_WRITE),
  validateRequest(CreateSubstitutionSchema),
  createSubstitution
);

// Classrooms
router.get(
  '/classrooms',
  requirePermission(PERMISSIONS.TIMETABLE_READ),
  getClassrooms
);

router.post(
  '/classrooms',
  requirePermission(PERMISSIONS.TIMETABLE_WRITE),
  createClassroom
);

export default router;
