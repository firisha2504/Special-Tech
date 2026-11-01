import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

/**
 * Customer Authentication Middleware
 * Enforces ownership and identity for the customer portal.
 */
export const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication token is required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'special_tech_secret_2026');

    if (!decoded.customerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid customer token',
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
      },
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer record not found or access revoked',
      });
    }

    req.customer = customer;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired customer session token',
      });
    }
    next(err);
  }
};
