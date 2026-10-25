import { Claim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/HttpError.js';

export const create = asyncHandler(async (req, res) => {
  const item = req.item;
  if (item.hidden) throw notFound('Item not found');
  if (item.type !== 'found') throw badRequest('Claims can only be made on found items');
  if (String(item.owner._id) === String(req.user._id)) throw forbidden('You cannot claim your own item');
  if (item.status !== 'open') throw conflict('This item is no longer open for claims');
  if (await Claim.exists({ item: item._id, claimant: req.user._id })) {
    throw conflict('You have already submitted a claim for this item');
  }
  let claim;
  try {
    claim = await Claim.create({ item: item._id, claimant: req.user._id, ...req.valid.body });
  } catch (e) {
    if (e?.code === 11000) throw conflict('You have already submitted a claim for this item');
    throw e;
  }
  await claim.populate('claimant', 'name');
  res.status(201).json({ claim: claim.toPublic() });
});

export const listForItem = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ item: req.item._id }).sort({ createdAt: -1 }).populate('claimant', 'name');
  res.json({ claims: claims.map((c) => c.toPublic()) });
});

export const mine = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ claimant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('claimant', 'name')
    .populate('item', 'title type status');
  res.json({ claims: claims.map((c) => c.toPublic()) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw notFound('Claim not found');
  const item = await Item.findById(claim.item);
  if (!item) throw notFound('Item not found');
  const allowed = req.user.role === 'admin' || String(item.owner) === String(req.user._id);
  if (!allowed) throw forbidden('Only the item owner or an admin can review claims');
  if (claim.status !== 'pending') throw conflict(`Claim has already been ${claim.status}`);

  const { status } = req.valid.body;
  claim.status = status;
  await claim.save();
  if (status === 'accepted') {
    item.status = 'resolved';
    await item.save();
    await Claim.updateMany({ item: item._id, _id: { $ne: claim._id }, status: 'pending' }, { $set: { status: 'rejected' } });
  }
  await claim.populate([{ path: 'claimant', select: 'name' }, { path: 'item', select: 'title type status' }]);
  res.json({ claim: claim.toPublic() });
});
