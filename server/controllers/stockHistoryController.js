import { StockTransaction, Product, Department, User, StockDocument } from '../models/index.js';
import { formatStockTransaction } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get stock history transactions with filters
// @route   GET /api/history & GET /api/stock-history
export const getStockHistory = async (req, res, next) => {
  try {
    const {
      type,
      transactionType,
      department,
      date,
      fromDate,
      toDate,
      search,
      register,
      stockRegister,
      page,
      limit
    } = req.query;

    const where = {};

    const resolvedType = transactionType || type;
    if (resolvedType && resolvedType !== 'ALL') {
      if (resolvedType === 'IN' || resolvedType === 'PURCHASE') {
        where.transaction_type = 'PURCHASE';
      } else if (resolvedType === 'OUT' || resolvedType === 'TRANSFER') {
        where.transaction_type = 'TRANSFER';
      } else {
        where.transaction_type = resolvedType;
      }
    }

    const resolvedRegister = register || stockRegister;
    if (resolvedRegister && resolvedRegister !== 'ALL') {
      where['$product.stockDocument.document_code$'] = resolvedRegister;
    }

    if (department && department !== 'ALL') {
      where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
    }

    if (fromDate || toDate) {
      where.transaction_date = {};
      if (fromDate) where.transaction_date[Op.gte] = new Date(fromDate);
      if (toDate) where.transaction_date[Op.lte] = new Date(toDate + ' 23:59:59');
    } else if (date) {
      where.transaction_date = {
        [Op.gte]: new Date(date + ' 00:00:00'),
        [Op.lte]: new Date(date + ' 23:59:59')
      };
    }

    if (search) {
      where[Op.or] = [
        { transaction_code: { [Op.like]: `%${search.trim()}%` } },
        { remarks: { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_name$': { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_code$': { [Op.like]: `%${search.trim()}%` } },
        { '$department.name$': { [Op.like]: `%${search.trim()}%` } },
        { '$recorder.name$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const include = [
      {
        model: Product,
        as: 'product',
        include: [{ model: StockDocument, as: 'stockDocument' }]
      },
      { model: Department, as: 'department' },
      { model: User, as: 'recorder' }
    ];

    const [totalPurchases, totalTransfers] = await Promise.all([
      StockTransaction.count({ where: { transaction_type: 'PURCHASE' } }),
      StockTransaction.count({ where: { transaction_type: 'TRANSFER' } })
    ]);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);

    const { count: total, rows } = await StockTransaction.findAndCountAll({
      where,
      include,
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true
    });

    const formatted = rows.map(formatStockTransaction);

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
