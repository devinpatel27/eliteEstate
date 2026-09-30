export interface Role {
  _id: string;
  roleName: string;
  permissions: string[];
  description?: string;
  status: 'active' | 'inactive';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  roleName: string;
  permissions: string[];
  description?: string;
  status: 'active' | 'inactive';
}

export interface UpdateRoleData extends Partial<CreateRoleData> {}
