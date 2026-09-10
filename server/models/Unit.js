import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  symbol: {
    type: String,
    trim: true,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Unit = mongoose.model('Unit', unitSchema);
export default Unit;
