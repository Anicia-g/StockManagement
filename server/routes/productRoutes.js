import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductRemark
} from '../controllers/productController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.post('/', verifyToken, requireAdmin, createProduct);
router.put('/:id', verifyToken, requireAdmin, updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct);
router.post('/:id/remarks', verifyToken, addProductRemark);

export default router;
