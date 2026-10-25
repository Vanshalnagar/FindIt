import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    proof: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
claimSchema.index({ item: 1, claimant: 1 }, { unique: true });

claimSchema.methods.toPublic = function toPublic() {
  const item = this.populated('item')
  ? {
      id: this.item._id.toString(),
      title: this.item.title,
      type: this.item.type,
      status: this.item.status,
    }
  : String(this.item);
  const claimant = this.claimant && this.claimant._id
    ? { id: this.claimant._id.toString(), name: this.claimant.name }
    : { id: String(this.claimant) };
  return {
    id: this._id.toString(),
    item,
    claimant,
    message: this.message,
    proof: this.proof,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export const Claim = mongoose.models.Claim || mongoose.model('Claim', claimSchema);
