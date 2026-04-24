import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  brandName: { type: String, default: 'RK Vision News TV' },
  dashboardTitle: { type: String, default: 'Management Dashboard' },
  applyTitle: { type: String, default: 'Employee ID Card Application' },
  adminLoginLabel: { type: String, default: 'ADMIN LOGIN' },
  logoUrl: { type: String, default: '/logo.jpg' }
}, { timestamps: true });

export default mongoose.models.AppSettings || mongoose.model('AppSettings', appSettingsSchema);
