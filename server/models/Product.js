import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Electrical'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    default: 'Pieces'
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  currentQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  minimumQuantity: {
    type: Number,
    required: true,
    default: 5,
    min: [0, 'Minimum quantity cannot be negative']
  },
  minimumStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock level cannot be negative']
  },
  stockRegister: {
    type: String,
    enum: ['SR1', 'SR2', 'SR3', 'CSSR1'],
    default: 'SR1'
  },
  pageNumber: {
    type: Number,
    default: 1
  },
  registerRefs: [
    {
      sheet: {
        type: String,
        enum: ['SR1', 'SR2', 'SR3', 'CSSR1'],
        required: true
      },
      page: {
        type: Number,
        required: true
      },
      note: {
        type: String,
        default: ''
      }
    }
  ],
  active: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  remarks: [
    {
      id: { type: String },
      author: { type: String, required: true },
      date: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdBy: {
    type: String,
    default: 'Admin'
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Pre-save hook to synchronize name/productName and minimumQuantity/minimumStockLevel
productSchema.pre('save', function (next) {
  if (this.productName && !this.name) {
    this.name = this.productName;
  } else if (this.name && !this.productName) {
    this.productName = this.name;
  }

  if (this.minimumQuantity !== undefined && this.minimumStockLevel === undefined) {
    this.minimumStockLevel = this.minimumQuantity;
  } else if (this.minimumStockLevel !== undefined && this.minimumQuantity === undefined) {
    this.minimumQuantity = this.minimumStockLevel;
  }

  if (this.active !== undefined) {
    this.status = this.active ? 'ACTIVE' : 'INACTIVE';
  } else if (this.status !== undefined) {
    this.active = this.status === 'ACTIVE';
  }

  next();
});

// Virtual for low stock status and derived status
productSchema.virtual('stockStatus').get(function () {
  const min = this.minimumQuantity !== undefined ? this.minimumQuantity : this.minimumStockLevel;
  return this.currentQuantity < min ? 'LOW_STOCK' : 'AVAILABLE';
});

productSchema.virtual('isLowStock').get(function () {
  const min = this.minimumQuantity !== undefined ? this.minimumQuantity : this.minimumStockLevel;
  return this.currentQuantity <= min;
});

productSchema.virtual('difference').get(function () {
  const min = this.minimumQuantity !== undefined ? this.minimumQuantity : this.minimumStockLevel;
  return this.currentQuantity - min;
});

// Ensure virtuals are serialized in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
