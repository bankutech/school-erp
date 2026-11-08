import { Router } from 'express';
import {
  getBooks,
  createBook,
  issueBook,
  returnBook,
  getBookIssues,
} from './library.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  CreateBookSchema,
  IssueBookSchema,
  ReturnBookSchema,
  PERMISSIONS,
} from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Catalog
router.get(
  '/books',
  requirePermission(PERMISSIONS.LIBRARY_READ),
  getBooks
);

router.post(
  '/books',
  requirePermission(PERMISSIONS.LIBRARY_WRITE),
  validateRequest(CreateBookSchema),
  createBook
);

// Issues & Returns
router.get(
  '/issues',
  requirePermission(PERMISSIONS.LIBRARY_READ),
  getBookIssues
);

router.post(
  '/issues',
  requirePermission(PERMISSIONS.LIBRARY_ISSUE),
  validateRequest(IssueBookSchema),
  issueBook
);

router.post(
  '/returns',
  requirePermission(PERMISSIONS.LIBRARY_ISSUE),
  validateRequest(ReturnBookSchema),
  returnBook
);

export default router;
