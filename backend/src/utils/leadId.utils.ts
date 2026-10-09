import { LeadModel } from '../models/Lead.model';

const LD_ID_PATTERN = /^LD(\d+)$/;

export const generateLeadId = async (): Promise<string> => {
  const leads = await LeadModel.find({ leadId: { $regex: /^LD\d+$/ } }).select('leadId');
  const lastNumber = leads.reduce((max, lead) => Math.max(max, Number(lead.leadId.match(LD_ID_PATTERN)?.[1] || 0)), 0);
  return `LD${String(lastNumber + 1).padStart(4, '0')}`;
};
