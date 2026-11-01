import prisma from '../../config/db.js';

/**
 * Special Tech Notification Dispatch Service
 * Handles notification creation, recipient targeting, and deduplication.
 */

/**
 * Creates an in-app notification.
 * If targetUserId is provided, sends to that user specifically.
 * If not provided, dispatches to all active system administrators.
 */
export const createNotification = async ({
  title,
  message,
  type = 'info',
  link = null,
  metadata = {},
  userId = null,
}) => {
  try {
    // If targeted to a specific user
    if (userId) {
      // Deduplication check: Avoid inserting duplicates within 2 minutes for same user & link
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title,
          link,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // last 2 minutes
          },
        },
      });

      if (existing) {
        return existing;
      }

      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
          metadata,
          isRead: false,
        },
      });
    }

    // Broadcast to all active admin accounts
    const activeAdmins = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeAdmins.length === 0) {
      // Fallback: create unassigned notification
      return await prisma.notification.create({
        data: {
          title,
          message,
          type,
          link,
          metadata,
          isRead: false,
        },
      });
    }

    const createdNotifications = [];
    for (const admin of activeAdmins) {
      // Check deduplication per admin
      const existing = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          title,
          link,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        const notif = await prisma.notification.create({
          data: {
            userId: admin.id,
            title,
            message,
            type,
            link,
            metadata,
            isRead: false,
          },
        });
        createdNotifications.push(notif);
      } else {
        createdNotifications.push(existing);
      }
    }

    return createdNotifications[0] || null;
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
};

/**
 * Dispatch notification for a new customer inquiry
 */
export const notifyNewInquiry = async (inquiry, customer) => {
  return createNotification({
    title: 'New Customer Project Submission',
    message: `Inquiry #${inquiry.inquiryNumber} received from ${customer.name} (${customer.company || 'Direct Contact'}).`,
    type: 'inquiry',
    link: `/admin?tab=inquiries&id=${inquiry.id}`,
    metadata: {
      inquiryId: inquiry.id,
      inquiryNumber: inquiry.inquiryNumber,
      customerEmail: customer.email,
    },
  });
};

/**
 * Dispatch notification for a SaaS product demo request
 */
export const notifyNewDemoRequest = async (demoRequest) => {
  return createNotification({
    title: 'New Product Demo Request',
    message: `${demoRequest.name} (${demoRequest.company || demoRequest.email}) requested a demo for ${demoRequest.productName || 'Special Tech Products'}.`,
    type: 'demo_request',
    link: `/admin?tab=products`,
    metadata: {
      demoRequestId: demoRequest.id,
      productName: demoRequest.productName,
      customerEmail: demoRequest.email,
    },
  });
};
