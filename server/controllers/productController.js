import Product from '../models/Product.js';

// @desc    Get all products with search & filter
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, register, status, lowStock } = req.query;
    let query = {};

    if (search) {
      query.$or = [
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
      query.status = status;
    }

    let products = await Product.find(query).sort({ name: 1 });

    if (lowStock === 'true') {
      products = products.filter(p => p.currentQuantity <= p.minimumStockLevel);
    }

    const total = products.length;

    // Optional pagination
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
        products: paginatedProducts
      });
    }

    res.json({
      success: true,
      count: products.length,
      total,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      // Try searching by productCode if not ObjectId
      const prodByCode = await Product.findOne({ productCode: req.params.id.toUpperCase() });
      if (prodByCode) {
        return res.json({ success: true, product: prodByCode });
      }
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin only)
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const {
      productCode,
      name,
      category,
      description,
      unit,
      currentQuantity,
      minimumStockLevel,
      stockRegister,
      pageNumber,
      registerRefs,
      remarks,
      initialRemark
    } = req.body;

    // Check duplicate code
    const existing = await Product.findOne({ productCode: productCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Product Code "${productCode.toUpperCase()}" already exists. Please use a unique product code.`
      });
    }

    const refs = (registerRefs && registerRefs.length > 0)
      ? registerRefs
      : [{ sheet: stockRegister || 'SR1', page: Number(pageNumber) || 1 }];

    const rems = [];
    if (initialRemark && initialRemark.trim()) {
      rems.push({
        id: `rem-${Date.now()}`,
        author: req.user ? `${req.user.name}, ${req.user.role}` : 'Admin',
        date: new Date().toISOString().split('T')[0],
        text: initialRemark.trim()
      });
    }

    const product = await Product.create({
      productCode: productCode.trim().toUpperCase(),
      name: name.trim(),
      category: category || 'Electrical',
      description: description || '',
      unit: unit || 'Pieces',
      currentQuantity: Number(currentQuantity) || 0,
      minimumStockLevel: Number(minimumStockLevel) || 5,
      stockRegister: stockRegister || refs[0]?.sheet || 'SR1',
      pageNumber: Number(pageNumber) || refs[0]?.page || 1,
      registerRefs: refs,
      status: 'ACTIVE',
      remarks: rems
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details (Admin only)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      productCode,
      name,
      category,
      description,
      unit,
      currentQuantity,
      minimumStockLevel,
      stockRegister,
      pageNumber,
      registerRefs,
      status
    } = req.body;

    // If code is being changed, ensure it is unique
    if (productCode && productCode.toUpperCase() !== product.productCode) {
      const existing = await Product.findOne({
        productCode: productCode.trim().toUpperCase(),
        _id: { $ne: product._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Product Code "${productCode.toUpperCase()}" already exists for another product.`
        });
      }
      product.productCode = productCode.trim().toUpperCase();
    }

    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (unit) product.unit = unit;
    if (currentQuantity !== undefined) product.currentQuantity = Number(currentQuantity);
    if (minimumStockLevel !== undefined) product.minimumStockLevel = Number(minimumStockLevel);
    if (stockRegister) product.stockRegister = stockRegister;
    if (pageNumber !== undefined) product.pageNumber = Number(pageNumber);
    if (registerRefs && registerRefs.length > 0) product.registerRefs = registerRefs;
    if (status) product.status = status;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate product (Admin only)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Product "${product.name}" (${product.productCode}) deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add remark to product
// @route   POST /api/products/:id/remarks
export const addProductRemark = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { text, author } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Remark text is required' });
    }

    const newRemark = {
      id: `rem-${Date.now()}`,
      author: author || (req.user ? `${req.user.name}, ${req.user.department}` : 'Staff'),
      date: new Date().toISOString().split('T')[0],
      text: text.trim(),
      createdAt: new Date()
    };

    product.remarks.unshift(newRemark);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Remark added successfully',
      remark: newRemark
    });
  } catch (error) {
    next(error);
  }
};
