/**
 * One-off: sync Lead.nextFollowUpDate from each lead's latest LeadFollowUp.
 *
 * Schedule buckets (Today / Tomorrow / Due) use Lead.nextFollowUpDate only.
 * Past follow-ups must not keep a stale NFD on the lead.
 *
 * For every non-deleted lead:
 *  - Load latest LeadFollowUp (followUpDate desc, createdAt desc)
 *  - Set Lead.nextFollowUpDate to that document's nextFollowUpDate
 *  - Or unset it if the latest follow-up has none / there are no follow-ups
 *
 * Usage (from backend/, with .env containing MONGODB_URI):
 *   npm run backfill:latest-nfd
 */
import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { LeadModel } from '../models/Lead.model';
import { LeadFollowUpModel } from '../models/LeadFollowUp.model';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function backfillLatestNfd(): Promise<void> {
  await mongoose.connect(env.DATABASE_URL, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ MongoDB connected');

  const leads = await LeadModel.find({ deletedAt: null }).select('_id nextFollowUpDate').lean();
  console.log(`Found ${leads.length} leads to sync`);

  let updated = 0;
  let cleared = 0;
  let unchanged = 0;

  for (const lead of leads) {
    const latest = await LeadFollowUpModel.findOne({ leadId: lead._id })
      .sort({ followUpDate: -1, createdAt: -1 })
      .select('nextFollowUpDate')
      .lean();

    const latestNfd = latest?.nextFollowUpDate
      ? new Date(latest.nextFollowUpDate).getTime()
      : null;
    const currentNfd = lead.nextFollowUpDate
      ? new Date(lead.nextFollowUpDate).getTime()
      : null;

    if (latestNfd !== null) {
      if (currentNfd === latestNfd) {
        unchanged += 1;
        continue;
      }
      await LeadModel.updateOne(
        { _id: lead._id },
        { $set: { nextFollowUpDate: new Date(latest!.nextFollowUpDate!) } }
      );
      updated += 1;
      continue;
    }

    // Latest follow-up has no NFD, or there are no follow-ups → clear lead NFD
    if (currentNfd === null) {
      unchanged += 1;
      continue;
    }

    await LeadModel.updateOne({ _id: lead._id }, { $unset: { nextFollowUpDate: 1 } });
    cleared += 1;
  }

  console.log(`✅ Backfill complete: ${updated} set, ${cleared} cleared, ${unchanged} unchanged`);
}

backfillLatestNfd()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected');
    }
  });
