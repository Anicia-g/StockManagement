import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  transferId: {
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
  department: {
    type: String,
    required: true
  },
  indentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Indent',
    default: null
  },
  indentNumber: {
    type: String,
    default: null
  },
  issuedBy: {
    type: String,
    required: true,
    default: 'Admin'
  },
  date: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Transfer = mongoose.model('Transfer', transferSchema);
export default Transfer;
