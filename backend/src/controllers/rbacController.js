import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ALL_PERMISSION_SLUGS, isUserSuperAdmin } from '../middleware/auth.js';

/**
 * Helper to count active Super Admins in the database
 */
const countActiveSuperAdmins = async () => {
  return await prisma.user.count({
    where: {
      OR: [
        { isSuperAdmin: true },
        { role: 'SUPER_ADMIN' },
        { email: 'admin@specialtech.com' },
      ],
      isActive: true,
    },
  });
};

/**
 * GET /api/admin/permissions
 * List all available system permission definitions grouped by category
 */
export const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category for frontend display
    const grouped = permissions.reduce((acc, perm) => {
      acc[perm.category] = acc[perm.category] || [];
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      count: permissions.length,
      data: permissions,
      grouped,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * List all administrative accounts with their roles and assigned permissions
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const where = {};

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    if (role === 'SUPER_ADMIN') {
      where.OR = [{ role: 'SUPER_ADMIN' }, { isSuperAdmin: true }];
    } else if (role === 'ADMIN') {
      where.role = 'ADMIN';
      where.isSuperAdmin = false;
      where.email = { not: 'admin@specialtech.com' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userPermissions: {
          select: {
            permission: {
              select: {
                id: true,
                slug: true,
                name: true,
                category: true,
              },
            },
            grantedAt: true,
          },
        },
      },
      orderBy: [{ isSuperAdmin: 'desc' }, { createdAt: 'asc' }],
    });

    const formatted = users.map((u) => {
      const isSuper = isUserSuperAdmin(u);
      const permissions = isSuper
        ? [...ALL_PERMISSION_SLUGS]
        : (u.userPermissions || []).map((up) => up.permission?.slug).filter(Boolean);

      return {
        ...u,
        isSuperAdmin: isSuper,
        permissions,
        permissionCount: permissions.length,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Retrieve single admin user with full permission profile
 */
export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userPermissions: {
          select: {
            permission: {
              select: {
                id: true,
                slug: true,
                name: true,
                category: true,
                description: true,
              },
            },
            grantedAt: true,
            grantedBy: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const isSuper = isUserSuperAdmin(user);
    const permissions = isSuper
      ? [...ALL_PERMISSION_SLUGS]
      : (user.userPermissions || []).map((up) => up.permission?.slug).filter(Boolean);

    res.json({
      success: true,
      data: {
        ...user,
        isSuperAdmin: isSuper,
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users
 * Super Admin creates a new Administrator account and assigns initial permissions
 */
export const createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'ADMIN', isSuperAdmin = false, permissions = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required to create an admin account.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account with email ${email} already exists.`,
      });
    }

    const isTargetSuper = Boolean(isSuperAdmin || role === 'SUPER_ADMIN');
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: isTargetSuper ? 'SUPER_ADMIN' : 'ADMIN',
        isSuperAdmin: isTargetSuper,
        isActive: true,
      },
    });

    // If regular Admin and initial permissions provided, assign them
    let assignedSlugs = [];
    if (!isTargetSuper && Array.isArray(permissions) && permissions.length > 0) {
      const validPerms = await prisma.permission.findMany({
        where: { slug: { in: permissions } },
      });

      if (validPerms.length > 0) {
        await prisma.userPermission.createMany({
          data: validPerms.map((p) => ({
            userId: newUser.id,
            permissionId: p.id,
            grantedBy: req.user.id,
          })),
        });
        assignedSlugs = validPerms.map((p) => p.slug);
      }
    } else if (isTargetSuper) {
      assignedSlugs = [...ALL_PERMISSION_SLUGS];
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        details: {
          createdEmail: newUser.email,
          role: newUser.role,
          isSuperAdmin: isTargetSuper,
          permissionCount: assignedSlugs.length,
          permissions: assignedSlugs,
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.status(201).json({
      success: true,
      message: `Admin account for ${newUser.name} (${newUser.email}) created successfully.`,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isSuperAdmin: isTargetSuper,
        isActive: newUser.isActive,
        permissions: assignedSlugs,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id
 * Super Admin updates an Admin profile (name, email, role, password)
 */
export const updateAdminUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isSuperAdmin, password, isActive } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const wasSuperAdmin = isUserSuperAdmin(targetUser);
    const willBeSuperAdmin = typeof isSuperAdmin === 'boolean'
      ? isSuperAdmin
      : (role ? role === 'SUPER_ADMIN' : wasSuperAdmin);

    // Protection rule: Cannot demote or deactivate the last active Super Admin
    if (wasSuperAdmin && (!willBeSuperAdmin || isActive === false)) {
      const activeSuperCount = await countActiveSuperAdmins();
      if (activeSuperCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security Violation: Cannot demote or deactivate the last active Super Admin account.',
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role) updateData.role = willBeSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';
    if (typeof isSuperAdmin === 'boolean') updateData.isSuperAdmin = isSuperAdmin;
    if (password && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_UPDATED',
        entityType: 'USER',
        entityId: targetUser.id,
        details: {
          targetEmail: targetUser.email,
          changes: Object.keys(updateData).filter((k) => k !== 'passwordHash'),
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: `Admin account for ${updated.name} updated successfully.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Super Admin toggles activation status (Active / Deactivated)
 */
export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) is required.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Protection rule: Cannot deactivate the last active Super Admin
    if (isUserSuperAdmin(targetUser) && isActive === false) {
      const activeSuperCount = await countActiveSuperAdmins();
      if (activeSuperCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security Violation: Cannot deactivate the last active Super Admin account.',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_STATUS_CHANGED',
        entityType: 'USER',
        entityId: targetUser.id,
        details: {
          targetEmail: targetUser.email,
          isActive,
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: `Admin account ${updated.email} is now ${isActive ? 'Active' : 'Deactivated'}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/permissions
 * Super Admin assigns or removes individual granular permissions
 */
export const updateAdminPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be provided as an array of permission slugs.',
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Protection rule: Admins cannot modify their own permissions
    if (req.user.id === targetUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Administrators are not permitted to modify their own permissions.',
      });
    }

    // Look up valid permissions from database
    const validPerms = await prisma.permission.findMany({
      where: { slug: { in: permissions } },
    });

    // Execute within transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing permissions
      await tx.userPermission.deleteMany({
        where: { userId: targetUser.id },
      });

      // Insert new permissions
      if (validPerms.length > 0) {
        await tx.userPermission.createMany({
          data: validPerms.map((p) => ({
            userId: targetUser.id,
            permissionId: p.id,
            grantedBy: req.user.id,
          })),
        });
      }
    });

    const assignedSlugs = validPerms.map((p) => p.slug);

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'PERMISSIONS_UPDATED',
        entityType: 'USER',
        entityId: targetUser.id,
        details: {
          targetEmail: targetUser.email,
          previousCount: (await prisma.userPermission.count({ where: { userId: targetUser.id } })),
          newCount: assignedSlugs.length,
          grantedPermissions: assignedSlugs,
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: `Permissions updated successfully for ${targetUser.name} (${assignedSlugs.length} active permissions).`,
      data: {
        userId: targetUser.id,
        email: targetUser.email,
        permissions: assignedSlugs,
        permissionCount: assignedSlugs.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Super Admin deletes an Admin account
 */
export const deleteAdminUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Protection rule: Cannot delete yourself
    if (req.user.id === targetUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: You cannot delete your own administrative account.',
      });
    }

    // Protection rule: Cannot delete the last active Super Admin
    if (isUserSuperAdmin(targetUser)) {
      const activeSuperCount = await countActiveSuperAdmins();
      if (activeSuperCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security Violation: Cannot delete the last active Super Admin account.',
        });
      }
    }

    // Record activity log before deleting
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_DELETED',
        entityType: 'USER',
        entityId: targetUser.id,
        details: {
          deletedEmail: targetUser.email,
          deletedName: targetUser.name,
          role: targetUser.role,
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: `Admin account for ${targetUser.name} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (err) {
    next(err);
  }
};
