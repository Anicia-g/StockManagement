import mongoose from 'mongoose';

const indentItemSchema = new mongoose.Schema({
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
  unit: {
    type: String,
    default: 'Pieces'
  },
  availableQuantityAtRequest: {
    type: Number,
    required: true,
    default: 0
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  approvedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String,
    default: ''
  }
});

const indentSchema = new mongoose.Schema({
  indentNumber: {
    type: String,
    required: true,
    unique: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  requestDate: {
    type: String,
    required: true
  },
  requiredDate: {
    type: String,
    required: true
  },
  items: [indentItemSchema],
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'COMPLETED'],
    default: 'PENDING'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Indent = mongoose.model('Indent', indentSchema);
export default Indent;
