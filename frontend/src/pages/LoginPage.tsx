import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthIntro } from '../components/layout/AuthIntro';
import { useAuth } from '../context/AuthContext';
import { useSlowNote, WAKING_NOTE } from '../hooks/useSlowNote';
import api from '../api/axios';
import type { AuthResponse } from '../types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [guestLoading, setGuestLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // The first request after a pause can take about a minute on the free host: say so.
  const slow = useSlowNote(guestLoading || isSubmitting);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      login(response.data.data.token, response.data.data.user);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  // One click: the server makes a throwaway account with sample applications (kept 24 h)
  const continueAsGuest = async () => {
    setGuestLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/guest');
      login(response.data.data.token, response.data.data.user);
      toast.success('You are in as a guest. Sample applications are loaded.');
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Could not start a guest session. Please try again.');
      setGuestLoading(false);
    }
  };

  return (
    <main className="auth">
      <AuthIntro heading="Track every application. See how each fits your resume." />

      <section className="auth-side">
        <div className="auth-docket">
          <section aria-labelledby="guest-title">
            <h2 id="guest-title">Try it first</h2>
            <p className="field-note" style={{ marginTop: 0, marginBottom: 14 }}>
              No sign-up. Opens a board with six sample applications and a sample resume, so you can use every feature.
            </p>
            <Button type="button" size="lg" className="btn-block" onClick={continueAsGuest} isLoading={guestLoading} disabled={isSubmitting}>
              {guestLoading ? 'Starting a guest session…' : 'Continue as guest'}
            </Button>
            <p className="field-note">The sample companies are made up. The guest account is deleted after 24 hours.</p>
          </section>

          <section aria-labelledby="signin-title">
            <h2 id="signin-title">Sign in</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="stack-16" style={{ marginTop: 12 }} noValidate>
              <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
              <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
              <Button type="submit" variant="outline" size="lg" className="btn-block" isLoading={isSubmitting} disabled={guestLoading}>
                Sign in
              </Button>
            </form>
          </section>

          <section>
            <div role="status" aria-live="polite">
              {slow && <p className="wait-note" style={{ marginTop: 0, marginBottom: 14 }}>{WAKING_NOTE}</p>}
            </div>
            <p>
              No account? <Link to="/register">Create one</Link>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
};
