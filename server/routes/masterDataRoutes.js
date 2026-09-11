import express from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getStockDocuments,
  createStockDocument,
  updateStockDocument,
  deleteStockDocument
} from '../controllers/masterDataController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

export const departmentRouter = express.Router();
departmentRouter.get('/', protect, getDepartments);
departmentRouter.post('/', protect, requireAdmin, createDepartment);
departmentRouter.put('/:id', protect, requireAdmin, updateDepartment);
departmentRouter.delete('/:id', protect, requireAdmin, deleteDepartment);

export const categoryRouter = express.Router();
categoryRouter.get('/', protect, getCategories);
categoryRouter.post('/', protect, requireAdmin, createCategory);
categoryRouter.put('/:id', protect, requireAdmin, updateCategory);
categoryRouter.delete('/:id', protect, requireAdmin, deleteCategory);

export const unitRouter = express.Router();
unitRouter.get('/', protect, getUnits);
unitRouter.post('/', protect, requireAdmin, createUnit);
unitRouter.put('/:id', protect, requireAdmin, updateUnit);
unitRouter.delete('/:id', protect, requireAdmin, deleteUnit);

export const stockDocumentRouter = express.Router();
stockDocumentRouter.get('/', protect, getStockDocuments);
stockDocumentRouter.post('/', protect, requireAdmin, createStockDocument);
stockDocumentRouter.put('/:id', protect, requireAdmin, updateStockDocument);
stockDocumentRouter.delete('/:id', protect, requireAdmin, deleteStockDocument);

export default {
  departmentRouter,
  categoryRouter,
  unitRouter,
  stockDocumentRouter
};
