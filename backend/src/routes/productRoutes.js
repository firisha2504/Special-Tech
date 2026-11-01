import { Router } from 'express';
import {
  getAllProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  uploadProductImage,
} from '../controllers/productController.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProductBySlug);

// Protected Admin Routes
router.use(authenticateToken, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), requirePermission('manage_services'));
router.get('/admin/detail/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/status', updateProductStatus);
router.delete('/:id', deleteProduct);
router.post('/upload', upload.single('image'), uploadProductImage);

export default router;
