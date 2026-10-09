/** Imports only the requested enquiry columns. Dry run by default; --apply writes.
 * DATABASE_URL must point explicitly at the intended target. No app env fallback.
 * Input is JSON extracted by header from the RENT/BUY enquiry sheets.
 */
import { Client } from 'pg';
import { readFileSync, writeFileSync } from 'fs';
import { randomBytes, createHash } from 'crypto';

type Row = { sheet: string; row: number; createdAt: string; customerName: string; mobile: string; source: string; category: string; initialRemark: string };
const oid = () => randomBytes(12).toString('hex');
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Explicit DATABASE_URL required');
  const rows: Row[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const records = (await db.query('SELECT collection,id,data FROM crm_documents')).rows;
    const roles = records.filter(r => r.collection === 'roles' && r.data.roleName === 'master_admin').map(r => r.id);
    const admin = records.find(r => r.collection === 'users' && roles.includes(r.data.role));
    if (!admin) throw new Error('Target database must already have a Master Admin');
    const leads = records.filter(r => r.collection === 'leads');
    let number = Math.max(0, ...leads.map(r => Number(/^LD(\d+)$/.exec(r.data.leadId)?.[1] || 0)));
    const sources = new Map<string, string>(records.filter(r => r.collection === 'leadsources').map(r => [String(r.data.name).trim().toLowerCase().replace(/\s/g, ''), r.id]));
    const inserts: { collection: string; id: string; data: any }[] = [];
    const report: { imported: number; alreadyImported: number; issues: any[]; sheets: Record<string, number> } = { imported: 0, alreadyImported: 0, issues: [], sheets: {} };
    for (const row of rows) {
      const key = createHash('sha256').update(JSON.stringify([row.sheet,row.row,row.createdAt,row.customerName,row.mobile,row.source,row.category,row.initialRemark])).digest('hex');
      if (leads.some(l => l.data.enquiryImportKey === key)) { report.alreadyImported++; continue; }
      const mobile = row.mobile.replace(/\D/g, '');
      if (!row.customerName || !mobile || mobile.length < 10 || !row.createdAt || Number.isNaN(Date.parse(row.createdAt)) || !['buy_property','rent_property','sell_property'].includes(row.category)) {
        report.issues.push({ sheet: row.sheet, row: row.row, reason: 'Missing or invalid required enquiry field' }); continue;
      }
      const sourceKey = row.source.trim().toLowerCase().replace(/\s/g, '');
      if (!sourceKey) { report.issues.push({ sheet: row.sheet, row: row.row, reason: 'Missing source' }); continue; }
      let sourceId = sources.get(sourceKey);
      if (!sourceId) { sourceId = oid(); sources.set(sourceKey, sourceId); inserts.push({collection:'leadsources',id:sourceId,data:{_id:sourceId,name:row.source.trim(),status:'active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}); }
      const id = oid();
      const data = { _id:id, leadId:`LD${String(++number).padStart(4,'0')}`, customerName:row.customerName.trim(), mobile:mobile.length === 12 && mobile.startsWith('91') ? mobile.slice(2) : mobile,
        category:row.category, leadSource:sourceId, initialRemark:row.initialRemark.trim(), createdAt:row.createdAt, updatedAt:row.createdAt,
        createdBy:admin.id, status:'open', priority:'warm', notes:[], deletedAt:null, enquiryImportKey:key };
      inserts.push({collection:'leads',id,data});
      report.imported++; report.sheets[row.sheet]=(report.sheets[row.sheet]||0)+1;
    }
    if (process.argv.includes('--apply')) {
      await db.query('BEGIN');
      try {
        await db.query("LOCK TABLE crm_documents IN SHARE ROW EXCLUSIVE MODE");
        // Reject a stale dry-run plan if another importer has written meanwhile.
        const current = Number((await db.query("SELECT count(*) FROM crm_documents WHERE collection='leads'")).rows[0].count);
        if (current !== leads.length) throw new Error('Leads changed during planning; rerun import');
        for (const item of inserts) await db.query('INSERT INTO crm_documents(collection,id,data,created_at,updated_at) VALUES($1,$2,$3,$4,$4)',[item.collection,item.id,JSON.stringify(item.data),item.data.createdAt]);
        await db.query('COMMIT');
      } catch (error) { await db.query('ROLLBACK'); throw error; }
      const verify = (await db.query("SELECT data FROM crm_documents WHERE collection='leads' AND data ? 'enquiryImportKey'")).rows;
      const keys = new Set(rows.map(row => createHash('sha256').update(JSON.stringify([row.sheet,row.row,row.createdAt,row.customerName,row.mobile,row.source,row.category,row.initialRemark])).digest('hex')));
      const imported = verify.filter(r => keys.has(r.data.enquiryImportKey));
      if (imported.length !== report.imported + report.alreadyImported || imported.some(r => r.data.assignedTo || r.data.propertyType || r.data.budgetMin || r.data.preferredArea)) throw new Error('Post-import verification failed');
      for (const record of imported) {
        const row = rows.find(row => createHash('sha256').update(JSON.stringify([row.sheet,row.row,row.createdAt,row.customerName,row.mobile,row.source,row.category,row.initialRemark])).digest('hex') === record.data.enquiryImportKey)!;
        const digits = row.mobile.replace(/\D/g, '');
        const expectedMobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        if (record.data.customerName !== row.customerName.trim() || record.data.mobile !== expectedMobile || record.data.category !== row.category || record.data.initialRemark !== row.initialRemark.trim() || new Date(record.data.createdAt).getTime() !== new Date(row.createdAt).getTime() || record.data.leadSource !== sources.get(row.source.trim().toLowerCase().replace(/\s/g,''))) throw new Error(`Mapping mismatch: ${row.sheet} row ${row.row}`);
      }
      console.log('Verified stored mappings and blank assignments:', imported.length);
    }
    writeFileSync(process.argv[2].replace(/\.json$/, '.report.json'), JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
