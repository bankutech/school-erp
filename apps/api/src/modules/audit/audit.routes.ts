import { Router } from 'express';
import { getAuditLogs, getAuditSummary, exportAuditCsv } from './audit.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { UserRoleType } from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(UserRoleType.SUPER_ADMIN, UserRoleType.PRINCIPAL));

router.get('/logs', getAuditLogs);
router.get('/summary', getAuditSummary);
router.get('/export', exportAuditCsv);

export default router;
