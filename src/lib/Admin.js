import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { collection: 'admin' });

export default mongoose.models.Admin || mongoose.model('Admin', adminSchema);
