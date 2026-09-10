import Product from '../models/Product.js';
import ProductDocumentReference from '../models/ProductDocumentReference.js';
import StockDocument from '../models/StockDocument.js';
import StockTransaction from '../models/StockTransaction.js';
import ProductRemark from '../models/ProductRemark.js';

// @desc    Get all products with search & filter
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, register, status, lowStock, page, limit } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (register && register !== 'ALL') {
      query.$or = [
        { stockRegister: register },
        { 'registerRefs.sheet': register }
      ];
    }

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query.active = true;
      } else if (status === 'INACTIVE') {
        query.active = false;
      } else {
        query.status = status;
      }
    }

    let products = await Product.find(query).sort({ productName: 1, name: 1 });

    // Populate references if registerRefs is empty
    for (let i = 0; i < products.length; i++) {
      if (!products[i].registerRefs || products[i].registerRefs.length === 0) {
        const refs = await ProductDocumentReference.find({ productId: products[i]._id });
        if (refs.length > 0) {
          products[i].registerRefs = refs.map(r => ({
            sheet: r.stockDocumentName,
            page: r.pageNumber,
            note: r.referenceNote
          }));
        } else if (products[i].stockRegister) {
          products[i].registerRefs = [{
            sheet: products[i].stockRegister,
            page: products[i].pageNumber || 1
          }];
        }
      }
    }

    if (lowStock === 'true') {
      products = products.filter(p => {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : p.minimumStockLevel;
        return p.currentQuantity <= min;
      });
    }

    const total = products.length;

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.max(1, parseInt(limit) || 10);
      const startIndex = (pageNum - 1) * pageSize;
      const paginatedProducts = products.slice(startIndex, startIndex + pageSize);

      return res.json({
        success: true,
        count: paginatedProducts.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        products: paginatedProducts,
        data: paginatedProducts
      });
    }

    res.json({
      success: true,
      count: products.length,
      total,
      products,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or ProductCode
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    let product = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.id);
    }
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Attach references
    const refs = await ProductDocumentReference.find({ productId: product._id });
    if (refs.length > 0) {
      product.registerRefs = refs.map(r => ({
        sheet: r.stockDocumentName,
        page: r.pageNumber,
        note: r.referenceNote
      }));
    }

    res.json({ success: true, product, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete product details (references, history, remarks, stock status)
// @route   GET /api/products/:id/details
export const getProductDetails = async (req, res, next) => {
  try {
    let product = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.id);
    }
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Fetch references
    const references = await ProductDocumentReference.find({ productId: product._id }).populate('stockDocumentId');

    // Fetch history
    const history = await StockTransaction.find({
      $or: [
        { productId: product._id },
        { productCode: product.productCode }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    // Fetch remarks
    const remarks = await ProductRemark.find({ productId: product._id }).sort({ createdAt: -1 });

    const min = product.minimumQuantity !== undefined ? product.minimumQuantity : product.minimumStockLevel;
    const stockStatus = product.currentQuantity < min ? 'LOW_STOCK' : 'AVAILABLE';

    res.json({
      success: true,
      product,
      stockStatus,
      references: references.map(r => ({
        id: r._id,
        _id: r._id,
        sheet: r.stockDocumentName,
        stockDocument: r.stockDocumentName,
        stockDocumentId: r.stockDocumentId,
        page: r.pageNumber,
        pageNumber: r.pageNumber,
        referenceNote: r.referenceNote
      })),
      history,
      remarks: remarks.length > 0 ? remarks : (product.remarks || []),
      data: {
        product,
        stockStatus,
        references,
        history,
        remarks: remarks.length > 0 ? remarks : (product.remarks || [])
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const {
      productCode,
      productName,
      name,
      category,
      unit,
      description,
      currentQuantity,
      minimumQuantity,
      minimumStockLevel,
      stockRegister,
      pageNumber,
      registerRefs,
      initialRemark
    } = req.body;

    const resolvedCode = (productCode || '').trim().toUpperCase();
    const resolvedName = (productName || name || '').trim();

    if (!resolvedCode) {
      return res.status(400).json({ success: false, message: 'Product code is required.' });
    }
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Product category is required.' });
    }
    if (!unit) {
      return res.status(400).json({ success: false, message: 'Product unit is required.' });
    }

    const existing = await Product.findOne({ productCode: resolvedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Product code "${resolvedCode}" already exists. Please use a unique code.`
      });
    }

    const initQty = Math.max(0, Number(currentQuantity) || 0);
    const minQty = Math.max(0, Number(minimumQuantity !== undefined ? minimumQuantity : minimumStockLevel) || 5);

    const product = await Product.create({
      productCode: resolvedCode,
      productName: resolvedName,
      name: resolvedName,
      category: category.trim(),
      unit: unit.trim(),
      description: description || '',
      currentQuantity: initQty,
      minimumQuantity: minQty,
      minimumStockLevel: minQty,
      stockRegister: stockRegister || 'SR1',
      pageNumber: Number(pageNumber) || 1,
      registerRefs: Array.isArray(registerRefs) && registerRefs.length > 0
        ? registerRefs
        : [{ sheet: stockRegister || 'SR1', page: Number(pageNumber) || 1 }],
      createdBy: req.user?.name || 'Admin',
      updatedBy: req.user?.name || 'Admin'
    });

    // Create document reference records
    if (Array.isArray(registerRefs) && registerRefs.length > 0) {
      for (const ref of registerRefs) {
        const sheetName = (ref.sheet || ref.stockDocumentName || 'SR1').toUpperCase();
        const page = Number(ref.page || ref.pageNumber) || 1;
        const stockDoc = await StockDocument.findOne({ name: sheetName });
        await ProductDocumentReference.create({
          productId: product._id,
          stockDocumentId: stockDoc?._id || null,
          stockDocumentName: sheetName,
          pageNumber: page,
          referenceNote: ref.note || ref.referenceNote || ''
        });
      }
    } else {
      const sheetName = (stockRegister || 'SR1').toUpperCase();
      const page = Number(pageNumber) || 1;
      const stockDoc = await StockDocument.findOne({ name: sheetName });
      await ProductDocumentReference.create({
        productId: product._id,
        stockDocumentId: stockDoc?._id || null,
        stockDocumentName: sheetName,
        pageNumber: page
      });
    }

    // Initial remark if provided
    if (initialRemark && initialRemark.trim()) {
      await ProductRemark.create({
        productId: product._id,
        remark: initialRemark.trim(),
        enteredBy: req.user?.name ? `${req.user.name} (${req.user.role})` : 'Store Keeper'
      });
      product.remarks.push({
        id: `rem-${Date.now()}`,
        author: req.user?.name ? `${req.user.name}` : 'Store Keeper',
        date: new Date().toISOString().split('T')[0],
        text: initialRemark.trim()
      });
      await product.save();
    }

    // Record initial stock transaction if initial quantity > 0
    if (initQty > 0) {
      await StockTransaction.create({
        transactionId: `TXN-INIT-${Date.now()}`,
        transactionType: 'IN',
        productId: product._id,
        productCode: product.productCode,
        productName: product.productName,
        quantity: initQty,
        previousQuantity: 0,
        newQuantity: initQty,
        department: 'Store',
        date: new Date().toISOString().split('T')[0],
        remarks: 'Initial inventory registration',
        recordedBy: req.user?.name || 'Admin'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details (currentQuantity CANNOT be directly modified here)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      productName,
      name,
      category,
      unit,
      description,
      minimumQuantity,
      minimumStockLevel,
      active,
      status,
      stockRegister,
      pageNumber,
      registerRefs
    } = req.body;

    if (productName) {
      product.productName = productName.trim();
      product.name = productName.trim();
    } else if (name) {
      product.productName = name.trim();
      product.name = name.trim();
    }

    if (category) product.category = category.trim();
    if (unit) product.unit = unit.trim();
    if (description !== undefined) product.description = description;

    if (minimumQuantity !== undefined) {
      product.minimumQuantity = Math.max(0, Number(minimumQuantity));
      product.minimumStockLevel = product.minimumQuantity;
    } else if (minimumStockLevel !== undefined) {
      product.minimumStockLevel = Math.max(0, Number(minimumStockLevel));
      product.minimumQuantity = product.minimumStockLevel;
    }

    if (active !== undefined) {
      product.active = Boolean(active);
      product.status = product.active ? 'ACTIVE' : 'INACTIVE';
    } else if (status !== undefined) {
      product.status = status;
      product.active = status === 'ACTIVE';
    }

    if (stockRegister) product.stockRegister = stockRegister;
    if (pageNumber !== undefined) product.pageNumber = Number(pageNumber) || 1;

    if (Array.isArray(registerRefs) && registerRefs.length > 0) {
      product.registerRefs = registerRefs;
      // Sync references table
      await ProductDocumentReference.deleteMany({ productId: product._id });
      for (const ref of registerRefs) {
        const sheetName = (ref.sheet || ref.stockDocumentName || 'SR1').toUpperCase();
        const page = Number(ref.page || ref.pageNumber) || 1;
        const stockDoc = await StockDocument.findOne({ name: sheetName });
        await ProductDocumentReference.create({
          productId: product._id,
          stockDocumentId: stockDoc?._id || null,
          stockDocumentName: sheetName,
          pageNumber: page,
          referenceNote: ref.note || ref.referenceNote || ''
        });
      }
    }

    product.updatedBy = req.user?.name || 'Admin';
    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete / deactivate product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Soft delete
    product.active = false;
    product.status = 'INACTIVE';
    product.updatedBy = req.user?.name || 'Admin';
    await product.save();

    res.json({
      success: true,
      message: `Product "${product.productName || product.name}" (${product.productCode}) deactivated successfully.`,
      product
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Product Document References Endpoints
// ==========================================

// @desc    Get all references for a product
// @route   GET /api/products/:id/references
export const getProductReferences = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const references = await ProductDocumentReference.find({ productId: product._id });
    res.json({ success: true, count: references.length, references, data: references });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a reference to a product
// @route   POST /api/products/:id/references
export const addProductReference = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { stockDocumentId, stockDocumentName, pageNumber, referenceNote } = req.body;
    let docName = stockDocumentName;

    if (!docName && stockDocumentId) {
      const doc = await StockDocument.findById(stockDocumentId);
      if (doc) docName = doc.name;
    }

    if (!docName) {
      return res.status(400).json({ success: false, message: 'Stock document name (e.g. SR1, SR2, SR3, CSSR1) is required.' });
    }
    if (!pageNumber || Number(pageNumber) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid page number is required.' });
    }

    const reference = await ProductDocumentReference.create({
      productId: product._id,
      stockDocumentId: stockDocumentId || null,
      stockDocumentName: docName.toUpperCase(),
      pageNumber: Number(pageNumber),
      referenceNote: referenceNote || ''
    });

    // Update embedded registerRefs
    product.registerRefs.push({
      sheet: docName.toUpperCase(),
      page: Number(pageNumber),
      note: referenceNote || ''
    });
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Stock document reference added successfully.',
      reference,
      data: reference
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a reference
// @route   PUT /api/products/:id/references/:referenceId
export const updateProductReference = async (req, res, next) => {
  try {
    const reference = await ProductDocumentReference.findById(req.params.referenceId);
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Document reference not found.' });
    }

    const { stockDocumentName, pageNumber, referenceNote } = req.body;
    if (stockDocumentName) reference.stockDocumentName = stockDocumentName.toUpperCase();
    if (pageNumber !== undefined) reference.pageNumber = Number(pageNumber);
    if (referenceNote !== undefined) reference.referenceNote = referenceNote;

    await reference.save();
    res.json({ success: true, message: 'Reference updated successfully.', reference, data: reference });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reference
// @route   DELETE /api/products/:id/references/:referenceId
export const deleteProductReference = async (req, res, next) => {
  try {
    const reference = await ProductDocumentReference.findById(req.params.referenceId);
    if (!reference) {
      return res.status(404).json({ success: false, message: 'Document reference not found.' });
    }

    await ProductDocumentReference.findByIdAndDelete(req.params.referenceId);
    res.json({ success: true, message: 'Document reference removed.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Product Remarks Endpoints
// ==========================================

// @desc    Get remarks for a product
// @route   GET /api/products/:id/remarks
export const getProductRemarks = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const remarks = await ProductRemark.find({ productId: product._id }).sort({ enteredAt: -1 });
    res.json({
      success: true,
      count: remarks.length,
      remarks: remarks.length > 0 ? remarks : (product.remarks || []),
      data: remarks.length > 0 ? remarks : (product.remarks || [])
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add remark to a product
// @route   POST /api/products/:id/remarks
export const addProductRemark = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      product = await Product.findOne({ productCode: req.params.id.toUpperCase() });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { remark, text, author } = req.body;
    const remarkContent = (remark || text || '').trim();

    if (!remarkContent) {
      return res.status(400).json({ success: false, message: 'Remark text cannot be empty.' });
    }

    const authorName = author || (req.user?.name ? `${req.user.name} (${req.user.role})` : 'Store Staff');

    const newRemark = await ProductRemark.create({
      productId: product._id,
      remark: remarkContent,
      enteredBy: authorName,
      enteredAt: new Date()
    });

    // Update embedded remarks
    product.remarks.unshift({
      id: `rem-${Date.now()}`,
      author: authorName,
      date: new Date().toISOString().split('T')[0],
      text: remarkContent
    });
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Remark recorded successfully.',
      remark: {
        id: newRemark._id,
        _id: newRemark._id,
        author: newRemark.enteredBy,
        date: newRemark.enteredAt.toISOString().split('T')[0],
        text: newRemark.remark,
        createdAt: newRemark.enteredAt
      },
      data: newRemark
    });
  } catch (error) {
    next(error);
  }
};
