'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '../services/auth.service';
import { LoginFormValues, ChangePasswordFormValues } from '../schemas/auth.schema';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await authService.login(values);
      if (response.success && response.data) {
        const { token, user } = response.data;
        setAuth(
          {
            _id: user._id,
            employeeId: user.employeeId,
            name: user.name,
            email: user.email,
            role: user.role,
            roleId: user.roleId,
            permissions: user.permissions,
            profileImage: user.profileImage,
            forcePasswordChange: user.forcePasswordChange,
          },
          token
        );

        router.replace('/dashboard');
        toast.success(`Welcome back, ${user.name || user.email}!`, { duration: 2500 });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuth();
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  const changePassword = async (values: ChangePasswordFormValues) => {
    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      const store = useAuthStore.getState();
      if (store.user) {
        store.updateUser({ forcePasswordChange: false });
      }

      toast.success('Password changed successfully');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to change password.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { login, logout, changePassword, isLoading };
}
