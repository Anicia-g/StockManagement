import Indent from '../models/Indent.js';
import Product from '../models/Product.js';
import Transfer from '../models/Transfer.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

// @desc    Get indents (Admin sees all; Faculty sees only their own)
// @route   GET /api/indents
export const getIndents = async (req, res, next) => {
  try {
    const { status, department, search, page, limit } = req.query;
    let query = {};

    // Role-based scoping
    if (req.user.role !== 'ADMIN') {
      query.$or = [
        { requesterId: req.user._id },
        { department: req.user.department }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (department && department !== 'ALL' && req.user.role === 'ADMIN') {
      query.department = { $regex: department, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { indentNumber: { $regex: search, $options: 'i' } },
        { requesterName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Indent.countDocuments(query);
    let indentQuery = Indent.find(query).sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, parseInt(limit) || 10);
      indentQuery = indentQuery.skip((pageNum - 1) * pageSize).limit(pageSize);
      const indents = await indentQuery;

      return res.json({
        success: true,
        count: indents.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        indents
      });
    }

    const indents = await indentQuery;
    res.json({ success: true, count: indents.length, total, indents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single indent by ID
// @route   GET /api/indents/:id
export const getIndentById = async (req, res, next) => {
  try {
    const indent = await Indent.findById(req.params.id);

    if (!indent) {
      // Try finding by indentNumber
      const indByNum = await Indent.findOne({ indentNumber: req.params.id.toUpperCase() });
      if (indByNum) {
        return res.json({ success: true, indent: indByNum });
      }
      return res.status(404).json({ success: false, message: 'Indent request not found' });
    }

    // Faculty can only view their own department's indent
    if (req.user.role !== 'ADMIN' && indent.department !== req.user.department && String(indent.requesterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this indent.' });
    }

    res.json({ success: true, indent });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an online indent (Faculty / Staff / Admin)
// @route   POST /api/indents
export const createIndent = async (req, res, next) => {
  try {
    const { purpose, requiredDate, items, remarks } = req.body;

    if (!purpose || !purpose.trim()) {
      return res.status(400).json({ success: false, message: 'Purpose of indent request is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product item must be included in the indent.' });
    }

    // Generate next sequential Indent Number (IND-2026-001, IND-2026-002, ...)
    const indentCount = await Indent.countDocuments();
    const indentNumber = `IND-2026-${String(indentCount + 1).padStart(3, '0')}`;

    // Verify products and build populated items list
    const populatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for item ID ${item.productId}` });
      }

      const reqQty = Number(item.requestedQuantity);
      if (isNaN(reqQty) || reqQty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity requested for ${product.name}` });
      }

      populatedItems.push({
        productId: product._id,
        productCode: product.productCode,
        productName: product.name,
        stockRegister: product.stockRegister || 'SR1',
        unit: product.unit || 'Pieces',
        availableQuantityAtRequest: product.currentQuantity,
        requestedQuantity: reqQty,
        approvedQuantity: 0,
        remarks: item.remarks || ''
      });
    }

    // IMPORTANT: Creating an indent does NOT decrease stock!
    const indent = await Indent.create({
      indentNumber,
      requesterId: req.user._id,
      requesterName: req.user.name,
      department: req.user.department || 'General Maintenance',
      purpose: purpose.trim(),
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: requiredDate || new Date().toISOString().split('T')[0],
      items: populatedItems,
      status: 'PENDING',
      adminRemarks: remarks || ''
    });

    // Notify Admin of new Indent submission
    await Notification.create({
      title: 'New Indent Request',
      message: `New indent ${indentNumber} raised by ${req.user.name} (${req.user.department}) for ${populatedItems.length} items.`,
      type: 'INDENT_CREATED',
      targetRole: 'ADMIN',
      referenceId: indentNumber
    });

    res.status(201).json({
      success: true,
      message: `Indent request ${indentNumber} submitted successfully and is pending admin review.`,
      indent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reviews, approves, rejects, or partially approves an indent
// @route   POST /api/indents/:id/review
export const reviewIndent = async (req, res, next) => {
  try {
    const indent = await Indent.findById(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent request not found.' });
    }

    if (indent.status === 'COMPLETED' || indent.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Indent is already ${indent.status} and cannot be modified.`
      });
    }

    const { action, approvedItems, adminRemarks } = req.body;
    // action: 'APPROVE', 'REJECT', 'PARTIALLY_APPROVE'

    if (action === 'REJECT') {
      indent.status = 'REJECTED';
      indent.adminRemarks = adminRemarks || 'Rejected by maintenance store';
      indent.approvedBy = req.user.name;
      indent.approvedAt = new Date();
      await indent.save();

      // Notify Requester
      await Notification.create({
        title: 'Indent Rejected',
        message: `Your indent request ${indent.indentNumber} was rejected by ${req.user.name}.`,
        type: 'INDENT_STATUS',
        targetRole: 'FACULTY',
        targetUserId: indent.requesterId,
        referenceId: indent.indentNumber
      });

      return res.json({
        success: true,
        message: `Indent ${indent.indentNumber} rejected.`,
        indent
      });
    }

    // Process item approvals & execute stock transfers
    let allFullApproved = true;
    let anyApproved = false;
    const transferDate = new Date().toISOString().split('T')[0];

    for (let i = 0; i < indent.items.length; i++) {
      const item = indent.items[i];
      // Find matching approved item quantity from payload
      const payloadItem = approvedItems?.find(
        (ai) => String(ai.productId) === String(item.productId) || ai.productCode === item.productCode
      );

      const approvedQty = payloadItem !== undefined ? Number(payloadItem.approvedQuantity) : item.requestedQuantity;

      if (approvedQty > 0) {
        anyApproved = true;
        const product = await Product.findById(item.productId);

        if (!product) {
          return res.status(404).json({ success: false, message: `Product ${item.productName} not found.` });
        }

        if (approvedQty > product.currentQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve ${approvedQty} units of ${product.name}. Only ${product.currentQuantity} units currently available in store.`
          });
        }

        // Deduct approved quantity from stock
        const prevQty = product.currentQuantity;
        const newQty = prevQty - approvedQty;
        product.currentQuantity = newQty;
        await product.save();

        // Create Transfer record
        const transferCount = await Transfer.countDocuments();
        const transferId = `TRF-2026-${String(transferCount + 1).padStart(3, '0')}`;

        await Transfer.create({
          transferId,
          productId: product._id,
          productCode: product.productCode,
          productName: product.name,
          stockRegister: product.stockRegister || 'SR1',
          quantity: approvedQty,
          unit: product.unit || 'Pieces',
          department: indent.department,
          indentId: indent._id,
          indentNumber: indent.indentNumber,
          issuedBy: req.user.name,
          date: transferDate,
          remarks: `Issued against Indent ${indent.indentNumber}`
        });

        // Create StockHistory transaction record (type: TRANSFER)
        const historyCount = await StockHistory.countDocuments();
        const transactionId = `TXN-2026-${String(historyCount + 1).padStart(3, '0')}`;

        await StockHistory.create({
          transactionId,
          date: transferDate,
          productId: product._id,
          productCode: product.productCode,
          productName: product.name,
          stockRegister: product.stockRegister || 'SR1',
          type: 'TRANSFER',
          quantity: approvedQty,
          previousQuantity: prevQty,
          newQuantity: newQty,
          department: indent.department,
          referenceId: indent.indentNumber,
          performedBy: req.user.name,
          remarks: `Fulfillment of Indent ${indent.indentNumber}`
        });

        // Check for Low Stock after transfer
        if (newQty <= product.minimumStockLevel) {
          await Notification.create({
            title: 'Low Stock Alert',
            message: `${product.name} (${product.productCode}) stock reached ${newQty} ${product.unit} following Indent ${indent.indentNumber} transfer.`,
            type: 'LOW_STOCK',
            targetRole: 'ADMIN',
            referenceId: product.productCode
          });
        }

        item.approvedQuantity = approvedQty;
        if (approvedQty < item.requestedQuantity) {
          allFullApproved = false;
        }
      } else {
        item.approvedQuantity = 0;
        allFullApproved = false;
      }
    }

    if (!anyApproved) {
      indent.status = 'REJECTED';
    } else if (allFullApproved) {
      indent.status = 'COMPLETED';
    } else {
      indent.status = 'PARTIALLY_APPROVED';
    }

    indent.adminRemarks = adminRemarks || 'Processed and stock issued by Store';
    indent.approvedBy = req.user.name;
    indent.approvedAt = new Date();
    await indent.save();

    // Notify Requester
    await Notification.create({
      title: `Indent ${indent.status === 'COMPLETED' ? 'Approved & Issued' : 'Partially Approved'}`,
      message: `Your indent request ${indent.indentNumber} has been approved by ${req.user.name}. Stock has been issued to ${indent.department}.`,
      type: 'INDENT_STATUS',
      targetRole: 'FACULTY',
      targetUserId: indent.requesterId,
      referenceId: indent.indentNumber
    });

    res.json({
      success: true,
      message: `Indent ${indent.indentNumber} processed successfully. Status: ${indent.status}. Stock issued.`,
      indent
    });
  } catch (error) {
    next(error);
  }
};
