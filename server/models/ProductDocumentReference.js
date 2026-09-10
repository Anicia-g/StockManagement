import mongoose from 'mongoose';

const productDocumentReferenceSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  stockDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockDocument',
    required: false
  },
  stockDocumentName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  referenceNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const ProductDocumentReference = mongoose.model('ProductDocumentReference', productDocumentReferenceSchema);
export default ProductDocumentReference;
