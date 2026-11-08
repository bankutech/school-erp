import { Router } from 'express';
import {
  listUsers,
  createUser,
  toggleUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from './users.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { UserRoleType } from '@school-erp/shared';

const router = Router();

router.use(authenticateToken);

// Read users (Super Admin & Principal)
router.get('/', requireRole(UserRoleType.SUPER_ADMIN, UserRoleType.PRINCIPAL), listUsers);

// Super Admin exclusive controls
router.post('/', requireRole(UserRoleType.SUPER_ADMIN), createUser);
router.patch('/:id/status', requireRole(UserRoleType.SUPER_ADMIN), toggleUserStatus);
router.patch('/:id/role', requireRole(UserRoleType.SUPER_ADMIN), updateUserRole);
router.post('/:id/reset-password', requireRole(UserRoleType.SUPER_ADMIN), resetUserPassword);
router.delete('/:id', requireRole(UserRoleType.SUPER_ADMIN), deleteUser);

export default router;
