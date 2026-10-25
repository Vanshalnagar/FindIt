import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/HttpError.js';
import { paginate } from './itemController.js';

export const stats = asyncHandler(async (req, res) => {
  const [users, items, lostItems, foundItems, openItems, resolvedItems, closedItems, hiddenItems, pendingClaims, totalClaims] =
    await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'open' }),
      Item.countDocuments({ status: 'resolved' }),
      Item.countDocuments({ status: 'closed' }),
      Item.countDocuments({ hidden: true }),
      Claim.countDocuments({ status: 'pending' }),
      Claim.countDocuments(),
    ]);
  res.json({ stats: { users, items, lostItems, foundItems, openItems, resolvedItems, closedItems, hiddenItems, pendingClaims, totalClaims } });
});

export const listItems = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.valid.query;
  res.json(await paginate(status ? { status } : {}, { page, limit }));
});

export const hideItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('owner', 'name');
  if (!item) throw notFound('Item not found');
  item.hidden = req.valid.body.hidden;
  await item.save();
  res.json({ item: item.toPublic() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => ({ ...u.toPublic(), createdAt: u.createdAt })) });
});
