import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { forbidden, notFound } from '../utils/HttpError.js';
import { removeUploadedFile } from '../middleware/upload.js';

const isAdmin = (u) => u?.role === 'admin';
const isOwner = (u, item) => u && String(item.owner._id ?? item.owner) === String(u._id);

export async function claimCounts(ids) {
  if (!ids.length) return new Map();
  const rows = await Claim.aggregate([{ $match: { item: { $in: ids } } }, { $group: { _id: '$item', n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

export async function paginate(filter, { page, limit }) {
  const [total, docs] = await Promise.all([
    Item.countDocuments(filter),
    Item.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate('owner', 'name'),
  ]);
  const counts = await claimCounts(docs.map((d) => d._id));
  return {
    items: docs.map((d) => d.toPublic({ claimCount: counts.get(String(d._id)) ?? 0 })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Loads :id into req.item (owner populated). 404 if missing. */
export const loadItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).populate('owner', 'name');
  if (!item) throw notFound('Item not found');
  req.item = item;
  next();
});

export const requireItemManager = (req, res, next) =>
  isOwner(req.user, req.item) || isAdmin(req.user) ? next() : next(forbidden('Only the item owner or an admin can do that'));

export const list = asyncHandler(async (req, res) => {
  const { search, type, category, status, location, page, limit } = req.valid.query;
  const filter = { hidden: false };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { description: re }, { location: re }];
  }
  res.json(await paginate(filter, { page, limit }));
});

export const mine = asyncHandler(async (req, res) => {
  const docs = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('owner', 'name');
  const counts = await claimCounts(docs.map((d) => d._id));
  res.json({ items: docs.map((d) => d.toPublic({ claimCount: counts.get(String(d._id)) ?? 0 })) });
});

export const getOne = (req, res) => {
  const item = req.item;
  if (item.hidden && !isOwner(req.user, item) && !isAdmin(req.user)) throw notFound('Item not found');
  return Claim.countDocuments({ item: item._id }).then((n) => res.json({ item: item.toPublic({ claimCount: n }) }));
};

export const create = asyncHandler(async (req, res) => {
  const item = await Item.create({
    ...req.valid.body,
    imageUrl: req.uploadedImageUrl || null,
    owner: req.user._id,
  });
  req.keepUpload = true;
  await item.populate('owner', 'name');
  res.status(201).json({ item: item.toPublic() });
});

export const update = asyncHandler(async (req, res) => {
  const { status, removeImage, ...fields } = req.valid.body;
  const item = req.item;
  if (status !== undefined) {
    // Owners may only toggle open/closed; admins may set any status.
    if (!isAdmin(req.user) && !['open', 'closed'].includes(status)) {
      throw forbidden("Owners can only set status to 'open' or 'closed'");
    }
    item.status = status;
  }
  Object.assign(item, fields);
  const oldImage = item.imageUrl;
  if (req.uploadedImageUrl) item.imageUrl = req.uploadedImageUrl;
  else if (removeImage === true || removeImage === 'true') item.imageUrl = null;
  await item.save();
  req.keepUpload = true;
  if (oldImage && oldImage !== item.imageUrl) removeUploadedFile(oldImage);
  res.json({ item: item.toPublic() });
});

export const close = asyncHandler(async (req, res) => {
  req.item.status = 'closed';
  await req.item.save();
  res.json({ item: req.item.toPublic() });
});

export const remove = asyncHandler(async (req, res) => {
  await Claim.deleteMany({ item: req.item._id });
  await req.item.deleteOne();
  removeUploadedFile(req.item.imageUrl);
  res.json({ ok: true });
});
