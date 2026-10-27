import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  throw new Error('ضع ADMIN_EMAIL وADMIN_PASSWORD في .env أولًا.');
await connectDatabase(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
await User.findOneAndUpdate(
  { email: process.env.ADMIN_EMAIL.toLowerCase() },
  { passwordHash, role: 'owner' },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
);
console.log('تم تجهيز حساب صاحب المتجر.');
await mongoose.disconnect();
