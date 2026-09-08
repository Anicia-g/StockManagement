import StockHistory from '../models/StockHistory.js';

// @desc    Get stock history transactions with filters
// @route   GET /api/history
export const getStockHistory = async (req, res, next) => {
  try {
    const { type, department, date, search, register, page, limit } = req.query;
    let query = {};

    if (type && type !== 'ALL') {
      query.type = type;
    }

    if (department && department !== 'ALL') {
      query.department = { $regex: department, $options: 'i' };
    }

    if (date) {
      query.date = date;
    }

    if (register && register !== 'ALL') {
      query.stockRegister = register;
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await StockHistory.countDocuments(query);
    let historyQuery = StockHistory.find(query).sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, parseInt(limit) || 10);
      historyQuery = historyQuery.skip((pageNum - 1) * pageSize).limit(pageSize);
      const transactions = await historyQuery;

      return res.json({
        success: true,
        count: transactions.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        transactions,
        history: transactions
      });
    }

    const transactions = await historyQuery;

    res.json({
      success: true,
      count: transactions.length,
      total,
      transactions,
      history: transactions
    });
  } catch (error) {
    next(error);
  }
};
