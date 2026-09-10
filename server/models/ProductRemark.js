import mongoose from 'mongoose';

const productRemarkSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  remark: {
    type: String,
    required: true,
    trim: true
  },
  enteredBy: {
    type: String,
    required: true,
    default: 'Staff'
  },
  enteredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ProductRemark = mongoose.model('ProductRemark', productRemarkSchema);
export default ProductRemark;
