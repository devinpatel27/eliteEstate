export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  EMPLOYEE_MANAGE: 'employee:manage',
  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  PROFILE_UPDATE: 'profile:update',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  LEAD_READ: 'lead:read',
  LEAD_READ_ASSIGNED: 'lead:read_assigned',
  LEAD_CREATE: 'lead:create',
  LEAD_UPDATE: 'lead:update',
  LEAD_DELETE: 'lead:delete',
  LEAD_TRANSFER: 'lead:transfer',
  LEAD_STATUS_UPDATE: 'lead:status:update',
  LEAD_FOLLOWUP_CREATE: 'lead:followup:create',
  LEAD_NOTE_CREATE: 'lead:note:create',
  LEAD_TIMELINE_FULL: 'lead:timeline:full',
  LEAD_MASTER_MANAGE: 'lead:master:manage',
  VISIT_READ: 'visit:read',
  VISIT_READ_ASSIGNED: 'visit:read_assigned',
  VISIT_CREATE: 'visit:create',
  VISIT_UPDATE: 'visit:update',
  VISIT_FAVORITE: 'visit:favorite',
  PROPERTY_READ: 'property:read',
  PROPERTY_CREATE: 'property:create',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  PROPERTY_PUBLISH: 'property:publish',
  PROPERTY_MASTER_MANAGE: 'property:master:manage',
  SETTINGS_MANAGE: 'settings:manage',
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',
  WILDCARD: '*',
} as const;

export const ALL_PERMISSIONS = [
  { key: PERMISSIONS.DASHBOARD_READ, label: 'View Dashboard', group: 'Dashboard' },
  { key: PERMISSIONS.EMPLOYEE_READ, label: 'View Employees', group: 'Employee Management' },
  { key: PERMISSIONS.EMPLOYEE_CREATE, label: 'Create Employees', group: 'Employee Management' },
  { key: PERMISSIONS.EMPLOYEE_UPDATE, label: 'Edit Employees', group: 'Employee Management' },
  { key: PERMISSIONS.EMPLOYEE_DELETE, label: 'Delete Employees', group: 'Employee Management' },
  { key: PERMISSIONS.EMPLOYEE_MANAGE, label: 'Manage Employees (Activate/Deactivate/Reset Password)', group: 'Employee Management' },
  { key: PERMISSIONS.ROLE_READ, label: 'View Roles', group: 'Role Management' },
  { key: PERMISSIONS.ROLE_CREATE, label: 'Create Roles', group: 'Role Management' },
  { key: PERMISSIONS.ROLE_UPDATE, label: 'Edit Roles', group: 'Role Management' },
  { key: PERMISSIONS.ROLE_DELETE, label: 'Delete Roles', group: 'Role Management' },
  { key: PERMISSIONS.PROFILE_UPDATE, label: 'Update Own Profile', group: 'Profile' },
  { key: PERMISSIONS.SETTINGS_READ, label: 'View Settings', group: 'Settings' },
  { key: PERMISSIONS.SETTINGS_UPDATE, label: 'Manage Settings', group: 'Settings' },
  { key: PERMISSIONS.LEAD_READ, label: 'View All Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_READ_ASSIGNED, label: 'View Assigned Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_CREATE, label: 'Create Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_UPDATE, label: 'Edit Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_DELETE, label: 'Delete Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_TRANSFER, label: 'Transfer Leads', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_STATUS_UPDATE, label: 'Update Lead Status', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_FOLLOWUP_CREATE, label: 'Add Follow-Ups', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_NOTE_CREATE, label: 'Add Lead Notes', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_TIMELINE_FULL, label: 'View Full Lead Timeline', group: 'Lead Management' },
  { key: PERMISSIONS.LEAD_MASTER_MANAGE, label: 'Manage Property Types & Sources', group: 'Lead Management' },
  { key: PERMISSIONS.VISIT_READ, label: 'View All Visits', group: 'Visit Management' },
  { key: PERMISSIONS.VISIT_READ_ASSIGNED, label: 'View Assigned Visits', group: 'Visit Management' },
  { key: PERMISSIONS.VISIT_CREATE, label: 'Create Visits', group: 'Visit Management' },
  { key: PERMISSIONS.VISIT_UPDATE, label: 'Update Visits', group: 'Visit Management' },
  { key: PERMISSIONS.VISIT_FAVORITE, label: 'Favorite Visits', group: 'Visit Management' },
  { key: PERMISSIONS.PROPERTY_READ, label: 'View Properties', group: 'Property Management' },
  { key: PERMISSIONS.PROPERTY_CREATE, label: 'Create Properties', group: 'Property Management' },
  { key: PERMISSIONS.PROPERTY_UPDATE, label: 'Edit Properties', group: 'Property Management' },
  { key: PERMISSIONS.PROPERTY_DELETE, label: 'Delete Properties', group: 'Property Management' },
  { key: PERMISSIONS.PROPERTY_PUBLISH, label: 'Publish & Feature Properties', group: 'Property Management' },
  { key: PERMISSIONS.PROPERTY_MASTER_MANAGE, label: 'Manage Property Amenities', group: 'Property Management' },
  { key: PERMISSIONS.SETTINGS_MANAGE, label: 'Manage System Settings', group: 'Settings' },
  { key: PERMISSIONS.REPORT_READ, label: 'View Reports', group: 'Reports & Analytics' },
  { key: PERMISSIONS.REPORT_EXPORT, label: 'Export Reports', group: 'Reports & Analytics' },
];

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  EMPLOYEES_CREATE: '/employees/create',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}`,
  EMPLOYEE_EDIT: (id: string) => `/employees/${id}/edit`,
  ROLES: '/roles',
  ROLE_EDIT: (id: string) => `/roles/${id}/edit`,
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  LEADS: '/leads',
  LEADS_CREATE: '/leads/create',
  LEAD_DETAIL: (id: string) => `/leads/${id}`,
  LEAD_EDIT: (id: string) => `/leads/${id}/edit`,
  PROPERTY_TYPES: '/settings/property-types',
  LEAD_SOURCES: '/settings/lead-sources',
  VISITS: '/visits',
  PROPERTIES: '/properties',
  PROPERTIES_CREATE: '/properties/new',
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  PROPERTY_AMENITIES: '/settings/property-amenities',
  LEAD_ASSIGNMENT: '/settings/lead-assignment',
  REPORTS_OVERVIEW: '/reports/overview',
  REPORTS_LEADS: '/reports/leads',
  REPORTS_EMPLOYEES: '/reports/employees',
  REPORTS_PROPERTIES: '/reports/properties',
  REPORTS_VISITS: '/reports/visits',
} as const;

export const PROPERTY_PURPOSES = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'rent', label: 'Rent' },
] as const;

export const PROPERTY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'under_negotiation', label: 'Under Negotiation' },
] as const;

export const FURNISHED_STATUSES = [
  { value: 'fully', label: 'Fully Furnished' },
  { value: 'semi', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
] as const;

export const VISIT_TYPES = [
  { value: 'property_visit', label: 'Property Visit' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'revisit', label: 'Re-Visit' },
] as const;

export const VISIT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
] as const;

export const LEAD_CATEGORIES = [
  { value: 'buy_property', label: 'Buy Property', shortLabel: 'Buy' },
  { value: 'sell_property', label: 'Sell Property', shortLabel: 'Sell' },
  { value: 'rent_property', label: 'Rent Property', shortLabel: 'Rent' },
] as const;

export const LEAD_PRIORITIES = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
] as const;

export const LEAD_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'hold', label: 'Hold' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
] as const;

export const FOLLOW_UP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'property_visit', label: 'Property Visit' },
  { value: 'revisit', label: 'Re-Visit' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'email', label: 'Email' },
  { value: 'negotiation', label: 'Negotiation' },
] as const;

export const AUTH_COOKIE = 'crm_token';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
