import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  getFinancialSummary,
  exportStudentsCsv,
  exportFeeCollectionsCsv,
} from './accounts.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateExpenseSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Expenses
router.get(
  '/expenses',
  requirePermission(PERMISSIONS.ACCOUNTS_READ),
  getExpenses
);

router.post(
  '/expenses',
  requirePermission(PERMISSIONS.ACCOUNTS_WRITE),
  validateRequest(CreateExpenseSchema),
  createExpense
);

// Financial Ledger & Summary
router.get(
  '/summary',
  requirePermission(PERMISSIONS.ACCOUNTS_READ),
  getFinancialSummary
);

// CSV Export Reports
router.get(
  '/reports/export/students',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  exportStudentsCsv
);

router.get(
  '/reports/export/fees',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  exportFeeCollectionsCsv
);

export default router;
