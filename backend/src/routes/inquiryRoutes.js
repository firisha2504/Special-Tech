import { Router } from 'express';
import {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  downloadSpecificationPDF,
} from '../controllers/inquiryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Public submission
router.post('/submit', submitInquiry);

// Public or Customer PDF download
router.get('/:id/pdf', downloadSpecificationPDF);

// Admin Inquiries CRM (Strictly Admin Role Required)
router.get('/', authenticateToken, requireRole([Role.ADMIN]), getInquiries);
router.get('/:id', authenticateToken, requireRole([Role.ADMIN]), getInquiryById);
router.patch('/:id/status', authenticateToken, requireRole([Role.ADMIN]), updateInquiryStatus);

export default router;
