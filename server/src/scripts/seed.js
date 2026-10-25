import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { getConfig } from '../config/index.js';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';

const config = getConfig();
if (config.isProd && !process.argv.includes('--force')) {
  console.error('Refusing to seed when NODE_ENV=production. Re-run with --force if you really mean it (this WIPES users, items and claims).');
  process.exit(1);
}

// Demo-only password for fictional accounts; override with SEED_PASSWORD.
const password = process.env.SEED_PASSWORD || 'Demo12345';
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

await mongoose.connect(config.mongoUri);
try {
  await Promise.all([User.deleteMany({}), Item.deleteMany({}), Claim.deleteMany({})]);
  const passwordHash = await bcrypt.hash(password, 10);
  const [admin, ana, ben, chloe] = await User.create([
    { name: 'Demo Admin', email: 'admin@example.test', role: 'admin', passwordHash },
    { name: 'Ana Rivera', email: 'ana@example.test', passwordHash },
    { name: 'Ben Okafor', email: 'ben@example.test', passwordHash },
    { name: 'Chloe Tan', email: 'chloe@example.test', passwordHash },
  ]);

  const items = await Item.create([
    { type: 'lost', title: 'Blue water bottle', description: 'Insulated blue bottle with a faded sticker of a mountain on the side.', category: 'other', location: 'Main Library, 2nd floor', date: daysAgo(2), owner: ana._id, imageUrl: '/uploads/demo-blue-water-bottle.svg' },
    { type: 'found', title: 'Black laptop charger', description: 'USB-C charger with a braided cable, found plugged in near the window desks.', category: 'electronics', location: 'Science Building Room 204', date: daysAgo(1), owner: ben._id, imageUrl: '/uploads/demo-laptop-charger.svg' },
    { type: 'found', title: 'Set of three keys', description: 'Three keys on a red carabiner with a small brass tag.', category: 'keys', location: 'Student Union cafe', date: daysAgo(3), owner: chloe._id, imageUrl: '/uploads/demo-keys.svg' },
    { type: 'lost', title: 'Student ID card', description: 'Student ID in a clear plastic sleeve, name begins with the letter K.', category: 'id-cards', location: 'Gym entrance', date: daysAgo(4), owner: ben._id, imageUrl: '/uploads/demo-student-id.svg' },
    { type: 'found', title: 'Green backpack', description: 'Dark green backpack with a laptop sleeve and a notebook inside.', category: 'bags', location: 'Bus stop near North Gate', date: daysAgo(5), owner: ana._id, status: 'resolved', imageUrl: '/uploads/demo-green-backpack.svg' },
    { type: 'lost', title: 'Calculus textbook', description: 'Hardcover calculus textbook with highlighted chapters and a name written inside the cover.', category: 'books', location: 'Lecture Hall B', date: daysAgo(6), owner: chloe._id, imageUrl: '/uploads/demo-calculus-textbook.svg' },
    { type: 'found', title: 'Grey wool scarf', description: 'Long grey wool scarf with a fringe, left on a bench.', category: 'clothing', location: 'Quad benches', date: daysAgo(7), owner: ben._id, imageUrl: '/uploads/demo-grey-scarf.svg' },
    { type: 'lost', title: 'Silver wristwatch', description: 'Small silver wristwatch with a leather strap and a cracked clasp.', category: 'accessories', location: 'Sports field', date: daysAgo(8), owner: ana._id, status: 'closed', imageUrl: '/uploads/demo-wristwatch.svg' },
    { type: 'found', title: 'Wireless earbuds case', description: 'White earbuds charging case with a small scratch on the lid.', category: 'electronics', location: 'Library study room 3', date: daysAgo(1), owner: chloe._id, imageUrl: '/uploads/demo-earbuds.svg' },
    { type: 'found', title: 'Umbrella (hidden example)', description: 'Large black umbrella, listing hidden by moderators as an example.', category: 'other', location: 'Admin building lobby', date: daysAgo(9), owner: ben._id, hidden: true, imageUrl: '/uploads/demo-umbrella.svg' },
  ]);

  const byTitle = (t) => items.find((i) => i.title === t);
  await Claim.create([
    { item: byTitle('Black laptop charger')._id, claimant: ana._id, message: 'I think this is mine, I left it on Tuesday.', proof: 'It has a small piece of blue tape near the plug end.', status: 'pending' },
    { item: byTitle('Set of three keys')._id, claimant: ben._id, message: 'These look like my dorm keys.', proof: 'The brass tag has the number 14 scratched on it.', status: 'pending' },
    { item: byTitle('Green backpack')._id, claimant: chloe._id, message: 'This is my backpack from last week.', proof: 'Inside is a notebook labelled Chemistry 101.', status: 'accepted' },
  ]);

  console.log(`Seeded ${await User.countDocuments()} users, ${items.length} items, ${await Claim.countDocuments()} claims.`);
  console.log(`Accounts: admin@example.test, ana@example.test, ben@example.test, chloe@example.test (password: ${password})`);
  void admin;
} finally {
  await mongoose.disconnect();
}
