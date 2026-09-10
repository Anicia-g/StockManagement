import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['ADMIN', 'STAFF', 'VIEWER', 'FACULTY'],
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: [{
    type: String
  }]
}, {
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
