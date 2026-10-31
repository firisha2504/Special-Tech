import prisma from '../config/db.js';
import { customerInquirySchema } from '../validators/schemas.js';
import { generateSpecificationPDF } from '../services/pdf/pdfService.js';
import { sendInquiryNotifications } from '../services/email/emailService.js';

export const submitInquiry = async (req, res, next) => {
  try {
    // Normalize payload to handle valid field aliases (e.g. fullName -> name, subject -> title)
    const payload = {
      ...req.body,
      name: req.body.name || req.body.fullName,
      title: req.body.title || req.body.subject || req.body.projectName,
    };

    const parsed = customerInquirySchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      const formattedMessage = fieldErrors.map((e) => `${e.field}: ${e.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: `Validation Error: ${formattedMessage}`,
        errors: fieldErrors,
      });
    }

    const data = parsed.data;

    // 1. Find or create Customer
    let customer = await prisma.customer.findUnique({ where: { email: data.email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: data.name,
          phone: data.phone || customer.phone,
          company: data.company || customer.company,
        },
      });
    }

    // 2. Generate unique Inquiry Number
    const count = await prisma.inquiry.count();
    let inquiryNumber = `ST-INQ-2026-${String(count + 1).padStart(4, '0')}`;
    const existingRef = await prisma.inquiry.findUnique({ where: { inquiryNumber } });
    if (existingRef) {
      inquiryNumber = `ST-INQ-2026-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Create Inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber,
        customerId: customer.id,
        title: data.title,
        message: data.message,
        budget: data.budget || null,
        preferredContact: data.preferredContact || 'Email',
        serviceId: data.serviceId || null,
        projectId: data.projectId || null,
        requirementId: data.requirementId || null,
        prototypeVersionId: data.prototypeVersionId || null,
      },
      include: {
        customer: true,
        requirement: true,
        prototypeVersion: true,
      },
    });

    // 4. Create Notification for Admin
    await prisma.notification.create({
      data: {
        title: 'New Customer Project Submission',
        message: `Inquiry ${inquiry.inquiryNumber} received from ${customer.name} (${customer.company || 'Individual'}).`,
        type: 'inquiry',
        link: `/admin/inquiries/${inquiry.id}`,
      },
    });

    // 5. Send Email Notifications
    await sendInquiryNotifications({ customer, inquiry, requirement: inquiry.requirement });

    res.status(201).json({
      success: true,
      message: 'Your project proposal has been submitted successfully to Special Tech!',
      inquiryNumber: inquiry.inquiryNumber,
      inquiryId: inquiry.id,
      data: inquiry,
    });
  } catch (err) {
    next(err);
  }
};

export const getInquiries = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { inquiryNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        requirement: { select: { id: true, projectName: true, version: true } },
        prototypeVersion: { select: { id: true, versionNumber: true, prototypeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    next(err);
  }
};

export const getInquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
        service: true,
        project: true,
        requirement: {
          include: {
            conversation: {
              include: {
                messages: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        },
        prototypeVersion: { include: { prototype: true } },
      },
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({ success: true, data: inquiry });
  } catch (err) {
    next(err);
  }
};

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, internalNotes, assignedToUserId, priority } = req.body;

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status: status || undefined,
        internalNotes: internalNotes !== undefined ? internalNotes : undefined,
        assignedToUserId: assignedToUserId || undefined,
        priority: priority || undefined,
      },
      include: { customer: true, assignedTo: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'INQUIRY_UPDATED',
        entityType: 'INQUIRY',
        entityId: id,
        details: { status, priority },
      },
    });

    res.json({ success: true, message: 'Inquiry updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

export const downloadSpecificationPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { customer: true, requirement: true },
    });

    if (!inquiry || !inquiry.requirement) {
      return res.status(404).json({ success: false, message: 'Specification not found for this inquiry' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inquiry.inquiryNumber}-specification.pdf"`);

    const pdfStream = generateSpecificationPDF(inquiry.requirement, inquiry.customer, inquiry);
    pdfStream.pipe(res);
  } catch (err) {
    next(err);
  }
};
