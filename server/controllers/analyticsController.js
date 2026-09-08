import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';
import StockHistory from '../models/StockHistory.js';

// @desc    Get dashboard summary cards and stats
// @route   GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Total Products & Current Stock
    const products = await Product.find({ status: 'ACTIVE' });
    const totalProducts = products.length;
    const currentStock = products.reduce((sum, p) => sum + p.currentQuantity, 0);
    const lowStockCount = products.filter(p => p.currentQuantity <= p.minimumStockLevel).length;

    // Pending Indents
    const pendingIndents = await Indent.countDocuments({ status: 'PENDING' });

    // Today's Purchases
    const todayPurchases = await Purchase.find({ date: todayStr });
    const todayPurchased = todayPurchases.reduce((sum, p) => sum + p.quantity, 0);

    // Today's Transfers
    const todayTransfers = await Transfer.find({ date: todayStr });
    const todayTransferred = todayTransfers.reduce((sum, t) => sum + t.quantity, 0);

    // Recent activity (latest 6 transactions)
    const recentActivity = await StockHistory.find().sort({ createdAt: -1 }).limit(6);

    // Low stock items list (top 5)
    const lowStockItems = products
      .filter(p => p.currentQuantity <= p.minimumStockLevel)
      .sort((a, b) => (a.currentQuantity - a.minimumStockLevel) - (b.currentQuantity - b.minimumStockLevel))
      .slice(0, 5);

    // Recent Indents
    let indentQuery = {};
    if (req.user.role !== 'ADMIN') {
      indentQuery = { requesterId: req.user._id };
    }
    const recentIndents = await Indent.find(indentQuery).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalProducts,
        currentStock,
        lowStockCount,
        pendingIndents,
        todayPurchased,
        todayTransferred
      },
      lowStockItems,
      recentActivity,
      recentIndents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive analytics data for Analytics page
// @route   GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { timeRange } = req.query; // 'TODAY', '7DAYS', 'MONTH', 'ALL'
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const products = await Product.find({ status: 'ACTIVE' });
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.currentQuantity, 0);
    const lowStockProducts = products.filter(p => p.currentQuantity <= p.minimumStockLevel);
    const criticalStockProducts = products.filter(p => p.currentQuantity <= Math.floor(p.minimumStockLevel / 2));

    // Category breakdown
    const categoryMap = {};
    products.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + p.currentQuantity;
    });
    const categoryDistribution = Object.keys(categoryMap).map(cat => ({
      name: cat,
      stock: categoryMap[cat]
    }));

    // Stock Register breakdown (SR1, SR2, SR3, CSSR1)
    const registerMap = { SR1: 0, SR2: 0, SR3: 0, CSSR1: 0 };
    products.forEach(p => {
      const reg = p.stockRegister || 'SR1';
      registerMap[reg] = (registerMap[reg] || 0) + p.currentQuantity;
    });
    const registerDistribution = Object.keys(registerMap).map(reg => ({
      name: reg,
      stock: registerMap[reg]
    }));

    // Purchases & Transfers aggregations
    const allPurchases = await Purchase.find();
    const allTransfers = await Transfer.find();

    const todayPurchased = allPurchases.filter(p => p.date === todayStr).reduce((s, p) => s + p.quantity, 0);
    const todayTransferred = allTransfers.filter(t => t.date === todayStr).reduce((s, t) => s + t.quantity, 0);

    // Calculate last 7 days vs month
    const past7Days = new Date(today);
    past7Days.setDate(past7Days.getDate() - 7);
    const past7DaysStr = past7Days.toISOString().split('T')[0];

    const weeklyPurchases = allPurchases.filter(p => p.date >= past7DaysStr).reduce((s, p) => s + p.quantity, 0);
    const weeklyTransfers = allTransfers.filter(t => t.date >= past7DaysStr).reduce((s, t) => s + t.quantity, 0);

    const firstOfMonthStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthlyPurchases = allPurchases.filter(p => p.date >= firstOfMonthStr).reduce((s, p) => s + p.quantity, 0);
    const monthlyTransfers = allTransfers.filter(t => t.date >= firstOfMonthStr).reduce((s, t) => s + t.quantity, 0);

    // Department-wise transfers
    const deptTransferMap = {};
    allTransfers.forEach(t => {
      deptTransferMap[t.department] = (deptTransferMap[t.department] || 0) + t.quantity;
    });
    const departmentTransfers = Object.keys(deptTransferMap).map(dept => ({
      department: dept,
      quantity: deptTransferMap[dept]
    })).sort((a, b) => b.quantity - a.quantity);

    // Monthly Trends for Chart (last 6 months or daily transactions)
    const trendMap = {};
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      trendMap[dStr] = { date: label, fullDate: dStr, purchases: 0, transfers: 0 };
    }

    allPurchases.forEach(p => {
      if (trendMap[p.date]) {
        trendMap[p.date].purchases += p.quantity;
      }
    });

    allTransfers.forEach(t => {
      if (trendMap[t.date]) {
        trendMap[t.date].transfers += t.quantity;
      }
    });

    const trends = Object.values(trendMap);

    // Indent status distribution
    const indents = await Indent.find();
    const indentStats = {
      pending: indents.filter(i => i.status === 'PENDING').length,
      approved: indents.filter(i => i.status === 'APPROVED' || i.status === 'PARTIALLY_APPROVED').length,
      completed: indents.filter(i => i.status === 'COMPLETED').length,
      rejected: indents.filter(i => i.status === 'REJECTED').length,
      total: indents.length
    };

    res.json({
      success: true,
      inventory: {
        totalProducts,
        totalStock,
        lowStockCount: lowStockProducts.length,
        criticalStockCount: criticalStockProducts.length,
        categoryDistribution,
        registerDistribution
      },
      purchases: {
        todayPurchased,
        weeklyPurchases,
        monthlyPurchases,
        totalPurchases: allPurchases.length
      },
      transfers: {
        todayTransferred,
        weeklyTransfers,
        monthlyTransfers,
        totalTransfers: allTransfers.length,
        departmentTransfers
      },
      indents: indentStats,
      trends
    });
  } catch (error) {
    next(error);
  }
};
