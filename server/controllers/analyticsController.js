import { Product, StockTransaction, Indent, IndentItem, Category, Purchase, Transfer, Department, User, StockDocument } from '../models/index.js';
import { formatProduct, formatStockTransaction, formatIndent } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get dashboard summary metrics and statistics
// @route   GET /api/dashboard & GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Core entity counts directly from MySQL
    const [
      totalProducts,
      totalCategories,
      totalPurchases,
      totalTransfers,
      pendingIndentCount
    ] = await Promise.all([
      Product.count({ where: { active: true } }),
      Category.count({ where: { active: true } }),
      Purchase.count(),
      Transfer.count(),
      Indent.count({ where: { status: { [Op.in]: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'RECOMMENDED'] } } })
    ]);

    const products = await Product.findAll({
      where: { active: true },
      include: ['category', 'unit', 'stockDocument', 'documentReferences']
    });

    const formattedProducts = products.map(formatProduct);
    const totalCurrentStock = formattedProducts.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0);

    const lowStockProducts = formattedProducts.filter(p => p.isLowStock);
    const lowStockCount = lowStockProducts.length;

    // Today's movement quantities
    const todayPurchases = await Purchase.findAll({ where: { purchase_date: todayStr } });
    const todayPurchased = todayPurchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const todayTransfersList = await Transfer.findAll({ where: { transfer_date: todayStr } });
    const todayTransferred = todayTransfersList.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    // Recent transactions (latest 10)
    const recentTransactionsRaw = await StockTransaction.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Department, as: 'department' },
        { model: User, as: 'recorder' }
      ],
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      limit: 10
    });
    const recentTransactions = recentTransactionsRaw.map(formatStockTransaction);

    // Faculty role-specific metrics
    let facultyStats = null;
    let indentWhere = {};
    if (req.user && req.user.role === 'FACULTY') {
      indentWhere = { requested_by: req.user.id };

      const [myTotalRequests, myPendingRequests, myApprovedRequests, myRejectedRequests] = await Promise.all([
        Indent.count({ where: indentWhere }),
        Indent.count({ where: { ...indentWhere, status: { [Op.in]: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'RECOMMENDED'] } } }),
        Indent.count({ where: { ...indentWhere, status: { [Op.in]: ['APPROVED', 'COMPLETED', 'ISSUED'] } } }),
        Indent.count({ where: { ...indentWhere, status: 'REJECTED' } })
      ]);

      facultyStats = {
        myTotalRequests,
        myPendingRequests,
        myApprovedRequests,
        myRejectedRequests,
        availableCatalogCount: totalProducts
      };
    }

    const recentIndentsRaw = await Indent.findAll({
      where: indentWhere,
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'requester' },
        { model: IndentItem, as: 'items', include: ['product'] }
      ],
      order: [['id', 'DESC']],
      limit: 5
    }).catch(() => []);
    const recentIndents = recentIndentsRaw.map(formatIndent);

    res.json({
      success: true,
      role: req.user?.role || 'FACULTY',
      totalProducts,
      totalCategories,
      totalCurrentStock,
      lowStockCount,
      totalPurchases,
      totalTransfers,
      pendingIndentCount,
      recentTransactions: req.user?.role === 'ADMIN' ? recentTransactions : [],
      recentActivity: req.user?.role === 'ADMIN' ? recentTransactions : [],
      lowStockProducts: req.user?.role === 'ADMIN' ? lowStockProducts : [],
      lowStockItems: req.user?.role === 'ADMIN' ? lowStockProducts.slice(0, 5) : [],
      recentIndents,
      facultyStats,
      stats: {
        totalProducts,
        totalCategories,
        currentStock: totalCurrentStock,
        totalCurrentStock,
        lowStockCount,
        purchases: totalPurchases,
        transfers: totalTransfers,
        totalPurchases,
        totalTransfers,
        pendingIndents: pendingIndentCount,
        pendingIndentCount,
        todayPurchased,
        todayTransferred
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics overview
// @route   GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { active: true },
      include: ['category', 'unit']
    });

    const purchases = await Purchase.findAll({
      include: ['product'],
      order: [['purchase_date', 'ASC']]
    });

    const transfers = await Transfer.findAll({
      include: ['product', 'department'],
      order: [['transfer_date', 'ASC']]
    });

    const indents = await Indent.findAll({
      include: ['department']
    });

    // Category Distribution
    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category?.name || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(p.current_quantity || 0);
    });

    const categoryDistribution = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name],
      stock: categoryMap[name]
    }));

    // Department transfers distribution
    const deptTransferMap = {};
    transfers.forEach(t => {
      const dept = t.department?.name || 'General';
      deptTransferMap[dept] = (deptTransferMap[dept] || 0) + Number(t.quantity || 0);
    });

    const departmentUsage = Object.keys(deptTransferMap).map(dept => ({
      department: dept,
      name: dept,
      quantity: deptTransferMap[dept],
      count: deptTransferMap[dept]
    }));

    // Monthly movements trend
    const movementMonths = {};
    purchases.forEach(p => {
      const month = p.purchase_date ? p.purchase_date.substring(0, 7) : '2026-09';
      if (!movementMonths[month]) movementMonths[month] = { month, purchases: 0, transfers: 0 };
      movementMonths[month].purchases += Number(p.quantity || 0);
    });
    transfers.forEach(t => {
      const month = t.transfer_date ? t.transfer_date.substring(0, 7) : '2026-09';
      if (!movementMonths[month]) movementMonths[month] = { month, purchases: 0, transfers: 0 };
      movementMonths[month].transfers += Number(t.quantity || 0);
    });

    const monthlyTrends = Object.values(movementMonths).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      totalProducts: products.length,
      totalPurchases: purchases.length,
      totalTransfers: transfers.length,
      totalIndents: indents.length,
      categoryDistribution,
      departmentUsage,
      monthlyTrends,
      data: {
        categoryDistribution,
        departmentUsage,
        monthlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};
