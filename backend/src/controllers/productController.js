import prisma from '../config/db.js';
import {
  productSchema,
  demoRequestSchema,
  demoRequestStatusSchema,
} from '../validators/schemas.js';
import { notifyNewDemoRequest } from '../services/notification/notificationService.js';

// ==================== PRODUCTS ====================

export const getAllProducts = async (req, res, next) => {
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
        { name: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
        productImages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        productImages: {
          orderBy: { sortOrder: 'asc' },
        },
        productFeatures: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product && slug && slug.length === 36) {
      product = await prisma.product.findUnique({
        where: { id: slug },
        include: {
          plans: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          productImages: {
            orderBy: { sortOrder: 'asc' },
          },
          productFeatures: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Related products in the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
        isPublished: true,
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ success: true, data: { ...product, relatedProducts } });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
        productImages: {
          orderBy: { sortOrder: 'asc' },
        },
        productFeatures: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const validated = productSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A product with this slug already exists' });
    }

    const { plans = [], ...productInfo } = validated;

    const product = await prisma.product.create({
      data: {
        ...productInfo,
        plans: {
          create: plans.map((p, idx) => ({
            name: p.name,
            price: p.price,
            billingInterval: p.billingInterval || 'monthly',
            features: p.features || [],
            isPopular: p.isPopular || false,
            isActive: p.isActive ?? true,
            sortOrder: idx,
          })),
        },
      },
      include: { plans: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: { name: product.name, slug: product.slug },
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = productSchema.partial().parse(req.body);

    if (validated.slug) {
      const existing = await prisma.product.findFirst({
        where: { slug: validated.slug, id: { not: id } },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another product with this slug already exists' });
      }
    }

    const { plans, ...productInfo } = validated;

    // Transaction to update product and replace plans if provided
    const product = await prisma.$transaction(async (tx) => {
      if (plans && Array.isArray(plans)) {
        await tx.productPlan.deleteMany({ where: { productId: id } });
        await tx.productPlan.createMany({
          data: plans.map((p, idx) => ({
            productId: id,
            name: p.name,
            price: p.price,
            billingInterval: p.billingInterval || 'monthly',
            features: p.features || [],
            isPopular: p.isPopular || false,
            isActive: p.isActive ?? true,
            sortOrder: idx,
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data: productInfo,
        include: { plans: true },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PRODUCT_UPDATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: { name: product.name },
      },
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isPublished, isFeatured } = req.body;

    const data = {};
    if (status !== undefined) data.status = status;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PRODUCT_STATUS_UPDATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: { status: product.status, isPublished: product.isPublished, isFeatured: product.isFeatured },
      },
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PRODUCT_DELETED',
        entityType: 'PRODUCT',
        entityId: id,
        details: { name: product.name },
      },
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const uploadProductImage = async (req, res, next) => {
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

// ==================== DEMO REQUESTS ====================

export const createDemoRequest = async (req, res, next) => {
  try {
    const validated = demoRequestSchema.parse(req.body);

    let productName = validated.productName;
    if (validated.productId && !productName) {
      const prod = await prisma.product.findUnique({
        where: { id: validated.productId },
        select: { name: true },
      });
      if (prod) productName = prod.name;
    }

    const demoRequest = await prisma.productDemoRequest.create({
      data: {
        ...validated,
        productName,
      },
    });

    // Create an in-app notification for administrators
    await notifyNewDemoRequest(demoRequest);

    res.status(201).json({
      success: true,
      message: 'Demo request received successfully. Our solutions team will contact you shortly.',
      data: demoRequest,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllDemoRequests = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status && status !== 'All') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.productDemoRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, slug: true, category: true, logoUrl: true },
        },
      },
    });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
};

export const updateDemoRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = demoRequestStatusSchema.parse(req.body);

    const updateData = { status: validated.status };
    if (validated.internalNotes !== undefined) updateData.internalNotes = validated.internalNotes;
    if (validated.scheduledAt !== undefined) {
      updateData.scheduledAt = validated.scheduledAt ? new Date(validated.scheduledAt) : null;
    }

    const updated = await prisma.productDemoRequest.update({
      where: { id },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'DEMO_REQUEST_STATUS_UPDATED',
        entityType: 'DEMO_REQUEST',
        entityId: id,
        details: { status: updated.status, customer: updated.name },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteDemoRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.productDemoRequest.delete({ where: { id } });

    res.json({ success: true, message: 'Demo request removed successfully' });
  } catch (err) {
    next(err);
  }
};
