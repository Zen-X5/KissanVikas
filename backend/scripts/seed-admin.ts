import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kissanvikas';


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer', required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

const polyhouseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    dimensions: {
      lengthM: { type: Number, default: 60.0 },
      widthM: { type: Number, default: 30.0 },
      heightM: { type: Number, default: 6.5 },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'under_survey', 'maintenance'],
      default: 'active',
    },
    twinStatus: {
      type: String,
      enum: ['not_created', 'building', 'ready', 'updating'],
      default: 'ready',
    },
  },
  { timestamps: true },
);

async function seed() {
  console.log('\n🌱 =======================================================');
  console.log('   KISSANVIKAS DATABASE SEEDER (ADMIN & CUSTOMER)');
  console.log('=======================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB at: ${MONGODB_URI}`);

  const User = mongoose.model('User', userSchema);
  const Polyhouse = mongoose.model('Polyhouse', polyhouseSchema);

  // 1. Seed Admin Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kissanvikas.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

  const adminHash = await bcrypt.hash(adminPassword, 10);


  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'KissanVikas Admin',
      email: adminEmail,
      passwordHash: adminHash,
      phone: '+91 98765 43210',
      role: 'admin',
      status: 'active',
    });
    console.log(`👑 [ADMIN CREATED] Email: ${adminEmail} | Password: ${adminPassword}`);
  } else {
    adminUser.passwordHash = adminHash;
    await adminUser.save();
    console.log(`👑 [ADMIN UPDATED] Email: ${adminEmail} | Password: ${adminPassword}`);
  }

  // 2. Seed Demo Customer Account
  const customerEmail = 'ramesh.farmer@kissanvikas.com';
  const customerPassword = 'Customer@1234';
  const customerHash = await bcrypt.hash(customerPassword, 10);

  let customerUser = await User.findOne({ email: customerEmail });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Ramesh Agro Farms',
      email: customerEmail,
      passwordHash: customerHash,
      phone: '+91 91234 56789',
      role: 'customer',
      status: 'active',
    });
    console.log(`👨‍🌾 [CUSTOMER CREATED] Email: ${customerEmail} | Password: ${customerPassword}`);
  } else {
    customerUser.passwordHash = customerHash;
    await customerUser.save();
    console.log(`👨‍🌾 [CUSTOMER UPDATED] Email: ${customerEmail} | Password: ${customerPassword}`);
  }

  // 3. Seed Demo Polyhouse for Customer
  const polyhouseName = 'Green Valley Smart Polyhouse #1';
  let polyhouse = await Polyhouse.findOne({ userId: customerUser._id, name: polyhouseName });
  if (!polyhouse) {
    polyhouse = await Polyhouse.create({
      userId: customerUser._id,
      name: polyhouseName,
      location: {
        latitude: 26.1445,
        longitude: 91.7362,
      },
      dimensions: {
        lengthM: 60.0,
        widthM: 30.0,
        heightM: 6.5,
      },
      status: 'active',
      twinStatus: 'ready',
    });
    console.log(`🌿 [POLYHOUSE CREATED] "${polyhouseName}" (${polyhouse._id}) for Customer ${customerUser.name}`);
  } else {
    console.log(`🌿 [POLYHOUSE FOUND] "${polyhouseName}" (${polyhouse._id})`);
  }

  console.log('\n=======================================================');
  console.log('✅ SEEDING COMPLETE! You can now log in:');
  console.log(`   👉 Admin:    ${adminEmail} / ${adminPassword}`);
  console.log(`   👉 Customer: ${customerEmail} / ${customerPassword}`);
  console.log('=======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeder Failed:', err);
  process.exit(1);
});
//npx ts-node scripts/seed-admin.ts
