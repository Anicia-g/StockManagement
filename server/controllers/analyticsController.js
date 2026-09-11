import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Indent from '../models/Indent.js';
import StockDocument from '../models/StockDocument.js';
import Category from '../models/Category.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';

// @desc    Get dashboard summary metrics and statistics
// @route   GET /api/dashboard & GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Core entity counts directly from MongoDB
    const [
      totalProducts,
      totalCategories,
      totalPurchases,
      totalTransfers,
      pendingIndentCount
    ] = await Promise.all([
      Product.countDocuments({ active: { $ne: false } }),
      Category.countDocuments({ active: { $ne: false } }),
      Purchase.countDocuments(),
      Transfer.countDocuments(),
      Indent.countDocuments({ status: { $in: ['SUBMITTED', 'PENDING', 'RECOMMENDED'] } })
    ]);

    const products = await Product.find({ active: { $ne: false } });
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
          stockRegister: p.stockRegister || 'SR1',
          pageNumber: p.pageNumber || 1,
          registerRefs: p.registerRefs
        };
      });

    const lowStockCount = lowStockProducts.length;

    // Today's movement quantities
    const todayPurchases = await Purchase.find({ date: todayStr });
    const todayPurchased = todayPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

    const todayTransfersList = await Transfer.find({ date: todayStr });
    const todayTransferred = todayTransfersList.reduce((sum, t) => sum + (t.quantity || 0), 0);

    // Recent transactions (latest 10)
    const recentTransactionsRaw = await StockTransaction.find().sort({ createdAt: -1, date: -1 }).limit(10);
    const recentTransactions = recentTransactionsRaw.map(t => {
      const isPurchase = t.transactionType === 'PURCHASE' || t.transactionType === 'IN';
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
        performedBy: t.recordedBy || 'Admin'
      };
    });

    // Faculty role-specific metrics
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
        Indent.countDocuments({ ...indentQuery, status: { $in: ['APPROVED', 'ISSUED', 'PARTIALLY_ISSUED', 'COMPLETED'] } }),
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
        todayTransferred,
        ...(facultyStats || {})
      },
      data: {
        totalProducts,
        totalCategories,
        totalCurrentStock,
        lowStockCount,
        totalPurchases,
        totalTransfers,
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
    const totalCurrentStock = products.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0);

    const lowStockProducts = products
      .filter(p => {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
        return (Number(p.currentQuantity) || 0) <= min;
      })
      .map(p => {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
        return {
          productCode: p.productCode,
          productName: p.productName || p.name,
          currentQuantity: p.currentQuantity,
          minimumQuantity: min,
          unit: p.unit,
          deficit: Math.max(0, min - p.currentQuantity)
        };
      });

    const lowStockCount = lowStockProducts.length;

    // Categories & category distribution
    const categories = await Category.find({ active: { $ne: false } });
    const totalCategories = categories.length;

    const categoryDistribution = categories.map(cat => {
      const prodsInCat = products.filter(p => p.category === cat.name);
      return {
        name: cat.name,
        productCount: prodsInCat.length,
        stock: prodsInCat.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0)
      };
    }).filter(c => c.productCount > 0 || c.stock > 0);

    // If categories collection is not mapped to product names, aggregate from products
    if (categoryDistribution.length === 0) {
      const catMap = {};
      products.forEach(p => {
        const cat = p.category || 'General';
        if (!catMap[cat]) catMap[cat] = { name: cat, productCount: 0, stock: 0 };
        catMap[cat].productCount += 1;
        catMap[cat].stock += Number(p.currentQuantity) || 0;
      });
      Object.values(catMap).forEach(item => categoryDistribution.push(item));
    }

    // Purchase and Transfer record counts
    const [totalPurchases, totalTransfers] = await Promise.all([
      Purchase.countDocuments(),
      Transfer.countDocuments()
    ]);

    // Aggregate purchase & transfer quantities
    const purchasesList = await Purchase.find().lean();
    const transfersList = await Transfer.find().lean();

    const totalPurchasedQuantity = purchasesList.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalTransferredQuantity = transfersList.reduce((sum, t) => sum + (t.quantity || 0), 0);

    // 14-day trend for purchases vs transfers
    const trends = [];
    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = {
        date: dateStr,
        purchases: 0,
        transfers: 0
      };
      trends.push(entry);
      trendMap[dateStr] = entry;
    }

    purchasesList.forEach(p => {
      const dateStr = (p.date || '').substring(0, 10);
      if (trendMap[dateStr]) {
        trendMap[dateStr].purchases += p.quantity || 0;
      }
    });

    transfersList.forEach(t => {
      const dateStr = (t.date || '').substring(0, 10);
      if (trendMap[dateStr]) {
        trendMap[dateStr].transfers += t.quantity || 0;
      }
    });

    // Department-wise transfer consumption
    const deptMap = {};
    transfersList.forEach(t => {
      const dept = t.department || 'General Maintenance';
      deptMap[dept] = (deptMap[dept] || 0) + (t.quantity || 0);
    });
    const departmentConsumption = Object.keys(deptMap).map(dept => ({
      department: dept,
      quantity: deptMap[dept]
    }));

    // Indents statistics
    const [totalIndents, pendingIndents, approvedIndents, rejectedIndents] = await Promise.all([
      Indent.countDocuments(),
      Indent.countDocuments({ status: { $in: ['SUBMITTED', 'PENDING', 'RECOMMENDED'] } }),
      Indent.countDocuments({ status: { $in: ['APPROVED', 'PARTIALLY_APPROVED', 'COMPLETED', 'ISSUED'] } }),
      Indent.countDocuments({ status: 'REJECTED' })
    ]);

    const indentDistribution = [
      { name: 'Submitted / Pending', value: pendingIndents, color: '#f59e0b' },
      { name: 'Approved', value: approvedIndents, color: '#10b981' },
      { name: 'Rejected', value: rejectedIndents, color: '#ef4444' }
    ].filter(item => item.value > 0);

    res.json({
      success: true,
      metrics: {
        totalProducts,
        totalCategories,
        totalCurrentStock,
        lowStockCount,
        totalPurchases,
        totalTransfers,
        totalPurchasedQuantity,
        totalTransferredQuantity,
        totalIndents,
        pendingIndents,
        approvedIndents,
        rejectedIndents
      },
      inventory: {
        totalProducts,
        totalCurrentStock,
        totalStock: totalCurrentStock,
        lowStockCount,
        criticalStockCount: lowStockProducts.filter(p => p.currentQuantity === 0).length,
        categoryDistribution
      },
      purchases: {
        totalPurchases,
        totalQuantity: totalPurchasedQuantity
      },
      transfers: {
        totalTransfers,
        totalQuantity: totalTransferredQuantity,
        departmentConsumption
      },
      indents: {
        total: totalIndents,
        pending: pendingIndents,
        approved: approvedIndents,
        rejected: rejectedIndents,
        distribution: indentDistribution
      },
      trends,
      categoryDistribution,
      lowStockProducts,
      departmentConsumption,
      data: {
        metrics: {
          totalProducts,
          totalCategories,
          totalCurrentStock,
          lowStockCount,
          totalPurchases,
          totalTransfers,
          totalIndents,
          pendingIndents,
          approvedIndents,
          rejectedIndents
        },
        trends,
        categoryDistribution,
        lowStockProducts,
        indentDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
