import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getStaff,
  assignRolesToStaff,
  getAuditLogs,
  getMyPermissions
} from '../controllers/rbacController.js';

const router = express.Router();

// Apply base admin authentication to all RBAC routes
router.use(adminAuth);

// Get my effective permissions (for UI rendering)
router.get('/my-permissions', getMyPermissions);

// Roles Management
router.get('/roles', requirePermission('role:read'), getRoles);
router.get('/roles/:id', requirePermission('role:read'), getRoleById);
router.post('/roles', requirePermission('role:create'), createRole);
router.put('/roles/:id', requirePermission('role:update'), updateRole);
router.delete('/roles/:id', requirePermission('role:delete'), deleteRole);

// Staff Management
router.get('/staff', requirePermission('staff:read'), getStaff);
router.put('/staff/:id/roles', requirePermission('staff:manage'), assignRolesToStaff);

// Audit Logs
router.get('/audit-logs', requirePermission('audit:read'), getAuditLogs);

export default router;
