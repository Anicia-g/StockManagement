import { Department, Category, Unit, StockDocument, Product, ProductDocumentReference } from '../models/index.js';
import { Op } from 'sequelize';

const mapWithId = (item) => {
  if (!item) return null;
  const raw = item.toJSON ? item.toJSON() : item;
  return {
    ...raw,
    _id: raw.id
  };
};

// ==========================================
// Departments
// ==========================================
export const getDepartments = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const where = { active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { code: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Department.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const departments = rows.map(mapWithId);
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

    const rows = await Department.findAll({ where, order: [['name', 'ASC']] });
    const departments = rows.map(mapWithId);
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
      description: description || '',
      active: true
    });

    const formatted = mapWithId(dept);
    res.status(201).json({ success: true, department: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, active } = req.body;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (name !== undefined) dept.name = name.trim();
    if (code !== undefined) dept.code = code.trim().toUpperCase();
    if (description !== undefined) dept.description = description;
    if (active !== undefined) dept.active = Boolean(active);

    await dept.save();
    const formatted = mapWithId(dept);
    res.json({ success: true, department: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    await dept.destroy();
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
    const where = { active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Category.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const categories = rows.map(mapWithId);
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

    const rows = await Category.findAll({ where, order: [['name', 'ASC']] });
    const categories = rows.map(mapWithId);
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
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const cat = await Category.create({
      name: name.trim(),
      description: description || '',
      active: true
    });

    const formatted = mapWithId(cat);
    res.status(201).json({ success: true, category: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;

    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name !== undefined) cat.name = name.trim();
    if (description !== undefined) cat.description = description;
    if (active !== undefined) cat.active = Boolean(active);

    await cat.save();
    const formatted = mapWithId(cat);
    res.json({ success: true, category: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    await cat.destroy();
    res.json({ success: true, message: 'Category deleted successfully.' });
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
    const where = { active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { symbol: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Unit.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const units = rows.map(mapWithId);
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

    const rows = await Unit.findAll({ where, order: [['name', 'ASC']] });
    const units = rows.map(mapWithId);
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
    const { name, symbol, description } = req.body;
    if (!name || !symbol) {
      return res.status(400).json({ success: false, message: 'Unit name and symbol are required.' });
    }

    const unit = await Unit.create({
      name: name.trim(),
      symbol: symbol.trim(),
      description: description || '',
      active: true
    });

    const formatted = mapWithId(unit);
    res.status(201).json({ success: true, unit: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, symbol, description, active } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    if (name !== undefined) unit.name = name.trim();
    if (symbol !== undefined) unit.symbol = symbol.trim();
    if (description !== undefined) unit.description = description;
    if (active !== undefined) unit.active = Boolean(active);

    await unit.save();
    const formatted = mapWithId(unit);
    res.json({ success: true, unit: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    await unit.destroy();
    res.json({ success: true, message: 'Unit deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Stock Documents / Registers
// ==========================================
export const getStockDocuments = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const where = { active: true };

    if (search) {
      where[Op.or] = [
        { document_code: { [Op.like]: `%${search.trim()}%` } },
        { document_name: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await StockDocument.findAndCountAll({
        where,
        order: [['document_code', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const documents = rows.map(doc => {
        const raw = mapWithId(doc);
        return {
          ...raw,
          name: raw.document_code || raw.document_name,
          code: raw.document_code,
          sheetName: raw.document_code
        };
      });

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

    const rows = await StockDocument.findAll({ where, order: [['document_code', 'ASC']] });
    const documents = rows.map(doc => {
      const raw = mapWithId(doc);
      return {
        ...raw,
        name: raw.document_code || raw.document_name,
        code: raw.document_code,
        sheetName: raw.document_code
      };
    });

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
    const { documentCode, code, name, documentName, description } = req.body;
    const resolvedCode = (documentCode || code || name || '').trim().toUpperCase();
    const resolvedName = (documentName || name || resolvedCode).trim();

    if (!resolvedCode) {
      return res.status(400).json({ success: false, message: 'Document code is required.' });
    }

    const doc = await StockDocument.create({
      document_code: resolvedCode,
      document_name: resolvedName,
      description: description || '',
      active: true
    });

    const formatted = {
      ...mapWithId(doc),
      name: doc.document_code,
      code: doc.document_code,
      sheetName: doc.document_code
    };

    res.status(201).json({ success: true, document: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentCode, code, documentName, name, description, active } = req.body;

    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    if (documentCode || code) doc.document_code = (documentCode || code).trim().toUpperCase();
    if (documentName || name) doc.document_name = (documentName || name).trim();
    if (description !== undefined) doc.description = description;
    if (active !== undefined) doc.active = Boolean(active);

    await doc.save();
    const formatted = {
      ...mapWithId(doc),
      name: doc.document_code,
      code: doc.document_code,
      sheetName: doc.document_code
    };

    res.json({ success: true, document: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const deleteStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    await doc.destroy();
    res.json({ success: true, message: 'Stock document deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
