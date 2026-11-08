import { Router } from 'express';
import {
  getVehicles,
  createVehicle,
  getRoutes,
  createRoute,
  assignStudentTransport,
  removeStudentTransport,
} from './transport.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateVehicleSchema,
  CreateTransportRouteSchema,
  AssignTransportSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Vehicles
router.get(
  '/vehicles',
  requirePermission(PERMISSIONS.TRANSPORT_READ),
  getVehicles
);

router.post(
  '/vehicles',
  requirePermission(PERMISSIONS.TRANSPORT_WRITE),
  validateRequest(CreateVehicleSchema),
  createVehicle
);

// Routes
router.get(
  '/routes',
  requirePermission(PERMISSIONS.TRANSPORT_READ),
  getRoutes
);

router.post(
  '/routes',
  requirePermission(PERMISSIONS.TRANSPORT_WRITE),
  validateRequest(CreateTransportRouteSchema),
  createRoute
);

// Student Assignment
router.post(
  '/assignments',
  requirePermission(PERMISSIONS.TRANSPORT_WRITE),
  validateRequest(AssignTransportSchema),
  assignStudentTransport
);

router.delete(
  '/assignments/:studentId',
  requirePermission(PERMISSIONS.TRANSPORT_WRITE),
  removeStudentTransport
);

export default router;
