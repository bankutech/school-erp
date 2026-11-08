import { Router } from 'express';
import {
  getInventoryItems,
  getInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  recordInventoryMovement,
  getInventoryMovements,
  exportInventoryCSV,
} from './inventory.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  RecordInventoryMovementSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Inventory Analytics Summary & CSV Export
router.get(
  '/summary',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  getInventorySummary
);

router.get(
  '/export',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  exportInventoryCSV
);

// Inventory Items CRUD
router.get(
  '/items',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  getInventoryItems
);

router.post(
  '/items',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validateRequest(CreateInventoryItemSchema),
  createInventoryItem
);

router.put(
  '/items/:id',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validateRequest(UpdateInventoryItemSchema),
  updateInventoryItem
);

router.delete(
  '/items/:id',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  deleteInventoryItem
);

// Stock Movements
router.get(
  '/movements',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  getInventoryMovements
);

router.post(
  '/movements',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validateRequest(RecordInventoryMovementSchema),
  recordInventoryMovement
);

export default router;
