// Seed script: Creates admin user in MongoDB
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Password with @ must be encoded as %40
const MONGODB_URI = 'mongodb+srv://ashokca810:ashokca810%40A@cluster0.psirpqa.mongodb.net/rk_tv_id?retryWrites=true&w=majority&appName=Cluster0';

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { collection: 'admin' });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    // Using updateOne with upsert: true to create or update
    await Admin.updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword } },
      { upsert: true }
    );
    
    console.log('\n--- Admin Credentials ---');
    console.log('Username: admin');
    console.log('Password: admin@123');
    console.log('-------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

seed();
