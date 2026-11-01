import { Router } from 'express';
import {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  downloadSpecificationPDF,
  retryInquiryEmailNotification,
} from '../controllers/inquiryController.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Public submission
router.post('/submit', submitInquiry);

// Public or Customer PDF download
router.get('/:id/pdf', downloadSpecificationPDF);

// Admin Inquiries CRM (Strictly Admin Role & manage_inquiries Permission Required)
router.get('/', authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_inquiries'), getInquiries);
router.get('/:id', authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_inquiries'), getInquiryById);
router.patch('/:id/status', authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_inquiries'), updateInquiryStatus);
router.post('/:id/retry-email', authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_inquiries'), retryInquiryEmailNotification);

export default router;
