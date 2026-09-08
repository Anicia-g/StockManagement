import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    required: true,
    unique: true
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'Pieces'
  },
  supplier: {
    type: String,
    required: true,
    default: 'Standard Supplier'
  },
  invoiceNumber: {
    type: String,
    default: ''
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  date: {
    type: String,
    required: true
  },
  recordedBy: {
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

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
