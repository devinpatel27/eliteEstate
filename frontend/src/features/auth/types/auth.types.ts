export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    permissions: string[];
    profileImage?: string;
    forcePasswordChange: boolean;
  };
  forcePasswordChange: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
