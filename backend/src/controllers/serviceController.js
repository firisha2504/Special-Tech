import prisma from '../config/db.js';

export const getAllServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, count: services.length, data: services });
  } catch (err) {
    next(err);
  }
};

export const getServiceBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};
