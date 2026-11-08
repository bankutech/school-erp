import { Router } from 'express';
import {
  getFeeStructures,
  createFeeStructure,
  getInvoices,
  generateInvoices,
  recordPayment,
  getHouseholdBalances,
  recordSplitPayment,
} from './fees.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireIdempotency } from '../../middleware/idempotency.js';
import {
  CreateFeeStructureSchema,
  GenerateInvoiceSchema,
  RecordPaymentSchema,
  RecordSplitPaymentSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Fee Structures
router.get(
  '/structures',
  requirePermission(PERMISSIONS.FEES_READ),
  getFeeStructures
);

router.post(
  '/structures',
  requirePermission(PERMISSIONS.FEES_WRITE),
  validateRequest(CreateFeeStructureSchema),
  createFeeStructure
);

// Invoices
router.get(
  '/invoices',
  requirePermission(PERMISSIONS.FEES_READ),
  getInvoices
);

// Household & Sibling Balances
router.get(
  '/household',
  requirePermission(PERMISSIONS.FEES_READ),
  getHouseholdBalances
);

router.post(
  '/invoices/generate',
  requirePermission(PERMISSIONS.FEES_WRITE),
  requireIdempotency,
  validateRequest(GenerateInvoiceSchema),
  generateInvoices
);

// Payments & Receipts
router.post(
  '/payments',
  requirePermission(PERMISSIONS.FEES_COLLECT),
  requireIdempotency,
  validateRequest(RecordPaymentSchema),
  recordPayment
);

// Multi-Invoice / Split Payment
router.post(
  '/payments/split',
  requirePermission(PERMISSIONS.FEES_COLLECT),
  requireIdempotency,
  validateRequest(RecordSplitPaymentSchema),
  recordSplitPayment
);

export default router;
