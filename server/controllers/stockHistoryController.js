import StockTransaction from '../models/StockTransaction.js';

// @desc    Get stock history transactions with filters
// @route   GET /api/history
export const getStockHistory = async (req, res, next) => {
  try {
    const { type, transactionType, department, date, fromDate, toDate, search, register, stockRegister, page, limit } = req.query;
    let query = {};

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

    const resolvedRegister = register || stockRegister;
    if (resolvedRegister && resolvedRegister !== 'ALL') {
      query.stockRegister = resolvedRegister;
    }

    if (department && department !== 'ALL') {
      query.department = { $regex: department, $options: 'i' };
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    } else if (date) {
      query.date = date;
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { recordedBy: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const [total, totalPurchases, totalTransfers] = await Promise.all([
      StockTransaction.countDocuments(query),
      StockTransaction.countDocuments({ ...query, transactionType: { $in: ['PURCHASE', 'IN'] } }),
      StockTransaction.countDocuments({ ...query, transactionType: { $in: ['TRANSFER', 'OUT'] } })
    ]);

    let historyQuery = StockTransaction.find(query).sort({ createdAt: -1, date: -1 });

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, parseInt(limit) || 20);
    historyQuery = historyQuery.skip((pageNum - 1) * pageSize).limit(pageSize);
    const rawTransactions = await historyQuery;

    const formatted = rawTransactions.map(t => {
      const isPurchase = t.transactionType === 'IN' || t.transactionType === 'PURCHASE';
      return {
        id: t._id,
        _id: t._id,
        transactionId: t.transactionId,
        date: t.date,
        productId: t.productId,
        productCode: t.productCode,
        productName: t.productName,
        stockRegister: t.stockRegister || 'SR1',
        type: isPurchase ? 'PURCHASE' : 'TRANSFER',
        transactionType: isPurchase ? 'PURCHASE' : 'TRANSFER',
        typeLabel: isPurchase ? 'Purchase' : 'Transfer',
        quantity: Math.abs(t.quantity || 0),
        previousQuantity: t.previousQuantity,
        newQuantity: t.newQuantity,
        department: t.department || 'Store',
        remarks: t.remarks || '',
        recordedBy: t.recordedBy || 'Admin',
        performedBy: t.recordedBy || 'Admin',
        referenceId: t.referenceId || t.transactionId
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      total,
      totalPurchases,
      totalTransfers,
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
