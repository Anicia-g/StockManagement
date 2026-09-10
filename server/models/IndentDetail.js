import mongoose from 'mongoose';

const indentDetailSchema = new mongoose.Schema({
  indentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Indent',
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
  unit: {
    type: String,
    default: 'Pieces'
  },
  quantityRequired: {
    type: Number,
    required: true,
    min: 1
  },
  quantityRecommended: {
    type: Number,
    default: 0,
    min: 0
  },
  quantityApproved: {
    type: Number,
    default: 0,
    min: 0
  },
  quantityIssued: {
    type: Number,
    default: 0,
    min: 0
  },
  lineRemarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const IndentDetail = mongoose.model('IndentDetail', indentDetailSchema);
export default IndentDetail;
