import prisma from '../../config/db.js';
import {
  sendProjectStatusEmail,
  sendInquiryStatusEmail,
  maskEmail,
  getSMTPConfig,
} from '../email/emailService.js';
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
 * Automatically notify customer when their project inquiry status changes in the CRM
 */
export const notifyInquiryStatusChange = async ({
  inquiry,
  customer,
  previousStatus,
  newStatus,
  notes = '',
  changedBy = null,
  forceNotify = false,
}) => {
  if (!forceNotify && previousStatus && previousStatus.trim().toUpperCase() === newStatus.trim().toUpperCase()) {
    console.log(`[Notification Notice] Inquiry status unchanged (${newStatus}). Skipping duplicate notifications.`);
    return {
      duplicateSkipped: true,
      reason: 'Inquiry status did not change',
      inApp: { success: true, status: 'skipped' },
      email: { success: true, status: 'skipped' },
    };
  }

  const deliveryReport = {
    duplicateSkipped: false,
    inApp: { success: false, status: 'failed' },
    email: { success: false, status: 'failed' },
  };

  let notif = null;

  // 1. In-App Notification for customer
  if (customer?.id) {
    const type = newStatus === 'COMPLETED' ? 'success' : newStatus === 'CANCELLED' ? 'error' : 'info';
    notif = await createNotification({
      title: `Inquiry Status Updated: ${newStatus}`,
      message: `Your project inquiry #${inquiry.inquiryNumber} ("${inquiry.title}") is now "${newStatus}".${notes ? ` Note: ${notes}` : ''}`,
      type,
      link: `/admin?tab=inquiries&id=${inquiry.id}`,
      customerId: customer.id,
      channel: 'IN_APP',
      deliveryStatus: 'DELIVERED',
      metadata: {
        inquiryId: inquiry.id,
        inquiryNumber: inquiry.inquiryNumber,
        previousStatus: previousStatus || 'NEW',
        newStatus,
        notes: notes || '',
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

  // 2. Email Notification to Customer
  const activeSmtpConfig = await getSMTPConfig().catch(() => ({ providerName: 'Gmail SMTP' }));
  const activeProviderName = activeSmtpConfig?.providerName || 'Gmail SMTP';

  if (!customer) {
    deliveryReport.email = {
      success: false,
      status: 'Failed',
      provider: activeProviderName,
      error: 'Inquiry has no registered customer linked.',
      recipient: null,
      maskedRecipient: null,
    };
  } else if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    const errorMsg = 'Customer has no valid registered email address.';
    deliveryReport.email = {
      success: false,
      status: 'Failed',
      provider: activeProviderName,
      error: errorMsg,
      recipient: customer.email || null,
      maskedRecipient: customer.email ? maskEmail(customer.email) : null,
    };

    if (customer.id) {
      await prisma.notification.create({
        data: {
          customerId: customer.id,
          title: `Email: Inquiry ${newStatus} (Failed)`,
          message: `Email delivery to customer failed: ${errorMsg}`,
          type: 'inquiry_status_change',
          channel: 'EMAIL',
          deliveryStatus: 'FAILED',
          deliveryDetails: {
            customerId: customer.id,
            inquiryId: inquiry.id,
            inquiryNumber: inquiry.inquiryNumber,
            recipientEmail: customer.email || null,
            maskedRecipientEmail: customer.email ? maskEmail(customer.email) : null,
            notificationType: 'inquiry_status_change',
            previousStatus: previousStatus || 'NEW',
            newStatus,
            deliveryStatus: 'FAILED',
            provider: activeProviderName,
            providerMessageId: null,
            errorMessage: errorMsg,
            attemptAt: new Date().toISOString(),
          },
          link: `/admin?tab=inquiries&id=${inquiry.id}`,
          isRead: true,
        },
      });
    }
  } else {
    // Customer has a valid email address
    const emailRes = await sendInquiryStatusEmail({
      customer,
      inquiry,
      previousStatus,
      newStatus,
      notes,
    });

    deliveryReport.email = emailRes;

    const emailDeliveryStatus = emailRes.success ? 'SENT' : 'FAILED';
    const emailNotifRecord = await prisma.notification.create({
      data: {
        customerId: customer.id,
        title: `Email: Inquiry ${newStatus}`,
        message: emailRes.success
          ? `Status update email delivered to provider for ${emailRes.maskedRecipient || customer.email} (Inquiry #${inquiry.inquiryNumber}).`
          : `Status update email delivery failed for ${emailRes.maskedRecipient || customer.email}: ${emailRes.error}`,
        type: 'inquiry_status_change',
        channel: 'EMAIL',
        deliveryStatus: emailDeliveryStatus,
        deliveryDetails: {
          customerId: customer.id,
          inquiryId: inquiry.id,
          inquiryNumber: inquiry.inquiryNumber,
          recipientEmail: customer.email,
          maskedRecipientEmail: emailRes.maskedRecipient || maskEmail(customer.email),
          notificationType: 'inquiry_status_change',
          previousStatus: previousStatus || 'NEW',
          newStatus,
          deliveryStatus: emailDeliveryStatus,
          provider: emailRes.provider || activeProviderName,
          providerMessageId: emailRes.messageId || null,
          errorMessage: emailRes.error || null,
          attemptAt: new Date().toISOString(),
        },
        link: `/admin?tab=inquiries&id=${inquiry.id}`,
        metadata: {
          inquiryId: inquiry.id,
          inquiryNumber: inquiry.inquiryNumber,
          previousStatus,
          newStatus,
          notes: notes || '',
        },
        isRead: true,
      },
    });

    deliveryReport.email.notificationId = emailNotifRecord.id;

    if (notif?.id) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          deliveryDetails: {
            inApp: 'DELIVERED',
            email: {
              recipient: customer.email,
              maskedRecipient: emailRes.maskedRecipient || maskEmail(customer.email),
              status: emailDeliveryStatus,
              messageId: emailRes.messageId || null,
              error: emailRes.error || null,
              attemptAt: new Date().toISOString(),
              notificationId: emailNotifRecord.id,
            },
          },
        },
      });
    }
  }

  return deliveryReport;
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
  const activeSmtpConfig = await getSMTPConfig().catch(() => ({ providerName: 'Gmail SMTP' }));
  const activeProviderName = activeSmtpConfig?.providerName || 'Gmail SMTP';

  if (!customer) {
    deliveryReport.email = {
      success: false,
      status: 'Failed',
      provider: activeProviderName,
      error: 'Project has no registered customer associated with it.',
      recipient: null,
      maskedRecipient: null,
    };
  } else if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    const errorMsg = 'Customer has no valid registered email address.';
    deliveryReport.email = {
      success: false,
      status: 'Failed',
      provider: activeProviderName,
      error: errorMsg,
      recipient: customer.email || null,
      maskedRecipient: customer.email ? maskEmail(customer.email) : null,
    };

    if (customer.id) {
      await prisma.notification.create({
        data: {
          customerId: customer.id,
          projectId: project.id,
          title: `Email Notification: ${newStatus} (Failed)`,
          message: `Email delivery to customer failed: ${errorMsg}`,
          type: 'project_status_change',
          channel: 'EMAIL',
          deliveryStatus: 'FAILED',
          deliveryDetails: {
            customerId: customer.id,
            projectId: project.id,
            recipientEmail: customer.email || null,
            maskedRecipientEmail: customer.email ? maskEmail(customer.email) : null,
            notificationType: 'project_status_change',
            previousStatus: previousStatus || 'Initiated',
            newStatus,
            deliveryStatus: 'FAILED',
            provider: activeProviderName,
            providerMessageId: null,
            errorMessage: errorMsg,
            attemptAt: new Date().toISOString(),
          },
          link: `/my-projects?id=${project.id}`,
          isRead: true,
        },
      });
    }
  } else {
    // Customer has a valid email
    const emailRes = await sendProjectStatusEmail({
      customer,
      project,
      previousStatus,
      newStatus,
      message,
      progress,
    });

    deliveryReport.email = emailRes;

    const emailDeliveryStatus = emailRes.success ? 'SENT' : 'FAILED';
    const emailNotifRecord = await prisma.notification.create({
      data: {
        customerId: customer.id,
        projectId: project.id,
        title: `Email Notification: ${newStatus}`,
        message: emailRes.success
          ? `Status update email delivered to provider for ${emailRes.maskedRecipient || customer.email}.`
          : `Status update email delivery failed for ${emailRes.maskedRecipient || customer.email}: ${emailRes.error}`,
        type: 'project_status_change',
        channel: 'EMAIL',
        deliveryStatus: emailDeliveryStatus,
        deliveryDetails: {
          customerId: customer.id,
          projectId: project.id,
          recipientEmail: customer.email,
          maskedRecipientEmail: emailRes.maskedRecipient || maskEmail(customer.email),
          notificationType: 'project_status_change',
          previousStatus: previousStatus || 'Initiated',
          newStatus,
          deliveryStatus: emailDeliveryStatus,
          provider: emailRes.provider || activeProviderName,
          providerMessageId: emailRes.messageId || null,
          errorMessage: emailRes.error || null,
          attemptAt: new Date().toISOString(),
        },
        link: `/my-projects?id=${project.id}`,
        metadata: {
          projectId: project.id,
          previousStatus,
          newStatus,
          message: message || '',
        },
        isRead: true,
      },
    });

    deliveryReport.email.notificationId = emailNotifRecord.id;

    // Attach email delivery telemetry to the in-app notification record
    if (notif?.id) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          deliveryDetails: {
            inApp: 'DELIVERED',
            email: {
              recipient: customer.email,
              maskedRecipient: emailRes.maskedRecipient || maskEmail(customer.email),
              status: emailDeliveryStatus,
              messageId: emailRes.messageId || null,
              error: emailRes.error || null,
              attemptAt: new Date().toISOString(),
              notificationId: emailNotifRecord.id,
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
