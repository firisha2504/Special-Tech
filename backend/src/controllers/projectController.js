import prisma from '../config/db.js';
import { projectSchema } from '../validators/schemas.js';

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
      include: { projectImages: true },
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
      include: { projectImages: true },
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
    const { status, isPublished, isFeatured } = req.body;

    const data = {};
    if (status !== undefined) data.status = status;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_STATUS_UPDATED',
        entityType: 'PROJECT',
        entityId: project.id,
        details: { status: project.status, isPublished: project.isPublished, isFeatured: project.isFeatured },
      },
    });

    res.json({ success: true, data: project });
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
