import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

/**
 * Customer Portal Controller
 * Handles customer authentication, project tracking, status history, and in-app notifications.
 */

/**
 * Customer Login / Access
 * Allows customers to log in using their email to access their projects and status notifications.
 */
export const customerLogin = async (req, res, next) => {
  try {
    const { email, name, company, phone } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing customer or register new customer profile
    let customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      if (!name || !name.trim()) {
        return res.status(404).json({
          success: false,
          message: 'No project account found with this email. Please check your email or submit an inquiry.',
        });
      }

      customer = await prisma.customer.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          company: company?.trim() || null,
          phone: phone?.trim() || null,
        },
      });
    }

    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        role: 'CUSTOMER',
      },
      process.env.JWT_SECRET || 'special_tech_secret_2026',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Customer session authenticated successfully',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        phone: customer.phone,
      },
      data: {
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          phone: customer.phone,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Authenticated Customer Profile
 */
export const getCustomerProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      customer: req.customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get All Projects Owned by Authenticated Customer
 * Strictly enforced: Only returns projects where customerId === req.customer.id
 */
export const getCustomerProjects = async (req, res, next) => {
  try {
    const customerId = req.customer.id;

    const projects = await prisma.project.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
        notifications: {
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Specific Project Owned by Authenticated Customer
 * Strictly enforced: Blocks any customer from accessing another customer's project with HTTP 403
 */
export const getCustomerProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.customer.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
        notifications: {
          where: { customerId },
          orderBy: { createdAt: 'desc' },
        },
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Strict Data Isolation Authorization Check
    if (project.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access another customer\'s project.',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Customer Notifications
 * Filters by 'all', 'unread', 'read' and reports unread count
 */
export const getCustomerNotifications = async (req, res, next) => {
  try {
    const customerId = req.customer.id;
    const { filter = 'all' } = req.query;

    const where = { customerId };
    if (filter === 'unread') where.isRead = false;
    if (filter === 'read') where.isRead = true;

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      prisma.notification.count({
        where: { customerId, isRead: false },
      }),
      prisma.notification.count({
        where: { customerId },
      }),
    ]);

    res.json({
      success: true,
      unreadCount,
      totalCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark Individual Customer Notification as Read
 */
export const markCustomerNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.customer.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Security check: Customer can only modify their own notification
    if (notification.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this notification',
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { customerId, isRead: false },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark All Customer Notifications as Read
 */
export const markAllCustomerNotificationsRead = async (req, res, next) => {
  try {
    const customerId = req.customer.id;

    await prisma.notification.updateMany({
      where: { customerId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Customer Notification
 */
export const deleteCustomerNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.customer.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notification',
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    const unreadCount = await prisma.notification.count({
      where: { customerId, isRead: false },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};
