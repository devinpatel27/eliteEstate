export const LEAD_VISIT_CHANGED = 'crm:lead-visit-changed';

export function notifyLeadVisitChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LEAD_VISIT_CHANGED));
}
