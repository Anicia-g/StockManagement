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

  await syncProductLowStockNotification(product);

  const transaction = await StockTransaction.create({
    transactionId: `TXN-PUR-${Date.now()}`,
    transactionType: 'PURCHASE',
    productId: product._id,
    productCode: product.productCode,
    productName: product.productName || product.name,
    stockRegister: product.stockRegister || 'SR1',
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
    transactionId: `TXN-TRF-${Date.now()}`,
    transactionType: 'TRANSFER',
    productId: product._id,
    productCode: product.productCode,
    productName: product.productName || product.name,
    stockRegister: product.stockRegister || 'SR1',
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

  const minStock = product.minimumQuantity !== undefined ? product.minimumQuantity : (product.minimumStockLevel !== undefined ? product.minimumStockLevel : 5);
  const isLowStock = newQuantity <= minStock;

  await syncProductLowStockNotification(product);

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

/**
 * Synchronize product low-stock notification state in MongoDB:
 * - A product is LOW STOCK when: currentQuantity <= minimumQuantity
 * - When entering/in low stock: creates or updates a single active alert for ADMIN
 * - Prevents duplicate spam by maintaining one active alert per low-stock product
 * - When restocked (currentQuantity > minimumQuantity): marks existing active alert as resolved/read
 */
export const syncProductLowStockNotification = async (product) => {
  if (!product) return null;
  try {
    const minStock = product.minimumQuantity !== undefined
      ? product.minimumQuantity
      : (product.minimumStockLevel !== undefined ? product.minimumStockLevel : 5);
    const currentStock = Number(product.currentQuantity) || 0;
    const isLowStock = currentStock <= minStock;
    const prodName = product.productName || product.name || 'Product';
    const unit = product.unit || 'Pieces';

    if (isLowStock) {
      const message = `${prodName} is low in stock. Current quantity: ${currentStock} ${unit}. Minimum required: ${minStock} ${unit}.`;

      // Check for an existing active (unread) alert for this product
      const activeAlert = await Notification.findOne({
        type: 'LOW_STOCK',
        referenceId: product.productCode,
        isRead: false
      });

      if (activeAlert) {
        // Update the active alert's message and timestamp without creating duplicate
        activeAlert.message = message;
        activeAlert.title = 'Low Stock Alert';
        activeAlert.updatedAt = new Date();
        await activeAlert.save();
        return activeAlert;
      } else {
        // Create a single new active Low Stock notification for ADMIN
        return await Notification.create({
          title: 'Low Stock Alert',
          message,
          type: 'LOW_STOCK',
          targetRole: 'ADMIN',
          referenceId: product.productCode,
          isRead: false
        });
      }
    } else {
      // Stock is resolved (currentStock > minStock)
      // Resolve any active unread low-stock notifications for this product
      await Notification.updateMany(
        {
          type: 'LOW_STOCK',
          referenceId: product.productCode,
          isRead: false
        },
        {
          $set: {
            isRead: true,
            updatedAt: new Date()
          }
        }
      );
      return null;
    }
  } catch (error) {
    console.error('Error in syncProductLowStockNotification:', error);
    return null;
  }
};

