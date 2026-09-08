import Product from '../models/Product.js';
import Transfer from '../models/Transfer.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

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

// @desc    Issue stock transfer to department (Admin only)
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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Validation: cannot transfer more than available stock
    if (qty > product.currentQuantity) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Cannot transfer ${qty} units. Only ${product.currentQuantity} ${product.unit} available in stock.`
      });
    }

    const transferCount = await Transfer.countDocuments();
    const transferId = `TRF-2026-${String(transferCount + 1).padStart(3, '0')}`;
    const previousQuantity = product.currentQuantity;
    const newQuantity = previousQuantity - qty;

    // Deduct stock
    product.currentQuantity = newQuantity;
    await product.save();

    // Create Transfer record
    const transfer = await Transfer.create({
      transferId,
      productId: product._id,
      productCode: product.productCode,
      productName: product.name,
      stockRegister: product.stockRegister || 'SR1',
      quantity: qty,
      unit: product.unit || 'Pieces',
      department: department.trim(),
      indentId: indentId || null,
      indentNumber: indentNumber || null,
      issuedBy: req.user ? req.user.name : 'Admin',
      date: date || new Date().toISOString().split('T')[0],
      remarks: remarks || ''
    });

    // Create StockHistory transaction record (type: TRANSFER)
    const historyCount = await StockHistory.countDocuments();
    const transactionId = `TXN-2026-${String(historyCount + 1).padStart(3, '0')}`;

    await StockHistory.create({
      transactionId,
      date: date || new Date().toISOString().split('T')[0],
      productId: product._id,
      productCode: product.productCode,
      productName: product.name,
      stockRegister: product.stockRegister || 'SR1',
      type: 'TRANSFER',
      quantity: qty,
      previousQuantity,
      newQuantity,
      department: department.trim(),
      referenceId: indentNumber || transferId,
      performedBy: req.user ? req.user.name : 'Admin',
      remarks: remarks || `Transferred to ${department.trim()}`
    });

    // Trigger Low Stock Notification if newQuantity <= minStock
    if (newQuantity <= product.minimumStockLevel) {
      const isCritical = newQuantity <= Math.floor(product.minimumStockLevel / 2);
      await Notification.create({
        title: isCritical ? 'Critical Low Stock Alert' : 'Low Stock Warning',
        message: `${product.name} (${product.productCode}) is at ${newQuantity} ${product.unit} (Minimum required: ${product.minimumStockLevel}).`,
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: product.productCode
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully transferred ${qty} ${product.unit} of ${product.name} to ${department}. Remaining stock: ${newQuantity}.`,
      transfer,
      product: {
        id: product._id,
        name: product.name,
        previousQuantity,
        transferredQuantity: qty,
        newQuantity,
        isLowStock: newQuantity <= product.minimumStockLevel
      }
    });
  } catch (error) {
    next(error);
  }
};
