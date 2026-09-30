import { LeadModel } from '../models/Lead.model';

const LD_ID_PATTERN = /^LD(\d+)$/;

export const generateLeadId = async (): Promise<string> => {
  const lastLead = await LeadModel.findOne(
    { leadId: { $regex: /^LD\d+$/ } },
    { leadId: 1 },
    { sort: { createdAt: -1 } }
  );

  if (!lastLead?.leadId) {
    return 'LD0001';
  }

  const match = lastLead.leadId.match(LD_ID_PATTERN);
  const lastNumber = match ? parseInt(match[1], 10) : 0;
  return `LD${String(lastNumber + 1).padStart(4, '0')}`;
};
