import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';
import StockHistory from '../models/StockHistory.js';

// @desc    Get structured report data
// @route   GET /api/reports
export const getReportData = async (req, res, next) => {
  try {
    const { reportType, startDate, endDate, category, register, department } = req.query;

    let data = [];
    let title = 'Consumable Stock Report';

    switch (reportType) {
      case 'LOW_STOCK': {
        title = 'Low Stock & Reorder Alert Report';
        let query = { active: { $ne: false } };
        if (category && category !== 'ALL') query.category = category;
        if (register && register !== 'ALL') query.stockRegister = register;
        const prods = await Product.find(query).sort({ name: 1 });
        const lowProds = prods.filter(p => {
          const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
          return (Number(p.currentQuantity) || 0) <= min;
        });
        data = lowProds.map(p => {
          const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
          return {
            productCode: p.productCode,
            name: p.productName || p.name,
            category: p.category,
            currentQuantity: p.currentQuantity,
            minimumStockLevel: min,
            unit: p.unit,
            stockRegister: p.stockRegister || 'SR1',
            deficit: Math.max(0, min - p.currentQuantity),
            status: p.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock'
          };
        });
        break;
      }

      case 'PRODUCT': {
        title = 'Product Stock Inventory Report';
        let query = { active: { $ne: false } };
        if (category && category !== 'ALL') query.category = category;
        if (register && register !== 'ALL') query.stockRegister = register;
        const prods = await Product.find(query).sort({ name: 1 });
        data = prods.map(p => ({
          productCode: p.productCode,
          name: p.productName || p.name,
          category: p.category,
          currentQuantity: p.currentQuantity,
          minimumStockLevel: p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel,
          unit: p.unit,
          stockRegister: p.stockRegister || 'SR1',
          status: p.currentQuantity <= (p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel) ? 'Low Stock' : 'Available'
        }));
        break;
      }

      case 'PURCHASE': {
        title = 'Stock Purchase History Report';
        let query = {};
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        const purchases = await Purchase.find(query).sort({ date: -1 });
        data = purchases.map(p => ({
          purchaseId: p.purchaseId,
          date: p.date,
          productCode: p.productCode,
          productName: p.productName,
          stockRegister: p.stockRegister,
          quantity: `${p.quantity} ${p.unit}`,
          supplier: p.supplier,
          invoiceNumber: p.invoiceNumber || '—',
          recordedBy: p.recordedBy
        }));
        break;
      }

      case 'TRANSFER': {
        title = 'Department Stock Transfer Report';
        let query = {};
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        if (department && department !== 'ALL') query.department = { $regex: department, $options: 'i' };
        const transfers = await Transfer.find(query).sort({ date: -1 });
        data = transfers.map(t => ({
          transferId: t.transferId,
          date: t.date,
          productCode: t.productCode,
          productName: t.productName,
          stockRegister: t.stockRegister,
          quantity: `${t.quantity} ${t.unit}`,
          department: t.department,
          indentNumber: t.indentNumber || 'Direct Transfer',
          issuedBy: t.issuedBy
        }));
        break;
      }

      case 'INDENT': {
        title = 'Department Indent Requests Report';
        let query = {};
        if (startDate && endDate) query.requestDate = { $gte: startDate, $lte: endDate };
        if (department && department !== 'ALL') query.department = { $regex: department, $options: 'i' };
        const indents = await Indent.find(query).sort({ createdAt: -1 });
        data = indents.map(i => ({
          indentNumber: i.indentNumber,
          date: i.requestDate,
          requester: i.requesterName,
          department: i.department,
          itemsCount: i.items.length,
          itemSummary: i.items.map(it => `${it.productName} (Req: ${it.requestedQuantity}, Appr: ${it.approvedQuantity || 0})`).join('; '),
          status: i.status
        }));
        break;
      }

      case 'HISTORY':
      default: {
        title = 'Complete Stock Movement Report';
        let query = {};
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        if (department && department !== 'ALL') query.department = { $regex: department, $options: 'i' };
        const history = await StockHistory.find(query).sort({ date: -1, createdAt: -1 });
        data = history.map(h => ({
          transactionId: h.transactionId,
          date: h.date,
          productCode: h.productCode,
          productName: h.productName,
          stockRegister: h.stockRegister || 'SR1',
          type: h.type === 'IN' ? 'PURCHASE' : (h.type === 'OUT' ? 'TRANSFER' : (h.type || 'PURCHASE')),
          quantity: Math.abs(h.quantity),
          previousQuantity: h.previousQuantity,
          newQuantity: h.newQuantity,
          department: h.department,
          performedBy: h.performedBy,
          referenceId: h.referenceId || '—'
        }));
        break;
      }
    }

    res.json({
      success: true,
      title,
      generatedAt: new Date().toISOString(),
      institution: 'Consumable Stock Management System',
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};
