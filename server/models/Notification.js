import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['LOW_STOCK', 'INDENT_CREATED', 'INDENT_STATUS', 'PURCHASE', 'TRANSFER', 'STOCK_IN', 'STOCK_OUT', 'SYSTEM'],
    default: 'SYSTEM'
  },
  targetRole: {
    type: String,
    enum: ['ADMIN', 'FACULTY', 'ALL'],
    default: 'ALL'
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referenceId: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
