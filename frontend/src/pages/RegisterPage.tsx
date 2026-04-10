import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { AuthResponse } from '../types';
import { Briefcase, Sparkles, Shield, Zap } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password
      });
      login(response.data.data.token, response.data.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const pillStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 9999,
    backgroundColor: 'rgba(20,31,56,0.6)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(64,72,93,0.15)', fontSize: 13, color: '#a3aac4',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060e20', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div className="orb-primary" style={{ top: '10%', left: '15%' }} />
      <div className="orb-tertiary" style={{ bottom: '5%', right: '25%' }} />

      {/* Left Side - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #6063ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 30px rgba(96,99,238,0.3)' }}>
              <Briefcase size={24} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#dee5ff', letterSpacing: '-0.02em' }}>JobTrackr</h2>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 800, color: '#dee5ff', marginBottom: 12, letterSpacing: '-0.02em' }}>Create an account</h1>
          <p style={{ color: '#a3aac4', marginBottom: 40, fontSize: 15 }}>
            Start tracking your job applications today.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input label="Full Name" type="text" placeholder="John Doe" {...register('name')} error={errors.name?.message} />
            <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <Input label="Confirm Password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%', height: 48, fontSize: 15, borderRadius: 14, marginTop: 4 }}>
              Sign up
            </Button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: '#a3aac4' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: '#a3a6ff', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div style={{ display: 'none', flex: 1, position: 'relative', overflow: 'hidden' }} className="lg:!flex">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #091328, #0f1930, #060e20)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 450, height: 450, borderRadius: '50%', backgroundColor: 'rgba(96,99,238,0.08)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 350, height: 350, borderRadius: '50%', backgroundColor: 'rgba(200,144,255,0.06)', filter: 'blur(80px)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, textAlign: 'center', width: '100%' }}>
          <h1 className="gradient-text" style={{ fontSize: 52, fontWeight: 800, marginBottom: 32, lineHeight: 1.15 }}>
            Land your<br />dream job.
          </h1>
          <p style={{ fontSize: 18, color: '#a3aac4', maxWidth: 480, marginBottom: 48, lineHeight: 1.7 }}>
            Join developers using AI to organize their job hunt and optimize their resumes.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <div style={pillStyle}>
              <Sparkles size={16} style={{ color: '#c890ff' }} /> Smart Insights
            </div>
            <div style={pillStyle}>
              <Shield size={16} style={{ color: '#10b981' }} /> Secure & Private
            </div>
            <div style={pillStyle}>
              <Zap size={16} style={{ color: '#f59e0b' }} /> Instant Setup
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
