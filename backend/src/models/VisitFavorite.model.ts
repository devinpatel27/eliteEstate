import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisitFavorite extends Document {
  userId: Types.ObjectId;
  visitId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const visitFavoriteSchema = new Schema<IVisitFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
  },
  { timestamps: true }
);

visitFavoriteSchema.index({ userId: 1, visitId: 1 }, { unique: true });
visitFavoriteSchema.index({ userId: 1 });

export const VisitFavoriteModel = mongoose.model<IVisitFavorite>(
  'VisitFavorite',
  visitFavoriteSchema
);
