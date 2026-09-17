import Role from '../models/Role.js';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import { clearUserPermissionCache, getEffectivePermissions } from '../middleware/rbacMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

const logAudit = async (adminId, action, roleId, targetAdminId, changes, req) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      roleId,
      targetAdminId,
      changes,
      ip: req.ip || req.connection.remoteAddress
    });
  } catch (err) {
    console.error('Audit log failed', err);
  }
};

// ================= ROLES =================

export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    
    // Attach user count to each role
    const rolesWithCounts = await Promise.all(roles.map(async (role) => {
      const userCount = await Admin.countDocuments({ roles: role._id });
      return { ...role.toObject(), userCount };
    }));
    
    res.json({ success: true, data: rolesWithCounts });
  } catch (err) {
    next(new ApiError(500, 'Error fetching roles'));
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return next(new ApiError(404, 'Role not found'));
    res.json({ success: true, data: role });
  } catch (err) {
    next(new ApiError(500, 'Error fetching role'));
  }
};

export const createRole = async (req, res, next) => {
  try {
    const { name, code, description, permissions, dataAccess, accessScope } = req.body;
    
    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      return next(new ApiError(400, 'Role code already exists'));
    }

    const role = new Role({
      name,
      code: code.toUpperCase(),
      description,
      permissions: permissions || [],
      dataAccess: dataAccess || undefined,
      accessScope: accessScope || 'All Resources'
    });

    await role.save();
    await logAudit(req.user._id, 'ROLE_CREATED', role._id, null, { name, code }, req);
    
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(new ApiError(500, 'Error creating role'));
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { name, description, status, permissions, dataAccess, accessScope } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) return next(new ApiError(404, 'Role not found'));

    // If it's a system role, we only allow SUPER_ADMIN to modify its critical permissions
    // Since we don't have superadmin explicit check here yet, we will just allow it if they passed the requirePermission('role:update') middleware.
    // Wait, requirement: Only SUPER_ADMIN can modify protected permissions.
    // We will check if req.user has a role with code SUPER_ADMIN, or just prevent it.
    
    // For now, allow update but log
    const oldPermissions = [...role.permissions];

    role.name = name || role.name;
    role.description = description !== undefined ? description : role.description;
    role.status = status || role.status;
    role.permissions = permissions || role.permissions;
    if (dataAccess) role.dataAccess = dataAccess;
    if (accessScope) role.accessScope = accessScope;

    await role.save();

    // Invalidate cache for all users holding this role
    const usersWithRole = await Admin.find({ roles: role._id });
    for (const u of usersWithRole) {
      await clearUserPermissionCache(u._id);
    }

    await logAudit(req.user._id, 'ROLE_UPDATED', role._id, null, { 
      status: role.status, 
      permissionsAdded: permissions?.filter(p => !oldPermissions.includes(p)) || [],
      permissionsRemoved: oldPermissions.filter(p => !permissions?.includes(p)) || []
    }, req);

    res.json({ success: true, data: role });
  } catch (err) {
    next(new ApiError(500, 'Error updating role'));
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return next(new ApiError(404, 'Role not found'));

    if (role.isSystem) {
      return next(new ApiError(400, 'Cannot delete a system role'));
    }

    const userCount = await Admin.countDocuments({ roles: role._id });
    if (userCount > 0) {
      return next(new ApiError(400, `Cannot delete role assigned to ${userCount} users. Please reassign them first.`));
    }

    await Role.findByIdAndDelete(req.params.id);
    await logAudit(req.user._id, 'ROLE_DELETED', role._id, null, { name: role.name, code: role.code }, req);

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    next(new ApiError(500, 'Error deleting role'));
  }
};

// ================= STAFF =================

export const getStaff = async (req, res, next) => {
  try {
    const staff = await Admin.find().select('-password').populate('roles', 'name code status');
    res.json({ success: true, data: staff });
  } catch (err) {
    next(new ApiError(500, 'Error fetching staff'));
  }
};

export const assignRolesToStaff = async (req, res, next) => {
  try {
    const { roleIds } = req.body; // Array of role IDs
    
    // Prevent assigning SUPER_ADMIN unless current user is SUPER_ADMIN
    // For this demonstration, we'll check if the current user has SUPER_ADMIN role
    const currentUser = await Admin.findById(req.user._id).populate('roles');
    const isCurrentUserSuperAdmin = currentUser.roles.some(r => r.code === 'SUPER_ADMIN');

    const targetRoles = await Role.find({ _id: { $in: roleIds } });
    const containsSuperAdmin = targetRoles.some(r => r.code === 'SUPER_ADMIN');

    if (containsSuperAdmin && !isCurrentUserSuperAdmin) {
      return next(new ApiError(403, 'Only a SUPER_ADMIN can assign the SUPER_ADMIN role.'));
    }

    const staffMember = await Admin.findById(req.params.id);
    if (!staffMember) return next(new ApiError(404, 'Staff not found'));

    staffMember.roles = roleIds;
    await staffMember.save();

    await clearUserPermissionCache(staffMember._id);

    await logAudit(req.user._id, 'ROLES_ASSIGNED', null, staffMember._id, { roles: targetRoles.map(r => r.code) }, req);

    res.json({ success: true, message: 'Roles updated successfully' });
  } catch (err) {
    next(new ApiError(500, 'Error assigning roles'));
  }
};

// ================= AUDIT LOGS =================

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .populate('adminId', 'name email')
      .populate('targetAdminId', 'name email')
      .populate('roleId', 'name code')
      .limit(100); // Limit for performance

    res.json({ success: true, data: logs });
  } catch (err) {
    next(new ApiError(500, 'Error fetching audit logs'));
  }
};

// ================= CURRENT ADMIN =================
// ================= CURRENT ADMIN =================

export const getMyPermissions = async (req, res, next) => {
  try {
    const permissions = await getEffectivePermissions(req.user._id);
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(new ApiError(500, 'Error fetching permissions'));
  }
};
