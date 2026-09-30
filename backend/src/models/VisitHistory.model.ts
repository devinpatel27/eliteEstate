import { Schema, model, Document, Types } from 'mongoose';
import { VISIT_HISTORY_ACTIONS, VisitHistoryAction } from '../constants/visit.constants';

export interface IVisitHistory extends Document {
  visitId: Types.ObjectId;
  action: VisitHistoryAction;
  remark?: string;
  performedBy: Types.ObjectId;
  performedAt: Date;
  metadata?: Record<string, unknown>;
}

const visitHistorySchema = new Schema<IVisitHistory>(
  {
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true, index: true },
    action: { type: String, enum: VISIT_HISTORY_ACTIONS, required: true },
    remark: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

visitHistorySchema.index({ visitId: 1, performedAt: -1 });

export const VisitHistoryModel = model<IVisitHistory>('VisitHistory', visitHistorySchema);
