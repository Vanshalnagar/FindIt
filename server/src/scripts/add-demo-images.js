import mongoose from 'mongoose';
import { getConfig } from '../config/index.js';
import { Item } from '../models/Item.js';

const config = getConfig();

const demoImages = [
  ['Blue water bottle', '/uploads/demo-blue-water-bottle.svg'],
  ['Black laptop charger', '/uploads/demo-laptop-charger.svg'],
  ['Set of three keys', '/uploads/demo-keys.svg'],
  ['Student ID card', '/uploads/demo-student-id.svg'],
  ['Green backpack', '/uploads/demo-green-backpack.svg'],
  ['Calculus textbook', '/uploads/demo-calculus-textbook.svg'],
  ['Grey wool scarf', '/uploads/demo-grey-scarf.svg'],
  ['Silver wristwatch', '/uploads/demo-wristwatch.svg'],
  ['Wireless earbuds case', '/uploads/demo-earbuds.svg'],
  ['Umbrella (hidden example)', '/uploads/demo-umbrella.svg'],
];

await mongoose.connect(config.mongoUri);
try {
  let updated = 0;
  for (const [title, imageUrl] of demoImages) {
    const result = await Item.updateOne({ title }, { $set: { imageUrl } });
    updated += result.modifiedCount;
  }
  console.log(`Added demo images to ${updated} existing item(s).`);
} finally {
  await mongoose.disconnect();
}
