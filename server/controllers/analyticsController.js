import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Indent from '../models/Indent.js';
import StockDocument from '../models/StockDocument.js';

// @desc    Get dashboard summary metrics and statistics
// @route   GET /api/dashboard & GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Total Products & Current Stock
    const products = await Product.find({ active: { $ne: false } });
    const totalProducts = products.length;
    const totalCurrentStock = products.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0);

    const lowStockProducts = products
      .filter(p => {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
        return (Number(p.currentQuantity) || 0) <= min;
      })
      .map(p => {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
        return {
          id: p._id,
          _id: p._id,
          productCode: p.productCode,
          productName: p.productName || p.name,
          name: p.productName || p.name,
          category: p.category,
          unit: p.unit,
          currentQuantity: p.currentQuantity,
          currentStock: p.currentQuantity,
          minimumQuantity: min,
          minStock: min,
          difference: p.currentQuantity - min,
          status: 'LOW_STOCK',
          stockStatus: 'LOW_STOCK',
          stockRegister: p.stockRegister,
          pageNumber: p.pageNumber,
          registerRefs: p.registerRefs
        };
      });

    const lowStockCount = lowStockProducts.length;

    // Pending Indents (status SUBMITTED, PENDING, or RECOMMENDED)
    const pendingIndentCount = await Indent.countDocuments({
      status: { $in: ['SUBMITTED', 'PENDING', 'RECOMMENDED'] }
    });

    // Today's IN / OUT movements
    const todayInTransactions = await StockTransaction.find({
      date: todayStr,
      transactionType: { $in: ['IN', 'PURCHASE'] }
    });
    const todayPurchased = todayInTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);

    const todayOutTransactions = await StockTransaction.find({
      date: todayStr,
      transactionType: { $in: ['OUT', 'TRANSFER'] }
    });
    const todayTransferred = todayOutTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);

    // Recent transactions (latest 10)
    const recentTransactionsRaw = await StockTransaction.find().sort({ createdAt: -1, date: -1 }).limit(10);
    const recentTransactions = recentTransactionsRaw.map(t => ({
      id: t._id,
      _id: t._id,
      transactionId: t.transactionId,
      date: t.date,
      productId: t.productId,
      productCode: t.productCode,
      productName: t.productName,
      type: t.transactionType === 'IN' || t.transactionType === 'PURCHASE' ? 'IN' : 'OUT',
      transactionType: t.transactionType,
      quantity: t.quantity,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      department: t.department,
      remarks: t.remarks,
      recordedBy: t.recordedBy,
      performedBy: t.recordedBy
    }));

    // Role-specific stats
    let facultyStats = null;
    let indentQuery = {};
    if (req.user && req.user.role === 'FACULTY') {
      indentQuery = {
        $or: [
          { requesterId: req.user._id },
          { department: req.user.department },
          { requestingDepartment: req.user.department }
        ]
      };

      const [myTotalRequests, myPendingRequests, myApprovedRequests, myRejectedRequests] = await Promise.all([
        Indent.countDocuments(indentQuery),
        Indent.countDocuments({ ...indentQuery, status: { $in: ['SUBMITTED', 'PENDING', 'RECOMMENDED'] } }),
        Indent.countDocuments({ ...indentQuery, status: { $in: ['APPROVED', 'ISSUED', 'PARTIALLY_ISSUED'] } }),
        Indent.countDocuments({ ...indentQuery, status: 'REJECTED' })
      ]);

      facultyStats = {
        myTotalRequests,
        myPendingRequests,
        myApprovedRequests,
        myRejectedRequests,
        availableCatalogCount: totalProducts
      };
    }

    const recentIndents = await Indent.find(indentQuery).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      role: req.user?.role || 'FACULTY',
      totalProducts,
      totalCurrentStock,
      lowStockCount,
      pendingIndentCount,
      recentTransactions: req.user?.role === 'ADMIN' ? recentTransactions : [],
      recentActivity: req.user?.role === 'ADMIN' ? recentTransactions : [],
      lowStockProducts: req.user?.role === 'ADMIN' ? lowStockProducts : [],
      lowStockItems: req.user?.role === 'ADMIN' ? lowStockProducts.slice(0, 5) : [],
      recentIndents,
      facultyStats,
      stats: {
        totalProducts,
        currentStock: totalCurrentStock,
        totalCurrentStock,
        lowStockCount,
        pendingIndents: pendingIndentCount,
        pendingIndentCount,
        todayPurchased,
        todayTransferred,
        ...(facultyStats || {})
      },
      data: {
        totalProducts,
        totalCurrentStock,
        lowStockCount,
        pendingIndentCount,
        recentTransactions,
        lowStockProducts,
        facultyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive analytics data for Analytics page
// @route   GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const products = await Product.find({ active: { $ne: false } });
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0);
    const lowStockProducts = products.filter(p => {
      const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
      return (Number(p.currentQuantity) || 0) <= min;
    });
    const criticalStockCount = lowStockProducts.filter(p => (Number(p.currentQuantity) || 0) === 0).length;

    // Category distribution from products
    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(p.currentQuantity) || 0);
    });
    const categoryDistribution = Object.keys(categoryMap).map(cat => ({
      name: cat,
      stock: categoryMap[cat]
    }));

    // Stock Register breakdown (dynamic from StockDocument & Product)
    const stockDocs = await StockDocument.find({ active: true });
    const registerMap = {};
    stockDocs.forEach(doc => {
      registerMap[doc.name] = 0;
    });
    // Add default fallbacks if empty
    if (Object.keys(registerMap).length === 0) {
      ['SR1', 'SR2', 'SR3', 'CSSR1'].forEach(k => { registerMap[k] = 0; });
    }
    products.forEach(p => {
      const reg = p.stockRegister || 'SR1';
      registerMap[reg] = (registerMap[reg] || 0) + (Number(p.currentQuantity) || 0);
    });
    const registerDistribution = Object.keys(registerMap).map(reg => ({
      name: reg,
      stock: registerMap[reg]
    }));

    // Current month string 'YYYY-MM'
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7);

    // Stock transactions aggregation
    const allTransactions = await StockTransaction.find().sort({ date: 1 });
    let totalPurchases = 0;
    let monthlyPurchases = 0;
    let totalTransfers = 0;
    let monthlyTransfers = 0;

    const deptMap = {};
    const monthlyMap = {};

    allTransactions.forEach(t => {
      const month = (t.date || '').substring(0, 7) || currentMonthStr;
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, purchases: 0, transfers: 0, stockIn: 0, stockOut: 0 };
      }

      if (t.transactionType === 'IN' || t.transactionType === 'PURCHASE') {
        totalPurchases += t.quantity || 0;
        if (month === currentMonthStr) {
          monthlyPurchases += t.quantity || 0;
        }
        monthlyMap[month].purchases += t.quantity || 0;
        monthlyMap[month].stockIn += t.quantity || 0;
      } else {
        totalTransfers += t.quantity || 0;
        if (month === currentMonthStr) {
          monthlyTransfers += t.quantity || 0;
        }
        monthlyMap[month].transfers += t.quantity || 0;
        monthlyMap[month].stockOut += t.quantity || 0;

        const dept = t.department || 'Store';
        deptMap[dept] = (deptMap[dept] || 0) + (t.quantity || 0);
      }
    });

    const departmentTransfers = Object.keys(deptMap).map(dept => ({
      department: dept,
      quantity: deptMap[dept]
    }));

    // 14-day trend (from past 13 days to today)
    const trends = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trends.push({
        date: dateStr,
        purchases: 0,
        transfers: 0
      });
    }
    const trendMap = {};
    trends.forEach(t => { trendMap[t.date] = t; });

    allTransactions.forEach(t => {
      const dateOnly = (t.date || '').substring(0, 10);
      if (trendMap[dateOnly]) {
        if (t.transactionType === 'IN' || t.transactionType === 'PURCHASE') {
          trendMap[dateOnly].purchases += t.quantity || 0;
        } else {
          trendMap[dateOnly].transfers += t.quantity || 0;
        }
      }
    });

    // Indents statistics
    const [totalIndents, pendingIndents, approvedIndents, completedIndents, rejectedIndents] = await Promise.all([
      Indent.countDocuments(),
      Indent.countDocuments({ status: { $in: ['SUBMITTED', 'PENDING', 'RECOMMENDED'] } }),
      Indent.countDocuments({ status: 'APPROVED' }),
      Indent.countDocuments({ status: { $in: ['ISSUED', 'PARTIALLY_ISSUED', 'COMPLETED'] } }),
      Indent.countDocuments({ status: 'REJECTED' })
    ]);

    const indents = {
      total: totalIndents,
      pending: pendingIndents,
      approved: approvedIndents,
      completed: completedIndents,
      rejected: rejectedIndents
    };

    const inventory = {
      totalProducts,
      totalStock,
      lowStockCount: lowStockProducts.length,
      criticalStockCount,
      categoryDistribution,
      registerDistribution
    };

    const purchases = {
      totalPurchases,
      monthlyPurchases
    };

    const transfers = {
      totalTransfers,
      monthlyTransfers,
      departmentTransfers
    };

    res.json({
      success: true,
      inventory,
      purchases,
      transfers,
      indents,
      trends,
      summary: {
        totalProducts,
        totalStock,
        lowStockCount: lowStockProducts.length,
        criticalStockCount
      },
      categoryDistribution,
      registerDistribution,
      monthlyTrends: Object.values(monthlyMap),
      departmentConsumption: departmentTransfers,
      data: {
        inventory,
        purchases,
        transfers,
        indents,
        trends
      }
    });
  } catch (error) {
    next(error);
  }
};
