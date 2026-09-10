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
    default: 0
  },
  quantityRequired: {
    type: Number,
    required: true,
    min: 1
  },
  requestedQuantity: {
    type: Number,
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
  approvedQuantity: {
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
  },
  remarks: {
    type: String,
    default: ''
  }
});

indentItemSchema.pre('save', function (next) {
  if (this.quantityRequired && !this.requestedQuantity) {
    this.requestedQuantity = this.quantityRequired;
  } else if (this.requestedQuantity && !this.quantityRequired) {
    this.quantityRequired = this.requestedQuantity;
  }
  if (this.quantityApproved !== undefined && this.approvedQuantity === undefined) {
    this.approvedQuantity = this.quantityApproved;
  } else if (this.approvedQuantity !== undefined && this.quantityApproved === undefined) {
    this.quantityApproved = this.approvedQuantity;
  }
  next();
});

const indentSchema = new mongoose.Schema({
  indentNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  requestDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  requiredDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  requestingDepartment: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  requestedBy: {
    type: String,
    required: true
  },
  requesterName: {
    type: String
  },
  recommendedBy: {
    type: String,
    default: null
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'RECOMMENDED',
      'APPROVED',
      'PARTIALLY_ISSUED',
      'ISSUED',
      'REJECTED',
      'CANCELLED',
      'PENDING',
      'PARTIALLY_APPROVED',
      'COMPLETED'
    ],
    default: 'SUBMITTED'
  },
  purpose: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  items: [indentItemSchema]
}, {
  timestamps: true
});

indentSchema.pre('save', function (next) {
  if (this.requestingDepartment && !this.department) {
    this.department = this.requestingDepartment;
  } else if (this.department && !this.requestingDepartment) {
    this.requestingDepartment = this.department;
  }
  if (this.requestedBy && !this.requesterName) {
    this.requesterName = this.requestedBy;
  } else if (this.requesterName && !this.requestedBy) {
    this.requestedBy = this.requesterName;
  }
  if (this.date && !this.requestDate) {
    this.requestDate = this.date;
  } else if (this.requestDate && !this.date) {
    this.date = this.requestDate;
  }
  next();
});

const Indent = mongoose.model('Indent', indentSchema);
export default Indent;
