import prisma from '../config/db.js';
import { projectSchema } from '../validators/schemas.js';
import { notifyProjectStatusChange } from '../services/notification/notificationService.js';
import { sendProjectStatusEmail, maskEmail } from '../services/email/emailService.js';

export const getAllProjects = async (req, res, next) => {
  try {
    const { category, search, featured, status, publishedOnly = 'true' } = req.query;

    const where = {};
    if (publishedOnly === 'true') {
      where.isPublished = true;
    }
    if (status && status !== 'All') {
      where.status = { equals: status, mode: 'insensitive' };
    }
    if (category && category !== 'All') {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true, phone: true },
        },
        statusHistory: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProjectBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let project = await prisma.project.findUnique({
      where: { slug },
      include: {
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project && slug && slug.length === 36) {
      project = await prisma.project.findUnique({
        where: { id: slug },
        include: {
          projectImages: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Related projects in the same category
    const relatedProjects = await prisma.project.findMany({
      where: {
        category: project.category,
        id: { not: project.id },
        isPublished: true,
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { ...project, relatedProjects } });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        },
        projectImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const validated = projectSchema.parse(req.body);
    const existing = await prisma.project.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A project with this slug already exists' });
    }

    const { completionDate, ...restData } = validated;
    const project = await prisma.project.create({
      data: {
        ...restData,
        completionDate: completionDate ? new Date(completionDate) : null,
      },
      include: { projectImages: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        details: { title: project.title, slug: project.slug },
      },
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = projectSchema.partial().parse(req.body);

    if (validated.slug) {
      const existing = await prisma.project.findFirst({
        where: { slug: validated.slug, id: { not: id } },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another project with this slug already exists' });
      }
    }

    const { completionDate, ...restData } = validated;
    const updateData = { ...restData };
    if (completionDate !== undefined) {
      updateData.completionDate = completionDate ? new Date(completionDate) : null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { projectImages: true, customer: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: project.id,
        details: { title: project.title },
      },
    });

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message, progress, customerId, isPublished, isFeatured } = req.body;

    const current = await prisma.project.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const previousStatus = current.status;
    const isStatusChanging = status && status.trim().toLowerCase() !== (current.status || '').trim().toLowerCase();

    const data = {};
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = Math.min(100, Math.max(0, Number(progress) || 0));
    if (customerId !== undefined) data.customerId = customerId || null;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        customer: true,
        projectImages: true,
      },
    });

    let historyRecord = null;
    let deliveryReport = {
      duplicateSkipped: !isStatusChanging,
      inApp: { success: true, status: isStatusChanging ? 'DELIVERED' : 'skipped' },
      email: { success: true, status: isStatusChanging ? 'sent' : 'skipped' },
      sms: { success: true, status: 'skipped' },
    };

    // If status changed, record status transition in ProjectStatusHistory & trigger notifications!
    if (isStatusChanging) {
      historyRecord = await prisma.projectStatusHistory.create({
        data: {
          projectId: project.id,
          customerId: project.customerId || null,
          changedById: req.user?.id || null,
          previousStatus,
          newStatus: status,
          message: message?.trim() || null,
        },
        include: {
          changedBy: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      });

      // Dispatch automatic multi-channel customer notifications
      deliveryReport = await notifyProjectStatusChange({
        project,
        customer: project.customer,
        previousStatus,
        newStatus: status,
        message: message?.trim() || '',
        changedBy: req.user,
        progress: project.progress,
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user?.id,
          action: 'PROJECT_STATUS_CHANGED',
          entityType: 'PROJECT',
          entityId: project.id,
          details: {
            previousStatus,
            newStatus: status,
            message: message?.trim() || null,
            progress: project.progress,
            customerId: project.customerId,
            delivery: deliveryReport,
          },
        },
      });
    } else {
      await prisma.activityLog.create({
        data: {
          userId: req.user?.id,
          action: 'PROJECT_UPDATED',
          entityType: 'PROJECT',
          entityId: project.id,
          details: { status: project.status, isPublished: project.isPublished, isFeatured: project.isFeatured },
        },
      });
    }

    res.json({
      success: true,
      statusChanged: isStatusChanging,
      message: isStatusChanging ? `Project status updated to ${status}` : 'Project updated successfully (status unchanged)',
      data: project,
      history: historyRecord,
      delivery: {
        ...deliveryReport,
        skipped: !isStatusChanging,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await prisma.projectStatusHistory.findMany({
      where: { projectId: id },
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_DELETED',
        entityType: 'PROJECT',
        entityId: id,
        details: { title: project.title },
      },
    });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const uploadProjectImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const retryProjectEmailNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, force = false } = req.body || {};

    const project = await prisma.project.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.customer) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send email: No registered customer is linked to this project.',
      });
    }

    if (!project.customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.customer.email.trim())) {
      return res.status(400).json({
        success: false,
        message: `Cannot send email: Customer "${project.customer.name}" does not have a valid registered email address.`,
      });
    }

    // Check duplicate prevention: Has an email already been successfully accepted for this status?
    if (!force) {
      const existingSuccess = await prisma.notification.findFirst({
        where: {
          projectId: project.id,
          channel: 'EMAIL',
          deliveryStatus: 'SENT',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (
        existingSuccess &&
        existingSuccess.deliveryDetails?.newStatus?.toLowerCase() === (project.status || '').toLowerCase()
      ) {
        return res.status(409).json({
          success: false,
          alreadyDelivered: true,
          message: `Email notification for status "${project.status}" was already accepted by email provider (Message ID: ${existingSuccess.deliveryDetails?.providerMessageId || 'Confirmed'}). Duplicate delivery prevented.`,
          delivery: {
            success: true,
            status: 'Already Sent',
            messageId: existingSuccess.deliveryDetails?.providerMessageId,
            maskedRecipient: existingSuccess.deliveryDetails?.maskedRecipientEmail || maskEmail(project.customer.email),
          },
        });
      }
    }

    // Retrieve latest status update message if not provided in body
    let updateMessage = message;
    if (updateMessage === undefined) {
      const latestHistory = await prisma.projectStatusHistory.findFirst({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
      });
      updateMessage = latestHistory?.message || '';
    }

    // Send email to customer
    const emailRes = await sendProjectStatusEmail({
      customer: project.customer,
      project,
      previousStatus: null,
      newStatus: project.status,
      message: updateMessage || '',
      progress: project.progress,
    });

    const emailDeliveryStatus = emailRes.success ? 'SENT' : 'FAILED';

    // Record notification attempt in the database
    const notifRecord = await prisma.notification.create({
      data: {
        customerId: project.customer.id,
        projectId: project.id,
        title: `Email Notification Retry: ${project.status}`,
        message: emailRes.success
          ? `Retry email accepted by provider for ${emailRes.maskedRecipient || project.customer.email}.`
          : `Retry email delivery failed for ${emailRes.maskedRecipient || project.customer.email}: ${emailRes.error}`,
        type: 'project_status_change',
        channel: 'EMAIL',
        deliveryStatus: emailDeliveryStatus,
        deliveryDetails: {
          customerId: project.customer.id,
          projectId: project.id,
          recipientEmail: project.customer.email,
          maskedRecipientEmail: emailRes.maskedRecipient || maskEmail(project.customer.email),
          notificationType: 'project_status_change_retry',
          previousStatus: null,
          newStatus: project.status,
          deliveryStatus: emailDeliveryStatus,
          provider: emailRes.provider || 'Resend SMTP',
          providerMessageId: emailRes.messageId || null,
          errorMessage: emailRes.error || null,
          isRetry: true,
          attemptAt: new Date().toISOString(),
        },
        link: `/my-projects?id=${project.id}`,
        isRead: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_EMAIL_RETRY',
        entityType: 'PROJECT',
        entityId: project.id,
        details: {
          status: project.status,
          success: emailRes.success,
          recipient: emailRes.maskedRecipient || maskEmail(project.customer.email),
          providerMessageId: emailRes.messageId || null,
          error: emailRes.error || null,
        },
      },
    });

    return res.json({
      success: emailRes.success,
      message: emailRes.success
        ? `Customer email successfully accepted by provider for ${emailRes.maskedRecipient || maskEmail(project.customer.email)}`
        : `Email delivery failed: ${emailRes.error}`,
      delivery: {
        ...emailRes,
        notificationId: notifRecord.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

