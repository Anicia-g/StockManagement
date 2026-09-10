import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  transactionType: {
    type: String,
    enum: ['IN', 'OUT', 'PURCHASE', 'TRANSFER'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  newQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  department: {
    type: String,
    default: 'Store'
  },
  indentDetailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndentDetail',
    default: null
  },
  referenceId: {
    type: String,
    default: null
  },
  date: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: String,
    required: true,
    default: 'Staff'
  },
  recordedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
export default StockTransaction;
