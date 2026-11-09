import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthIntro } from '../components/layout/AuthIntro';
import { useAuth } from '../context/AuthContext';
import { useSlowNote, WAKING_NOTE } from '../hooks/useSlowNote';
import api from '../api/axios';
import type { AuthResponse } from '../types';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const slow = useSlowNote(isSubmitting);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      login(response.data.data.token, response.data.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <main className="auth">
      <AuthIntro heading="Keep your own board of applications." />

      <section className="auth-side">
        <div className="auth-docket">
          <section aria-labelledby="register-title">
            <h2 id="register-title">Create an account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="stack-16" style={{ marginTop: 12 }} noValidate>
              <Input label="Full name" type="text" autoComplete="name" placeholder="Your name" {...register('name')} error={errors.name?.message} />
              <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
              <Input label="Password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
              <Input label="Confirm password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
              <Button type="submit" size="lg" className="btn-block" isLoading={isSubmitting}>
                {isSubmitting ? 'Creating your account…' : 'Sign up'}
              </Button>
            </form>
            <div role="status" aria-live="polite">
              {slow && <p className="wait-note">{WAKING_NOTE}</p>}
            </div>
          </section>

          <section>
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
            <p className="field-note">
              Just looking? <Link to="/login">Open the board as a guest</Link> instead.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
};
