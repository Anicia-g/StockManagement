import express from 'express';
import {
  getIndents,
  getIndentById,
  createIndent,
  reviewIndent
} from '../controllers/indentController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getIndents);
router.get('/:id', verifyToken, getIndentById);
router.post('/', verifyToken, createIndent);
router.post('/:id/review', verifyToken, requireAdmin, reviewIndent);

export default router;
