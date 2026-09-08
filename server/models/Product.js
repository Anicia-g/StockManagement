import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'Electrical'
  },
  description: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    required: true,
    default: 'Pieces'
  },
  currentQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minimumStockLevel: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  stockRegister: {
    type: String,
    enum: ['SR1', 'SR2', 'SR3', 'CSSR1'],
    required: true,
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
      }
    }
  ],
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
  ]
}, {
  timestamps: true
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.currentQuantity <= this.minimumStockLevel;
});

// Ensure virtuals are serialized in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
