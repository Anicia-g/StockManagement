import Department from '../models/Department.js';
import Category from '../models/Category.js';
import Unit from '../models/Unit.js';
import StockDocument from '../models/StockDocument.js';

// ==========================================
// Departments
// ==========================================
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: departments.length,
      departments,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required.' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || ''
    });

    res.status(201).json({ success: true, department: dept, data: dept });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Categories
// ==========================================
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: categories.length,
      categories,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const cat = await Category.create({
      name: name.trim(),
      description: description || ''
    });

    res.status(201).json({ success: true, category: cat, data: cat });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Units
// ==========================================
export const getUnits = async (req, res, next) => {
  try {
    const units = await Unit.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: units.length,
      units,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

export const createUnit = async (req, res, next) => {
  try {
    const { name, symbol } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Unit name is required.' });
    }

    const unit = await Unit.create({
      name: name.trim(),
      symbol: (symbol || '').trim()
    });

    res.status(201).json({ success: true, unit, data: unit });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Stock Documents (Registers: CSSR1, SR1, SR2, SR3)
// ==========================================
export const getStockDocuments = async (req, res, next) => {
  try {
    const documents = await StockDocument.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: documents.length,
      documents,
      stockDocuments: documents,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

export const createStockDocument = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Stock document register name is required.' });
    }

    const doc = await StockDocument.create({
      name: name.trim().toUpperCase(),
      description: description || ''
    });

    res.status(201).json({ success: true, stockDocument: doc, data: doc });
  } catch (error) {
    next(error);
  }
};
