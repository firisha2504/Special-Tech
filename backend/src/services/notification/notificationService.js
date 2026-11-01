import prisma from '../../config/db.js';
import { sendProjectStatusEmail } from '../email/emailService.js';
import { sendSMSNotification } from '../sms/smsService.js';

/**
 * Special Tech Notification Dispatch Service
 * Handles notification creation, recipient targeting, and deduplication.
 */

/**
 * Creates an in-app notification.
 * - If customerId is provided, creates a notification for that customer.
 * - If userId is provided, creates a notification for that specific admin.
 * - If neither is provided, broadcasts to all active system administrators.
 */
export const createNotification = async ({
  title,
  message,
  type = 'info',
  link = null,
  metadata = {},
  userId = null,
  customerId = null,
  projectId = null,
  channel = 'IN_APP',
  deliveryStatus = 'DELIVERED',
  deliveryDetails = {},
}) => {
  try {
    // 1. If targeted to a specific customer
    if (customerId) {
      // Deduplication check: Avoid inserting duplicates within 2 minutes for same customer, title & project
      const existing = await prisma.notification.findFirst({
        where: {
          customerId,
          title,
          projectId: projectId || undefined,
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
          customerId,
          projectId: projectId || null,
          title,
          message,
          type,
          channel,
          deliveryStatus,
          deliveryDetails,
          link,
          metadata,
          isRead: false,
        },
      });
    }

    // 2. If targeted to a specific admin user
    if (userId) {
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
          projectId: projectId || null,
          title,
          message,
          type,
          channel,
          deliveryStatus,
          deliveryDetails,
          link,
          metadata,
          isRead: false,
        },
      });
    }

    // 3. Broadcast to all active admin accounts
    const activeAdmins = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeAdmins.length === 0) {
      return await prisma.notification.create({
        data: {
          title,
          message,
          type,
          channel,
          deliveryStatus,
          deliveryDetails,
          link,
          metadata,
          isRead: false,
        },
      });
    }

    const createdNotifications = [];
    for (const admin of activeAdmins) {
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
            projectId: projectId || null,
            title,
            message,
            type,
            channel,
            deliveryStatus,
            deliveryDetails,
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

/**
 * Automatically notify customer when their project status changes
 * Handles in-app notifications, email notifications, and optional SMS.
 * Prevents duplicate notifications if the status has not actually changed.
 */
export const notifyProjectStatusChange = async ({
  project,
  customer,
  previousStatus,
  newStatus,
  message = '',
  changedBy = null,
  progress = 0,
}) => {
  // Deduplication Rule: If status hasn't actually changed, skip dispatching duplicate notifications
  if (previousStatus && previousStatus.trim().toLowerCase() === newStatus.trim().toLowerCase()) {
    console.log(`[Notification Notice] Status unchanged (${newStatus}). Skipping duplicate notifications.`);
    return {
      duplicateSkipped: true,
      reason: 'Project status did not change',
      inApp: { success: true, status: 'skipped' },
      email: { success: true, status: 'skipped' },
      sms: { success: true, status: 'skipped' },
    };
  }

  const deliveryReport = {
    duplicateSkipped: false,
    inApp: { success: false, status: 'failed' },
    email: { success: false, status: 'failed' },
    sms: { success: false, status: 'not_configured' },
  };

  let notif = null;

  // 1. In-App Customer Notification
  if (customer?.id) {
    const type = newStatus === 'Completed' ? 'success' : newStatus === 'Cancelled' ? 'error' : 'info';
    const inAppTitle = `Project ${newStatus}: ${project.title}`;
    const inAppMessage = `Your project status has been updated to "${newStatus}".${message ? ` Note: ${message}` : ''}`;
    const inAppLink = `/my-projects?id=${project.id}`;

    notif = await createNotification({
      title: inAppTitle,
      message: inAppMessage,
      type,
      link: inAppLink,
      customerId: customer.id,
      projectId: project.id,
      channel: 'IN_APP',
      deliveryStatus: 'DELIVERED',
      metadata: {
        projectId: project.id,
        projectTitle: project.title,
        previousStatus: previousStatus || 'Initiated',
        newStatus,
        progress,
        message: message || '',
        changedById: changedBy?.id || null,
        changedByName: changedBy?.name || 'Administrator',
      },
    });

    deliveryReport.inApp = {
      success: Boolean(notif),
      status: notif ? 'DELIVERED' : 'FAILED',
      notificationId: notif?.id || null,
    };
  }

  // 2. Email Notification
  if (customer?.email) {
    const emailRes = await sendProjectStatusEmail({
      customer,
      project,
      previousStatus,
      newStatus,
      message,
      progress,
    });

    deliveryReport.email = emailRes;

    // Attach email delivery telemetry to the in-app notification record
    if (notif?.id) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          deliveryDetails: {
            inApp: 'DELIVERED',
            email: {
              recipient: customer.email,
              status: emailRes.status,
              messageId: emailRes.messageId || null,
              error: emailRes.error || null,
            },
          },
        },
      });
    }
  }

  // 3. SMS Notification (Optional Future Integration)
  if (customer?.phone) {
    const smsRes = await sendSMSNotification({
      to: customer.phone,
      customerName: customer.name,
      message: `Special Tech: Your project "${project.title}" is now ${newStatus}.${message ? ` Update: ${message}` : ''}`,
    });
    deliveryReport.sms = smsRes;

    if (smsRes.configured && customer?.id) {
      await prisma.notification.create({
        data: {
          customerId: customer.id,
          projectId: project.id,
          title: `SMS Notice: Project ${newStatus}`,
          message: `SMS dispatched to ${customer.phone}.`,
          type: smsRes.sent ? 'success' : 'info',
          channel: 'SMS',
          deliveryStatus: smsRes.status?.toUpperCase() || 'SENT',
          deliveryDetails: smsRes,
          link: `/my-projects?id=${project.id}`,
          isRead: true,
        },
      });
    }
  }

  return deliveryReport;
};
