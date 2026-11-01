import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';
import { ALL_PERMISSION_SLUGS, isUserSuperAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

/**
 * GET /api/admin/profile
 * Retrieve authenticated administrator profile, role, permissions, and recent activity
 */
export const getAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is inactive or not found',
      });
    }

    const isSuper = isUserSuperAdmin(user);

    // Permissions breakdown
    let permissions = [];
    let permissionDetails = [];

    if (isSuper) {
      permissions = [...ALL_PERMISSION_SLUGS];
      // Fetch full permission catalog for display
      permissionDetails = await prisma.permission.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    } else {
      permissions = (user.userPermissions || []).map((up) => up.permission?.slug).filter(Boolean);
      permissionDetails = (user.userPermissions || []).map((up) => up.permission).filter(Boolean);
    }

    // Recent activity audit trail (last 10 items)
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        OR: [
          { userId },
          { entityId: userId, entityType: 'USER' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fallback for lastLoginAt if not yet recorded
    let lastLoginAt = user.lastLoginAt;
    if (!lastLoginAt) {
      const loginLog = await prisma.activityLog.findFirst({
        where: {
          action: 'USER_LOGIN',
          OR: [{ userId }, { entityId: userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (loginLog) {
        lastLoginAt = loginLog.createdAt;
      }
    }

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        jobTitle: user.jobTitle || null,
        department: user.department || null,
        bio: user.bio || null,
        avatar: user.avatar || null,
        role: user.role,
        isSuperAdmin: isSuper,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: lastLoginAt || null,
        isFullAccess: isSuper,
        permissions,
        permissionDetails,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/profile
 * Update authenticated administrator personal information (name, phone, jobTitle, department, bio)
 * Strict Security: Never permits modifying role, isSuperAdmin, email, or permissions here
 */
export const updateAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, jobTitle, department, bio } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 2 and 100 characters',
      });
    }

    // Validate phone
    if (phone && phone.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Phone number cannot exceed 30 characters',
      });
    }

    // Validate jobTitle
    if (jobTitle && jobTitle.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Job title cannot exceed 100 characters',
      });
    }

    // Validate department
    if (department && department.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Department cannot exceed 100 characters',
      });
    }

    // Validate bio
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Biography cannot exceed 500 characters',
      });
    }

    // Update in PostgreSQL (role, isSuperAdmin, email, permissions remain untouched)
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: trimmedName,
        phone: phone ? phone.trim() : null,
        jobTitle: jobTitle ? jobTitle.trim() : null,
        department: department ? department.trim() : null,
        bio: bio ? bio.trim() : null,
      },
    });

    const isSuper = isUserSuperAdmin(updated);

    // Record audit activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        entityType: 'USER',
        entityId: userId,
        details: {
          updatedFields: ['name', phone !== undefined && 'phone', jobTitle !== undefined && 'jobTitle', department !== undefined && 'department', bio !== undefined && 'bio'].filter(Boolean),
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: 'Profile information updated successfully',
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || null,
        jobTitle: updated.jobTitle || null,
        department: updated.department || null,
        bio: updated.bio || null,
        avatar: updated.avatar || null,
        role: updated.role,
        isSuperAdmin: isSuper,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        lastLoginAt: updated.lastLoginAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/profile/photo
 * Upload a profile photo/avatar for the authenticated administrator
 */
export const uploadAdminPhoto = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided or file type was rejected. Supported types: JPEG, PNG, WebP.',
      });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;

    // Get current avatar to optionally delete old uploaded photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/')) {
      const oldFilePath = path.resolve(backendRoot, currentUser.avatar.replace(/^\//, ''));
      // Only delete if it exists and is not a default asset
      if (fs.existsSync(oldFilePath) && oldFilePath !== path.resolve(backendRoot, req.file.path)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          // Non-critical if unlink fails
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: relativeUrl },
    });

    // Record audit activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'AVATAR_UPDATED',
        entityType: 'USER',
        entityId: userId,
        details: { avatarUrl: relativeUrl },
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      avatar: relativeUrl,
      user: {
        id: updated.id,
        name: updated.name,
        avatar: relativeUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/profile/photo
 * Remove the current profile photo and restore default avatar
 */
export const removeAdminPhoto = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/')) {
      const oldFilePath = path.resolve(backendRoot, currentUser.avatar.replace(/^\//, ''));
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          // Ignore unlink errors
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    // Record audit activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'AVATAR_REMOVED',
        entityType: 'USER',
        entityId: userId,
        details: {},
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: 'Profile photo removed successfully',
      avatar: null,
      user: {
        id: updated.id,
        name: updated.name,
        avatar: null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/profile/change-password
 * Change password for authenticated administrator
 * Validates current password, enforces strength requirements, and returns fresh JWT token
 */
export const changeAdminPassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and password confirmation are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNum) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account not found or inactive',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Generate fresh session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'special_tech_secret_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Record audit activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: userId,
        details: {},
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      token,
    });
  } catch (err) {
    next(err);
  }
};
