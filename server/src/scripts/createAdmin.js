import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { getConfig } from '../config/index.js';
import { User } from '../models/User.js';
import { registerSchema } from '../controllers/schemas.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required (ADMIN_NAME optional).');
  process.exit(1);
}
const parsed = registerSchema.safeParse({ name: ADMIN_NAME || 'Administrator', email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
if (!parsed.success) {
  for (const i of parsed.error.issues) console.error(`- ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}
const { name, email, password } = parsed.data;

await mongoose.connect(getConfig().mongoUri);
try {
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`Existing user ${email} promoted to admin (password unchanged).`);
  } else {
    await User.create({ name, email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
    console.log(`Admin ${email} created.`);
  }
} finally {
  await mongoose.disconnect();
}
