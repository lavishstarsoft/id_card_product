import mongoose from 'mongoose';

const journalistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  pressId: { type: String, required: true, unique: true, immutable: true },
  mobile: { type: String },
  area: { type: String },
  bloodGroup: { type: String },
  validUntil: { type: String },
  profileImage: { type: String }, // Store as Base64 for now
  signatureImage: { type: String },
  layout: { type: mongoose.Schema.Types.Mixed, default: {} },
  cardId: { type: String, unique: true, immutable: true, sparse: true },
  qrSignature: { type: String, immutable: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  revokedAt: { type: Date, default: null }
}, {
  timestamps: true
});

export default mongoose.models.Journalist || mongoose.model('Journalist', journalistSchema);
