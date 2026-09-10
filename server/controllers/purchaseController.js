import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import StockTransaction from '../models/StockTransaction.js';
import Notification from '../models/Notification.js';

// @desc    Get all purchases with optional filtering
// @route   GET /api/purchases
export const getPurchases = async (req, res, next) => {
  try {
    const { supplier, date, search, page, limit } = req.query;
    let query = {};

    if (supplier) query.supplier = { $regex: supplier, $options: 'i' };
    if (date) query.date = date;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Purchase.countDocuments(query);
    let purchaseQuery = Purchase.find(query).sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, parseInt(limit) || 10);
      purchaseQuery = purchaseQuery.skip((pageNum - 1) * pageSize).limit(pageSize);
      const purchases = await purchaseQuery;

      return res.json({
        success: true,
        count: purchases.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        purchases
      });
    }

    const purchases = await purchaseQuery;
    res.json({ success: true, count: purchases.length, total, purchases });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new stock purchase / incoming stock
// @route   POST /api/purchases
export const recordPurchase = async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      supplier,
      invoiceNumber,
      unitPrice,
      date,
      remarks
    } = req.body;

    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product and quantity are required.' });
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

    const purchaseCount = await Purchase.countDocuments();
    const purchaseId = `PUR-${new Date().getFullYear()}-${String(purchaseCount + 1).padStart(3, '0')}`;
    const previousQuantity = product.currentQuantity;
    const newQuantity = previousQuantity + qty;

    // Update product stock
    product.currentQuantity = newQuantity;
    product.updatedBy = req.user ? req.user.name : 'Admin';
    await product.save();

    // Create Purchase record
    const purchase = await Purchase.create({
      purchaseId,
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName || product.name,
      stockRegister: product.stockRegister || 'SR1',
      quantity: qty,
      unit: product.unit || 'Pieces',
      supplier: supplier || 'Standard Electricals',
      invoiceNumber: invoiceNumber || '',
      unitPrice: Number(unitPrice) || 0,
      totalAmount: (Number(unitPrice) || 0) * qty,
      date: date || new Date().toISOString().split('T')[0],
      recordedBy: req.user ? req.user.name : 'Admin',
      remarks: remarks || ''
    });

    // Create StockTransaction entry
    await StockTransaction.create({
      transactionId: purchaseId,
      transactionType: 'IN',
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName || product.name,
      quantity: qty,
      previousQuantity,
      newQuantity,
      department: 'Store',
      date: date || new Date().toISOString().split('T')[0],
      referenceId: purchaseId,
      recordedBy: req.user ? req.user.name : 'Admin',
      remarks: `Purchase (${supplier || 'Supplier'}) - Invoice: ${invoiceNumber || 'N/A'}. ${remarks || ''}`
    });

    res.status(201).json({
      success: true,
      message: `Successfully purchased ${qty} ${product.unit} of ${product.productName || product.name}`,
      purchase,
      updatedProduct: product
    });
  } catch (error) {
    next(error);
  }
};
