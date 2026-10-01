'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Building2,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loginSchema, LoginFormValues } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07110e]">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,66,51,0.18),rgba(7,17,14,0.9))]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[440px] login-fade-up">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-emerald-600 shadow-2xl shadow-emerald-900/40 ring-1 ring-amber-200/30 transition-transform duration-300 hover:scale-105">
              <Building2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Elite Estate
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Enterprise CRM Management System
            </p>
          </div>

          {/* Login card */}
          <div className="login-glass-card rounded-3xl p-8 sm:p-9">
            <div className="mb-7">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Secure Access
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Sign in to access your Elite Estate CRM dashboard
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                render={({ field: { onBlur, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-300">
                      Email Address
                    </FormLabel>
                    <FormControl>
                        <div
                          className={cn(
                            'login-input-wrap group',
                            focusedField === 'email' && 'login-input-wrap-active'
                          )}
                        >
                          <Mail className="login-input-icon" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            disabled={isLoading}
                            className="login-input"
                            {...fieldProps}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => {
                              onBlur();
                              setFocusedField(null);
                            }}
                          />
                        </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
                />

                <FormField
                  control={form.control}
                  name="password"
                render={({ field: { onBlur, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-300">
                      Password
                    </FormLabel>
                    <FormControl>
                        <div
                          className={cn(
                            'login-input-wrap group',
                            focusedField === 'password' && 'login-input-wrap-active'
                          )}
                        >
                          <Lock className="login-input-icon" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="login-input pr-12"
                            {...fieldProps}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => {
                              onBlur();
                              setFocusedField(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition-all hover:bg-white/10 hover:text-white"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="login-submit-btn group mt-2 h-12 w-full rounded-xl text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Elite Estate. Internal use only.
          </p>
        </div>
      </div>
    </div>
  );
}
