import Department from '../models/Department.js';
import Category from '../models/Category.js';
import Unit from '../models/Unit.js';
import StockDocument from '../models/StockDocument.js';
import Product from '../models/Product.js';
import ProductDocumentReference from '../models/ProductDocumentReference.js';

// ==========================================
// Departments
// ==========================================
export const getDepartments = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const filter = { active: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const total = await Department.countDocuments(filter);
      const departments = await Department.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({
        success: true,
        count: departments.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        departments,
        data: departments
      });
    }

    const departments = await Department.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: departments.length,
      total: departments.length,
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

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = Boolean(active);

    const dept = await Department.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.json({ success: true, department: dept, data: dept });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Categories
// ==========================================
export const getCategories = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const filter = { active: true };

    if (search) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const total = await Category.countDocuments(filter);
      const categories = await Category.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({
        success: true,
        count: categories.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        categories,
        data: categories
      });
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: categories.length,
      total: categories.length,
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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Category "${trimmedName}" already exists.` });
    }

    const cat = await Category.create({
      name: trimmedName,
      description: description || ''
    });

    res.status(201).json({ success: true, category: cat, data: cat });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;
    const updates = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      const existing = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: `^${trimmedName}$`, $options: 'i' }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Another category named "${trimmedName}" already exists.` });
      }
      updates.name = trimmedName;
    }
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = Boolean(active);

    const cat = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, category: cat, data: cat });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Safe dependency check
    const productCount = await Product.countDocuments({
      $or: [{ category: cat.name }, { categoryId: cat._id }]
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${cat.name}". It is currently assigned to ${productCount} product(s). Please reassign or remove those products first.`
      });
    }

    await Category.findByIdAndDelete(id);
    res.json({ success: true, message: `Category "${cat.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Units
// ==========================================
export const getUnits = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const filter = { active: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { symbol: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const total = await Unit.countDocuments(filter);
      const units = await Unit.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({
        success: true,
        count: units.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        units,
        data: units
      });
    }

    const units = await Unit.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: units.length,
      total: units.length,
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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Unit name is required.' });
    }

    const trimmedName = name.trim();
    const existing = await Unit.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Unit "${trimmedName}" already exists.` });
    }

    const unit = await Unit.create({
      name: trimmedName,
      symbol: (symbol || '').trim()
    });

    res.status(201).json({ success: true, unit, data: unit });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, symbol, active } = req.body;
    const updates = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      const existing = await Unit.findOne({
        _id: { $ne: id },
        name: { $regex: `^${trimmedName}$`, $options: 'i' }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Another unit named "${trimmedName}" already exists.` });
      }
      updates.name = trimmedName;
    }
    if (symbol !== undefined) updates.symbol = symbol.trim();
    if (active !== undefined) updates.active = Boolean(active);

    const unit = await Unit.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }
    res.json({ success: true, unit, data: unit });
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    // Safe dependency check
    const productCount = await Product.countDocuments({
      $or: [{ unit: unit.name }, { unitId: unit._id }]
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete unit "${unit.name}". It is currently assigned to ${productCount} product(s). Please reassign those products first.`
      });
    }

    await Unit.findByIdAndDelete(id);
    res.json({ success: true, message: `Unit "${unit.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Stock Documents (Registers: CSSR1, SR1, SR2, SR3)
// ==========================================
export const getStockDocuments = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const filter = { active: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const total = await StockDocument.countDocuments(filter);
      const documents = await StockDocument.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({
        success: true,
        count: documents.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        documents,
        stockDocuments: documents,
        data: documents
      });
    }

    const documents = await StockDocument.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: documents.length,
      total: documents.length,
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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Stock document register code/name is required.' });
    }

    const trimmedName = name.trim().toUpperCase();
    const existing = await StockDocument.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Stock register "${trimmedName}" already exists.` });
    }

    const doc = await StockDocument.create({
      name: trimmedName,
      description: description || ''
    });

    res.status(201).json({ success: true, stockDocument: doc, data: doc });
  } catch (error) {
    next(error);
  }
};

export const updateStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;
    const updates = {};
    if (name !== undefined) {
      const trimmedName = name.trim().toUpperCase();
      const existing = await StockDocument.findOne({
        _id: { $ne: id },
        name: { $regex: `^${trimmedName}$`, $options: 'i' }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Another stock register named "${trimmedName}" already exists.` });
      }
      updates.name = trimmedName;
    }
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = Boolean(active);

    const doc = await StockDocument.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock register document not found.' });
    }
    res.json({ success: true, stockDocument: doc, data: doc });
  } catch (error) {
    next(error);
  }
};

export const deleteStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await StockDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock register document not found.' });
    }

    // Safe dependency check
    const productCount = await Product.countDocuments({
      $or: [
        { stockRegister: doc.name },
        { 'registerRefs.sheet': doc.name }
      ]
    });
    const refCount = await ProductDocumentReference.countDocuments({
      $or: [{ stockDocumentName: doc.name }, { stockDocumentId: doc._id }]
    });

    if (productCount > 0 || refCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stock register "${doc.name}". It is referenced by ${productCount || refCount} product record(s). Please update those product register page entries first.`
      });
    }

    await StockDocument.findByIdAndDelete(id);
    res.json({ success: true, message: `Stock register "${doc.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
};
