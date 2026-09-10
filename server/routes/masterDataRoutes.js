import express from 'express';
import {
  getDepartments,
  createDepartment,
  getCategories,
  createCategory,
  getUnits,
  createUnit,
  getStockDocuments,
  createStockDocument
} from '../controllers/masterDataController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

export const departmentRouter = express.Router();
departmentRouter.get('/', protect, getDepartments);
departmentRouter.post('/', protect, requireAdmin, createDepartment);

export const categoryRouter = express.Router();
categoryRouter.get('/', protect, getCategories);
categoryRouter.post('/', protect, requireAdmin, createCategory);

export const unitRouter = express.Router();
unitRouter.get('/', protect, getUnits);
unitRouter.post('/', protect, requireAdmin, createUnit);

export const stockDocumentRouter = express.Router();
stockDocumentRouter.get('/', protect, getStockDocuments);
stockDocumentRouter.post('/', protect, requireAdmin, createStockDocument);

export default {
  departmentRouter,
  categoryRouter,
  unitRouter,
  stockDocumentRouter
};
