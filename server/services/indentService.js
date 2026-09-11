import Indent from '../models/Indent.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { recordOutgoing } from './stockService.js';
import { generateIndentNumber } from '../utils/codeGenerator.js';

export const createIndent = async ({
  indentNumber,
  requestingDepartment,
  department,
  purpose,
  requiredDate,
  remarks,
  items,
  user
}) => {
  const dept = requestingDepartment || department || user?.department || 'Maintenance Dept.';
  const genIndentNumber = indentNumber || await generateIndentNumber();

  // Process items
  const processedItems = [];
  for (const item of items) {
    let product = null;
    if (item.productId && String(item.productId).match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(item.productId);
    }
    if (!product && item.productCode) {
      product = await Product.findOne({ productCode: item.productCode.toUpperCase() });
    }

    if (!product) {
      throw new Error(`Product not found for code/ID: ${item.productCode || item.productId}`);
    }

    const qty = Number(item.quantityRequired || item.requestedQuantity || item.quantity);
    if (!qty || qty <= 0) {
      throw new Error(`Valid quantity is required for item ${product.productName || product.name}.`);
    }

    processedItems.push({
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName || product.name,
      stockRegister: product.stockRegister || 'SR1',
      unit: product.unit || 'Pieces',
      availableQuantityAtRequest: product.currentQuantity,
      quantityRequired: qty,
      requestedQuantity: qty,
      quantityRecommended: 0,
      quantityApproved: qty,
      approvedQuantity: qty,
      quantityIssued: 0,
      lineRemarks: item.lineRemarks || item.remarks || ''
    });
  }

  const indent = await Indent.create({
    indentNumber: genIndentNumber,
    requestDate: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
    requiredDate: requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    requestingDepartment: dept,
    department: dept,
    departmentId: user?.departmentId || null,
    requestedBy: user?.name ? `${user.name} (${user.role})` : 'Faculty / Staff',
    requesterName: user?.name || 'Staff',
    requesterId: user?._id || null,
    purpose: purpose || 'Departmental Consumables Requirement',
    remarks: remarks || '',
    status: 'SUBMITTED',
    items: processedItems
  });

  await Notification.create({
    title: 'New Indent Request Submitted',
    message: `Indent ${indent.indentNumber} submitted by ${dept} (${indent.items.length} items).`,
    type: 'INDENT_CREATED',
    targetRole: 'ADMIN',
    referenceId: indent.indentNumber
  }).catch(e => console.error(e));

  return indent;
};

export const submitIndent = async (indentId, user) => {
  const indent = await Indent.findById(indentId);
  if (!indent) throw new Error('Indent not found.');
  if (indent.status !== 'DRAFT') {
    throw new Error(`Cannot submit indent with status "${indent.status}". Must be DRAFT.`);
  }

  indent.status = 'SUBMITTED';
  await indent.save();
  return indent;
};

export const recommendIndent = async (indentId, { recommendedBy, recommendations, remarks }, user) => {
  const indent = await Indent.findById(indentId);
  if (!indent) throw new Error('Indent not found.');
  if (indent.status !== 'SUBMITTED') {
    throw new Error(`Cannot recommend indent with status "${indent.status}". Must be SUBMITTED.`);
  }

  indent.recommendedBy = recommendedBy || user?.name || 'HOD / Section Head';
  if (remarks) indent.remarks = `${indent.remarks ? indent.remarks + ' | ' : ''}Recommendation: ${remarks}`;

  if (Array.isArray(recommendations)) {
    recommendations.forEach(rec => {
      const item = indent.items.id(rec.itemId) || indent.items.find(i => String(i.productId) === String(rec.productId));
      if (item && rec.quantityRecommended !== undefined) {
        item.quantityRecommended = Number(rec.quantityRecommended);
      }
    });
  }

  indent.status = 'RECOMMENDED';
  await indent.save();
  return indent;
};

export const approveIndent = async (indentId, { approvedBy, approvals, remarks }, user) => {
  const indent = await Indent.findById(indentId);
  if (!indent) throw new Error('Indent not found.');

  indent.approvedBy = approvedBy || user?.name || 'Admin';
  indent.approvedAt = new Date();
  if (remarks) indent.adminRemarks = remarks;

  if (Array.isArray(approvals)) {
    approvals.forEach(app => {
      const item = indent.items.id(app.itemId) || indent.items.find(i => String(i.productId) === String(app.productId));
      if (item && (app.quantityApproved !== undefined || app.approvedQuantity !== undefined)) {
        const qty = Number(app.quantityApproved !== undefined ? app.quantityApproved : app.approvedQuantity);
        item.quantityApproved = qty;
        item.approvedQuantity = qty;
      }
    });
  } else {
    // If not specified line-by-line, approve requested/recommended quantity
    indent.items.forEach(item => {
      item.quantityApproved = item.quantityRecommended || item.quantityRequired;
      item.approvedQuantity = item.quantityApproved;
    });
  }

  indent.status = 'APPROVED';
  await indent.save();

  await Notification.create({
    title: 'Indent Approved',
    message: `Indent ${indent.indentNumber} has been approved by Admin.`,
    type: 'INDENT_STATUS',
    targetRole: 'FACULTY',
    targetUserId: indent.requesterId || null,
    referenceId: indent.indentNumber
  }).catch(e => console.error(e));

  return indent;
};

export const rejectIndent = async (indentId, { remarks }, user) => {
  const indent = await Indent.findById(indentId);
  if (!indent) throw new Error('Indent not found.');

  indent.status = 'REJECTED';
  if (remarks) indent.adminRemarks = remarks;
  await indent.save();

  await Notification.create({
    title: 'Indent Rejected',
    message: `Indent ${indent.indentNumber} was rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
    type: 'INDENT_STATUS',
    targetRole: 'FACULTY',
    targetUserId: indent.requesterId || null,
    referenceId: indent.indentNumber
  }).catch(e => console.error(e));

  return indent;
};

export const issueIndent = async (indentId, { issuedItems, remarks }, user) => {
  const indent = await Indent.findById(indentId);
  if (!indent) throw new Error('Indent not found.');

  if (!['APPROVED', 'PARTIALLY_ISSUED'].includes(indent.status)) {
    throw new Error(`Cannot issue stock for indent with status "${indent.status}". Indent must be APPROVED.`);
  }

  const transactions = [];
  const itemsToIssue = Array.isArray(issuedItems) ? issuedItems : indent.items.map(i => ({
    itemId: i._id,
    productId: i.productId,
    quantityToIssue: (i.quantityApproved || i.approvedQuantity || i.quantityRequired) - (i.quantityIssued || 0)
  }));

  for (const issueReq of itemsToIssue) {
    const item = indent.items.id(issueReq.itemId) || indent.items.find(i => String(i.productId) === String(issueReq.productId));
    if (!item) continue;

    const qtyToIssue = Number(issueReq.quantityToIssue || issueReq.quantity || issueReq.quantityIssued);
    if (qtyToIssue <= 0) continue;

    // Call stock outgoing service
    const stockResult = await recordOutgoing({
      productId: String(item.productId),
      quantity: qtyToIssue,
      department: indent.department || indent.requestingDepartment,
      indentDetailId: item._id,
      date: new Date().toISOString().split('T')[0],
      remarks: remarks || `Issued against Indent ${indent.indentNumber}`,
      user
    });

    item.quantityIssued = (item.quantityIssued || 0) + qtyToIssue;
    transactions.push(stockResult.transaction);
  }

  // Update indent status
  const allCompleted = indent.items.every(item => {
    const targetQty = item.quantityApproved || item.approvedQuantity || item.quantityRequired;
    return (item.quantityIssued || 0) >= targetQty;
  });

  const anyIssued = indent.items.some(item => (item.quantityIssued || 0) > 0);

  indent.status = allCompleted ? 'ISSUED' : anyIssued ? 'PARTIALLY_ISSUED' : 'APPROVED';
  await indent.save();

  return {
    success: true,
    indent,
    transactions,
    status: indent.status
  };
};
