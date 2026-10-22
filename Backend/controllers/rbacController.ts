import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { clearUserPermissionCache, getEffectivePermissions } from '../middleware/rbacMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const logAudit = async (
  adminId: string,
  action: string,
  roleId: string | null = null,
  targetAdminId: string | null = null,
  changes: any = null,
  req: AuthenticatedRequest
) => {
  try {
    const id = crypto.randomBytes(12).toString('hex');
    await prisma.auditLog.create({
      data: {
        id,
        adminId,
        action,
        roleId,
        targetAdminId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
        ip: (req.ip || (req.socket ? req.socket.remoteAddress : '')) as string,
      },
    });
  } catch (err) {
    console.error('Audit log failed', err);
  }
};

// ================= ROLES =================

export const getRoles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await prisma.adminRole.count({
          where: { roleId: role.id },
        });
        return {
          ...role,
          _id: role.id,
          userCount,
        };
      })
    );

    res.json({ success: true, data: rolesWithCounts });
  } catch (err) {
    next(new ApiError(500, 'Error fetching roles'));
  }
};

export const getRoleById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id },
    });
    if (!role) return next(new ApiError(404, 'Role not found'));
    res.json({ success: true, data: { ...role, _id: role.id } });
  } catch (err) {
    next(new ApiError(500, 'Error fetching role'));
  }
};

export const createRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, permissions, dataAccess, accessScope } = req.body;

    if (!name || !code) {
      return next(new ApiError(400, 'Name and code are required'));
    }

    const existingRole = await prisma.role.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingRole) {
      return next(new ApiError(400, 'Role code already exists'));
    }

    const id = crypto.randomBytes(12).toString('hex');
    const role = await prisma.role.create({
      data: {
        id,
        name,
        code: code.toUpperCase(),
        description: description || '',
        permissions: permissions || [],
        dataAccess: dataAccess || undefined,
        accessScope: accessScope || 'All Resources',
      },
    });

    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId) {
      await logAudit(currentAdminId, 'ROLE_CREATED', role.id, null, { name, code }, req);
    }

    res.status(201).json({ success: true, data: { ...role, _id: role.id } });
  } catch (err) {
    next(new ApiError(500, 'Error creating role'));
  }
};

export const updateRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, description, status, permissions, dataAccess, accessScope } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
    });
    if (!role) return next(new ApiError(404, 'Role not found'));

    const oldPermissions = [...role.permissions];

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: name !== undefined ? name : role.name,
        description: description !== undefined ? description : role.description,
        status: status !== undefined ? status : role.status,
        permissions: permissions !== undefined ? permissions : role.permissions,
        dataAccess: dataAccess !== undefined ? dataAccess : (role.dataAccess as any),
        accessScope: accessScope !== undefined ? accessScope : role.accessScope,
      },
    });

    // Invalidate cache for all users holding this role
    const adminRoles = await prisma.adminRole.findMany({
      where: { roleId: role.id },
      select: { adminId: true },
    });
    for (const ar of adminRoles) {
      await clearUserPermissionCache(ar.adminId);
    }

    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId) {
      await logAudit(
        currentAdminId,
        'ROLE_UPDATED',
        role.id,
        null,
        {
          status: updatedRole.status,
          permissionsAdded: permissions?.filter((p: string) => !oldPermissions.includes(p)) || [],
          permissionsRemoved: oldPermissions.filter((p: string) => !permissions?.includes(p)) || [],
        },
        req
      );
    }

    res.json({ success: true, data: { ...updatedRole, _id: updatedRole.id } });
  } catch (err) {
    next(new ApiError(500, 'Error updating role'));
  }
};

export const deleteRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id },
    });
    if (!role) return next(new ApiError(404, 'Role not found'));

    if (role.isSystem) {
      return next(new ApiError(400, 'Cannot delete a system role'));
    }

    const userCount = await prisma.adminRole.count({
      where: { roleId: role.id },
    });
    if (userCount > 0) {
      return next(
        new ApiError(400, `Cannot delete role assigned to ${userCount} users. Please reassign them first.`)
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId) {
      await logAudit(currentAdminId, 'ROLE_DELETED', role.id, null, { name: role.name, code: role.code }, req);
    }

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    next(new ApiError(500, 'Error deleting role'));
  }
};

// ================= STAFF =================

export const getStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const staff = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        adminRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const formattedStaff = staff.map((member) => ({
      ...member,
      _id: member.id,
      roles: member.adminRoles.map((ar) => ({
        ...ar.role,
        _id: ar.role.id,
      })),
    }));

    res.json({ success: true, data: formattedStaff });
  } catch (err) {
    next(new ApiError(500, 'Error fetching staff'));
  }
};

export const assignRolesToStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roleIds } = req.body; // Array of role IDs
    const currentAdminId = req.user?.id || req.user?._id;

    if (!Array.isArray(roleIds)) {
      return next(new ApiError(400, 'roleIds must be an array'));
    }

    // Check if current user is SUPER_ADMIN
    const currentUserRoles = await prisma.adminRole.findMany({
      where: { adminId: currentAdminId },
      include: { role: true },
    });
    const isCurrentUserSuperAdmin = currentUserRoles.some((ar) => ar.role.code === 'SUPER_ADMIN');

    const targetRoles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    const containsSuperAdmin = targetRoles.some((r) => r.code === 'SUPER_ADMIN');

    if (containsSuperAdmin && !isCurrentUserSuperAdmin) {
      return next(new ApiError(403, 'Only a SUPER_ADMIN can assign the SUPER_ADMIN role.'));
    }

    const staffId = String(req.params.id);
    const staffMember = await prisma.admin.findUnique({
      where: { id: staffId },
    });
    if (!staffMember) return next(new ApiError(404, 'Staff not found'));

    // Transaction to replace adminRoles
    await prisma.$transaction([
      prisma.adminRole.deleteMany({
        where: { adminId: staffMember.id },
      }),
      prisma.adminRole.createMany({
        data: roleIds.map((rId: string) => ({
          adminId: staffMember.id,
          roleId: rId,
        })),
      }),
    ]);

    await clearUserPermissionCache(staffMember.id);

    if (currentAdminId) {
      await logAudit(
        currentAdminId,
        'ROLES_ASSIGNED',
        null,
        staffMember.id,
        { roles: targetRoles.map((r) => r.code) },
        req
      );
    }

    res.json({ success: true, message: 'Roles updated successfully' });
  } catch (err) {
    next(new ApiError(500, 'Error assigning roles'));
  }
};

// ================= AUDIT LOGS =================

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targetAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      ...log,
      _id: log.id,
      adminId: log.admin
        ? {
            ...log.admin,
            _id: log.admin.id,
          }
        : null,
      targetAdminId: log.targetAdmin
        ? {
            ...log.targetAdmin,
            _id: log.targetAdmin.id,
          }
        : null,
      roleId: log.role
        ? {
            ...log.role,
            _id: log.role.id,
          }
        : null,
    }));

    res.json({ success: true, data: formattedLogs });
  } catch (err) {
    next(new ApiError(500, 'Error fetching audit logs'));
  }
};

// ================= CURRENT ADMIN =================

export const getMyPermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentAdminId = req.user?.id || req.user?._id;
    const permissions = await getEffectivePermissions(currentAdminId);
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(new ApiError(500, 'Error fetching permissions'));
  }
};
