import { connectDatabase, disconnectDatabase } from '../config/database';
import { LeadModel } from '../models/Lead.model';
import { VisitModel } from '../models/Visit.model';
import { LeadActivityModel } from '../models/LeadActivity.model';
import { UserModel } from '../models/User.model';
import { env } from '../config/env';

export async function closeAllOverdueLeads(): Promise<{ closedCount: number; visitsCancelled: number }> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const admin = await UserModel.findOne({ email: env.ADMIN_EMAIL }).lean();
  const adminId = admin?._id;

  // 1. Find all active leads with overdue nextFollowUpDate
  const overdueFollowUpLeadIds = await LeadModel.distinct('_id', {
    status: 'open',
    deletedAt: null,
    nextFollowUpDate: { $lt: startOfDay },
  });

  // 2. Find all active leads with overdue scheduled visits
  const overdueVisitLeadIds = await VisitModel.distinct('leadId', {
    status: 'scheduled',
    scheduledDate: { $lt: startOfDay },
  });

  const allTargetLeadIds = Array.from(
    new Set([...overdueFollowUpLeadIds.map(String), ...overdueVisitLeadIds.map(String)])
  );

  console.log(`Found ${allTargetLeadIds.length} overdue leads to close.`);

  if (allTargetLeadIds.length === 0) {
    return { closedCount: 0, visitsCancelled: 0 };
  }

  // 3. Bulk update leads to 'closed' and unset nextFollowUpDate
  const leadUpdateResult = await LeadModel.updateMany(
    { _id: { $in: allTargetLeadIds }, status: 'open' },
    {
      $set: { status: 'closed' },
      $unset: { nextFollowUpDate: 1 },
    }
  );

  // 4. Cancel past scheduled visits
  const visitUpdateResult = await VisitModel.updateMany(
    {
      leadId: { $in: allTargetLeadIds },
      status: 'scheduled',
      scheduledDate: { $lt: startOfDay },
    },
    {
      $set: { status: 'cancelled' },
    }
  );

  // 5. Insert system activity log
  if (adminId) {
    await LeadActivityModel.create({
      leadId: allTargetLeadIds[0],
      performedBy: adminId,
      type: 'STATUS_CHANGED',
      title: 'Bulk Overdue Leads Closed',
      description: `Bulk closed ${leadUpdateResult.modifiedCount} overdue leads and cancelled ${visitUpdateResult.modifiedCount} past visits.`,
    });
  }

  console.log(`✅ Successfully closed ${leadUpdateResult.modifiedCount} overdue leads.`);
  console.log(`✅ Successfully cancelled ${visitUpdateResult.modifiedCount} past scheduled visits.`);

  return {
    closedCount: leadUpdateResult.modifiedCount,
    visitsCancelled: visitUpdateResult.modifiedCount,
  };
}

if (require.main === module) {
  connectDatabase()
    .then(() => closeAllOverdueLeads())
    .then(() => disconnectDatabase())
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error closing overdue leads:', err);
      process.exit(1);
    });
}
