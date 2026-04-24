import mongoose from 'mongoose';

const idCardRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  fatherName: { type: String, trim: true },
  dateOfBirth: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  email: { type: String, trim: true },
  mobile: { type: String, required: true, trim: true },
  emergencyContact: { type: String, trim: true },
  workLocation: { type: String, trim: true },
  area: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  experienceYears: { type: String, trim: true },
  aadhaarNumber: { type: String, trim: true },
  address: { type: String, trim: true },
  purpose: { type: String, trim: true },
  profileImage: { type: String },
  signatureImage: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminRemarks: { type: String, trim: true, default: '' },
  approvedJournalistId: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.IdCardRequest || mongoose.model('IdCardRequest', idCardRequestSchema);
