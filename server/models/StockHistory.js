import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
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
  stockRegister: {
    type: String,
    default: 'SR1'
  },
  type: {
    type: String,
    enum: ['PURCHASE', 'TRANSFER'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    default: 'Store'
  },
  referenceId: {
    type: String,
    default: null
  },
  performedBy: {
    type: String,
    required: true,
    default: 'Admin'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);
export default StockHistory;
