import { FilterQuery } from 'mongoose';
import { ILead } from '../../models/Lead.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';

// Fresh describes work not yet started, independently of the lead's open status.
// A creation-time initial remark is not a follow-up. Reassignment does not erase work.
export async function buildFreshLeadFilter(base: FilterQuery<ILead> = {}): Promise<FilterQuery<ILead>> {
  const workedLeadIds = await LeadFollowUpModel.distinct('leadId', {});
  return {
    ...base,
    deletedAt: null,
    status: { $in: ['open', 'new'] },
    $and: [
      ...(Array.isArray(base.$and) ? base.$and : []),
      ...(base.status ? [{ status: base.status }] : []),
      { _id: { $nin: workedLeadIds } },
    ],
  };
}
