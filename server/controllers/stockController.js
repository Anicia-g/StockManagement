import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import { recordIncoming, recordOutgoing } from '../services/stockService.js';

// @desc    Record incoming stock (Stock IN)
// @route   POST /api/stock/incoming
export const handleIncomingStock = async (req, res, next) => {
  try {
    const { productId, quantity, date, remarks } = req.body;
    const result = await recordIncoming({
      productId,
      quantity,
      date,
      remarks,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Stock updated successfully. Added ${result.addedQuantity} units for ${result.product.productName || result.product.name}.`,
      data: result,
      transaction: result.transaction,
      product: result.product,
      previousQuantity: result.previousQuantity,
      addedQuantity: result.addedQuantity,
      currentQuantity: result.currentQuantity,
      newStock: result.currentQuantity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record outgoing stock (Stock OUT)
// @route   POST /api/stock/outgoing
export const handleOutgoingStock = async (req, res, next) => {
  try {
    const { productId, quantity, departmentId, department, indentDetailId, date, remarks } = req.body;
    const result = await recordOutgoing({
      productId,
      quantity,
      departmentId,
      department,
      indentDetailId,
      date,
      remarks,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Stock issued successfully. Issued ${result.issuedQuantity} units of ${result.product.productName || result.product.name}.`,
      data: result,
      transaction: result.transaction,
      product: result.product,
      previousQuantity: result.previousQuantity,
      issuedQuantity: result.issuedQuantity,
      currentQuantity: result.currentQuantity,
      newStock: result.currentQuantity,
      isLowStock: result.isLowStock,
      stockStatus: result.stockStatus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stock transaction history with filters
// @route   GET /api/stock/history
export const getStockHistory = async (req, res, next) => {
  try {
    const {
      productId,
      departmentId,
      department,
      transactionType,
      type,
      fromDate,
      toDate,
      search,
      page,
      limit
    } = req.query;

    let query = {};

    if (productId) {
      if (productId.match(/^[0-9a-fA-F]{24}$/)) {
        query.productId = productId;
      } else {
        query.productCode = productId.toUpperCase();
      }
    }

    if (departmentId) {
      query.departmentId = departmentId;
    } else if (department && department !== 'ALL') {
      query.department = { $regex: department, $options: 'i' };
    }

    const resolvedType = transactionType || type;
    if (resolvedType && resolvedType !== 'ALL') {
      if (resolvedType === 'IN' || resolvedType === 'PURCHASE') {
        query.transactionType = { $in: ['IN', 'PURCHASE'] };
      } else if (resolvedType === 'OUT' || resolvedType === 'TRANSFER') {
        query.transactionType = { $in: ['OUT', 'TRANSFER'] };
      } else {
        query.transactionType = resolvedType;
      }
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { recordedBy: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, parseInt(limit) || 50);
    const skip = (pageNum - 1) * pageSize;

    const total = await StockTransaction.countDocuments(query);
    const transactions = await StockTransaction.find(query)
      .sort({ createdAt: -1, date: -1 })
      .skip(skip)
      .limit(pageSize);

    // Format for frontend
    const formatted = transactions.map(t => ({
      id: t._id,
      _id: t._id,
      transactionId: t.transactionId,
      date: t.date,
      productId: t.productId,
      productCode: t.productCode,
      productName: t.productName,
      type: t.transactionType === 'IN' || t.transactionType === 'PURCHASE' ? 'IN' : 'OUT',
      transactionType: t.transactionType,
      quantity: t.quantity,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      department: t.department,
      remarks: t.remarks,
      recordedBy: t.recordedBy,
      performedBy: t.recordedBy,
      referenceId: t.referenceId || t.transactionId
    }));

    res.json({
      success: true,
      count: formatted.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      limit: pageSize,
      transactions: formatted,
      history: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock items
// @route   GET /api/stock/low-stock
export const getLowStockItems = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true });

    const lowStockList = [];
    for (const p of products) {
      const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
      if (p.currentQuantity <= min) {
        lowStockList.push({
          id: p._id,
          _id: p._id,
          productCode: p.productCode,
          productName: p.productName || p.name,
          name: p.productName || p.name,
          category: p.category,
          unit: p.unit,
          currentQuantity: p.currentQuantity,
          currentStock: p.currentQuantity,
          minimumQuantity: min,
          minStock: min,
          minimumStockLevel: min,
          difference: p.currentQuantity - min,
          status: 'LOW_STOCK',
          stockStatus: 'LOW_STOCK',
          stockRegister: p.stockRegister,
          pageNumber: p.pageNumber,
          registerRefs: p.registerRefs
        });
      }
    }

    res.json({
      success: true,
      count: lowStockList.length,
      total: lowStockList.length,
      lowStockItems: lowStockList,
      products: lowStockList,
      data: lowStockList
    });
  } catch (error) {
    next(error);
  }
};
