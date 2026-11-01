import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { loginSchema } from '../validators/schemas.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
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
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isSuper = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN' || user.email === 'admin@specialtech.com');
    const permissions = isSuper
      ? [
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
        ]
      : (user.userPermissions || []).map((up) => up.permission?.slug).filter(Boolean);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'special_tech_secret_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const now = new Date();
    // Update lastLoginAt in database
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // Record login activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuperAdmin: isSuper,
        avatar: user.avatar,
        phone: user.phone || null,
        jobTitle: user.jobTitle || null,
        department: user.department || null,
        bio: user.bio || null,
        lastLoginAt: now,
        createdAt: user.createdAt,
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};
