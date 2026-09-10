import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Department from '../models/Department.js';
import Notification from '../models/Notification.js';

export const recordIncoming = async ({
  productId,
  quantity,
  date,
  remarks,
  user
}) => {
  const numQty = Number(quantity);
  if (!productId || isNaN(numQty) || numQty <= 0) {
    throw new Error('Valid product and positive quantity (> 0) are required.');
  }

  // Find product by ID or productCode
  let product = null;
  if (productId.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ productCode: productId.toUpperCase() });
  }

  if (!product) {
    throw new Error('Product not found.');
  }

  const previousQuantity = Number(product.currentQuantity) || 0;
  const newQuantity = previousQuantity + numQty;

  product.currentQuantity = newQuantity;
  product.updatedBy = user?.name || 'Staff';
  await product.save();

  const transaction = await StockTransaction.create({
    transactionId: `TXN-IN-${Date.now()}`,
    transactionType: 'IN',
    productId: product._id,
    productCode: product.productCode,
    productName: product.productName || product.name,
    quantity: numQty,
    previousQuantity,
    newQuantity,
    department: 'Store',
    date: date || new Date().toISOString().split('T')[0],
    remarks: remarks || 'Stock received',
    recordedBy: user?.name ? `${user.name} (${user.department || user.role})` : 'Store Keeper',
    recordedByUserId: user?._id || null
  });

  return {
    success: true,
    product,
    transaction,
    previousQuantity,
    addedQuantity: numQty,
    currentQuantity: newQuantity,
    stockStatus: product.stockStatus
  };
};

export const recordOutgoing = async ({
  productId,
  quantity,
  departmentId,
  department,
  indentDetailId,
  date,
  remarks,
  user
}) => {
  const numQty = Number(quantity);
  if (!productId || isNaN(numQty) || numQty <= 0) {
    throw new Error('Valid product and positive quantity (> 0) are required.');
  }

  // Find product
  let product = null;
  if (productId.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ productCode: productId.toUpperCase() });
  }

  if (!product) {
    throw new Error('Product not found.');
  }

  const previousQuantity = Number(product.currentQuantity) || 0;

  if (numQty > previousQuantity) {
    throw new Error(`Insufficient stock. Available: ${previousQuantity} ${product.unit}, Requested: ${numQty} ${product.unit}.`);
  }

  const newQuantity = previousQuantity - numQty;
  product.currentQuantity = newQuantity;
  product.updatedBy = user?.name || 'Staff';
  await product.save();

  // Resolve department
  let deptName = department || 'General Maintenance';
  let resolvedDeptId = null;

  if (departmentId) {
    if (departmentId.match(/^[0-9a-fA-F]{24}$/)) {
      const deptDoc = await Department.findById(departmentId);
      if (deptDoc) {
        deptName = deptDoc.name;
        resolvedDeptId = deptDoc._id;
      }
    } else {
      const deptDoc = await Department.findOne({
        $or: [{ name: departmentId }, { code: departmentId.toUpperCase() }]
      });
      if (deptDoc) {
        deptName = deptDoc.name;
        resolvedDeptId = deptDoc._id;
      }
    }
  }

  const transaction = await StockTransaction.create({
    transactionId: `TXN-OUT-${Date.now()}`,
    transactionType: 'OUT',
    productId: product._id,
    productCode: product.productCode,
    productName: product.productName || product.name,
    quantity: numQty,
    previousQuantity,
    newQuantity,
    departmentId: resolvedDeptId,
    department: deptName,
    indentDetailId: indentDetailId || null,
    date: date || new Date().toISOString().split('T')[0],
    remarks: remarks || `Issued to ${deptName}`,
    recordedBy: user?.name ? `${user.name} (${user.department || user.role})` : 'Store Keeper',
    recordedByUserId: user?._id || null
  });

  const minStock = product.minimumQuantity !== undefined ? product.minimumQuantity : product.minimumStockLevel;
  const isLowStock = newQuantity < minStock;

  if (isLowStock) {
    await Notification.create({
      title: 'Low Stock Alert',
      message: `Product "${product.productName || product.name}" (${product.productCode}) is down to ${newQuantity} ${product.unit} (Minimum: ${minStock}).`,
      type: 'LOW_STOCK',
      targetRole: 'ADMIN',
      referenceId: product.productCode
    }).catch(err => console.error('Notification error:', err));
  }

  return {
    success: true,
    product,
    transaction,
    previousQuantity,
    issuedQuantity: numQty,
    currentQuantity: newQuantity,
    isLowStock,
    stockStatus: isLowStock ? 'LOW_STOCK' : 'AVAILABLE'
  };
};
