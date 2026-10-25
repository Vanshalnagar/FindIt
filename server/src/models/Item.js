import mongoose from 'mongoose';

export const CATEGORIES = ['electronics', 'books', 'clothing', 'accessories', 'id-cards', 'keys', 'bags', 'other'];
export const ITEM_STATUSES = ['open', 'resolved', 'closed'];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    location: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: null },
    status: { type: String, enum: ITEM_STATUSES, default: 'open', index: true },
    hidden: { type: Boolean, default: false, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

itemSchema.methods.toPublic = function toPublic(extra = {}) {
  const owner = this.owner && this.owner._id
    ? { id: this.owner._id.toString(), name: this.owner.name }
    : { id: String(this.owner), name: undefined };
  return {
    id: this._id.toString(),
    type: this.type,
    title: this.title,
    description: this.description,
    category: this.category,
    location: this.location,
    date: this.date,
    imageUrl: this.imageUrl ?? null,
    status: this.status,
    hidden: this.hidden,
    owner,
    createdAt: this.createdAt,
    ...extra,
  };
};

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
