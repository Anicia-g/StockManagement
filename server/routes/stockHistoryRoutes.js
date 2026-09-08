import express from 'express';
import { getStockHistory } from '../controllers/stockHistoryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getStockHistory);

export default router;
