export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;
  role: {
    _id: string;
    roleName: string;
  };
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joiningDate?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  forcePasswordChange: boolean;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joiningDate?: string;
  status: 'active' | 'inactive';
  profileImage?: File | null;
}

export interface UpdateEmployeeData extends Partial<Omit<CreateEmployeeData, 'password'>> {}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
