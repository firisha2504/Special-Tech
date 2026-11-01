import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const ALL_PERMISSION_SLUGS = [
  'manage_admins',
  'manage_customers',
  'manage_inquiries',
  'manage_requirements',
  'manage_prototypes',
  'manage_proposals',
  'manage_projects',
  'manage_services',
  'manage_website_content',
  'view_analytics',
  'manage_ai_settings',
  'manage_system_settings',
  'view_audit_logs',
  'manage_backups',
];

export const isUserSuperAdmin = (user) => {
  if (!user) return false;
  return Boolean(
    user.isSuperAdmin ||
    user.role === 'SUPER_ADMIN' ||
    user.email === 'admin@specialtech.com'
  );
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'special_tech_secret_2026');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        avatar: true,
        isActive: true,
        userPermissions: {
          select: {
            permission: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive or not found',
      });
    }

    const isSuper = isUserSuperAdmin(user);
    const permissions = isSuper
      ? [...ALL_PERMISSION_SLUGS]
      : (user.userPermissions || []).map((up) => up.permission?.slug).filter(Boolean);

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: isSuper,
      avatar: user.avatar,
      isActive: user.isActive,
      permissions,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Admin satisfies all role requirements
    if (req.user.isSuperAdmin || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (isUserSuperAdmin(req.user)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access forbidden: Super Admin privileges required.',
  });
};

export const requirePermission = (permissionSlug) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Admin has all permissions unconditionally
    if (isUserSuperAdmin(req.user)) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permissionSlug)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Requires '${permissionSlug}' permission.`,
      });
    }

    next();
  };
};
