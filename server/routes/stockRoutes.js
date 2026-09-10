import express from 'express';
import {
  handleIncomingStock,
  handleOutgoingStock,
  getStockHistory,
  getLowStockItems
} from '../controllers/stockController.js';
import { protect, requireStaffOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/incoming', protect, requireStaffOrAdmin, handleIncomingStock);
router.post('/outgoing', protect, requireStaffOrAdmin, handleOutgoingStock);
router.get('/history', protect, getStockHistory);
router.get('/low-stock', protect, getLowStockItems);

export default router;
