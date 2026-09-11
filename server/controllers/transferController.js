import Product from '../models/Product.js';
import Transfer from '../models/Transfer.js';
import StockTransaction from '../models/StockTransaction.js';
import Notification from '../models/Notification.js';
import { generateTransferNumber } from '../utils/codeGenerator.js';

// @desc    Get all transfers with optional filtering
// @route   GET /api/transfers
export const getTransfers = async (req, res, next) => {
  try {
    const { department, date, search, page, limit } = req.query;
    let query = {};

    if (department && department !== 'ALL') {
      query.department = { $regex: department, $options: 'i' };
    }
    if (date) query.date = date;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { indentNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Transfer.countDocuments(query);
    let transferQuery = Transfer.find(query).sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, parseInt(limit) || 10);
      transferQuery = transferQuery.skip((pageNum - 1) * pageSize).limit(pageSize);
      const transfers = await transferQuery;

      return res.json({
        success: true,
        count: transfers.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        transfers
      });
    }

    const transfers = await transferQuery;
    res.json({ success: true, count: transfers.length, total, transfers });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue stock transfer to department
// @route   POST /api/transfers
export const issueTransfer = async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      department,
      indentId,
      indentNumber,
      date,
      remarks
    } = req.body;

    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product and quantity are required.' });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Receiving department is required.' });
    }

    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ productCode: productId.toUpperCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (qty > product.currentQuantity) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Cannot transfer ${qty} units. Only ${product.currentQuantity} ${product.unit} available in stock.`
      });
    }

    const transferId = await generateTransferNumber();
    const previousQuantity = product.currentQuantity;
    const newQuantity = previousQuantity - qty;

    // Deduct stock
    product.currentQuantity = newQuantity;
    product.updatedBy = req.user ? req.user.name : 'Admin';
    await product.save();

    // Create Transfer record
    const transfer = await Transfer.create({
      transferId,
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName || product.name,
      stockRegister: product.stockRegister || 'SR1',
      quantity: qty,
      unit: product.unit || 'Pieces',
      department: department.trim(),
      indentId: indentId || null,
      indentNumber: indentNumber || '',
      date: date || new Date().toISOString().split('T')[0],
      recordedBy: req.user ? req.user.name : 'Admin',
      remarks: remarks || ''
    });

    // Create StockTransaction entry
    await StockTransaction.create({
      transactionId: transferId,
      transactionType: 'OUT',
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName || product.name,
      quantity: qty,
      previousQuantity,
      newQuantity,
      department: department.trim(),
      date: date || new Date().toISOString().split('T')[0],
      referenceId: transferId,
      recordedBy: req.user ? req.user.name : 'Admin',
      remarks: `Stock Issue to ${department.trim()}. ${remarks || ''}`
    });

    const minStock = product.minimumQuantity !== undefined ? product.minimumQuantity : product.minimumStockLevel;
    if (newQuantity <= minStock) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `Product "${product.productName || product.name}" (${product.productCode}) is down to ${newQuantity} ${product.unit} (Minimum: ${minStock}).`,
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: product.productCode
      }).catch(err => console.error(err));
    }

    res.status(201).json({
      success: true,
      message: `Successfully transferred ${qty} ${product.unit} to ${department}`,
      transfer,
      updatedProduct: product
    });
  } catch (error) {
    next(error);
  }
};
