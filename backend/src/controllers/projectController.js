import prisma from '../config/db.js';
import { projectSchema } from '../validators/schemas.js';

export const getAllProjects = async (req, res, next) => {
  try {
    const { category, search, featured, publishedOnly = 'true' } = req.query;

    const where = {};
    if (publishedOnly === 'true') {
      where.isPublished = true;
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
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProjectBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const project = await prisma.project.findUnique({ where: { slug } });

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

    const project = await prisma.project.create({ data: validated });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        details: { title: project.title },
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

    const project = await prisma.project.update({
      where: { id },
      data: validated,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
