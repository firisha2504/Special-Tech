import { Router } from 'express';
import {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  downloadSpecificationPDF,
} from '../controllers/inquiryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public submission
router.post('/submit', submitInquiry);

// Public or Customer PDF download
router.get('/:id/pdf', downloadSpecificationPDF);

// Admin Inquiries CRM
router.get('/', authenticateToken, getInquiries);
router.get('/:id', authenticateToken, getInquiryById);
router.patch('/:id/status', authenticateToken, updateInquiryStatus);

export default router;
