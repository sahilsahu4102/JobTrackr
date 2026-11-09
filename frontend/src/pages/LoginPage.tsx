import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { AuthResponse } from '../types';
import { Briefcase, Sparkles, BarChart3, Target } from 'lucide-react';

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

  const pillStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 9999,
    backgroundColor: 'rgba(20,31,56,0.6)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(64,72,93,0.15)', fontSize: 13, color: '#a3aac4',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060e20', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Floating Orbs */}
      <div className="orb-primary" style={{ top: '-10%', left: '20%' }} />
      <div className="orb-tertiary" style={{ bottom: '-5%', right: '30%' }} />

      {/* Left Side - Login Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 380, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #6063ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 30px rgba(96,99,238,0.3)' }}>
              <Briefcase size={24} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#dee5ff', letterSpacing: '-0.02em' }}>JobTrackr</h2>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#dee5ff', marginBottom: 12, letterSpacing: '-0.02em' }}>Sign in</h1>
          <p style={{ color: '#a3aac4', marginBottom: 40, fontSize: 15 }}>
            Welcome back! Please enter your details.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%', height: 48, fontSize: 15, borderRadius: 14 }}>
              Sign in
            </Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: '#6d758c', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(64,72,93,0.3)' }} />
            or
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(64,72,93,0.3)' }} />
          </div>
          <Button type="button" variant="outline" onClick={continueAsGuest} isLoading={guestLoading} disabled={isSubmitting} style={{ width: '100%', height: 48, fontSize: 15, borderRadius: 14 }}>
            Continue as guest
          </Button>
          <p style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#6d758c' }}>
            No sign-up. Opens with sample applications, so you can try everything.
          </p>

          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: '#a3aac4' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: '#a3a6ff', textDecoration: 'none' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div style={{ display: 'none', flex: 1, position: 'relative', overflow: 'hidden' }} className="lg:!flex">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #091328, #0f1930, #060e20)' }} />
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', backgroundColor: 'rgba(96,99,238,0.08)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', backgroundColor: 'rgba(200,144,255,0.06)', filter: 'blur(80px)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, textAlign: 'center', width: '100%' }}>
          <h1 className="gradient-text" style={{ fontSize: 52, fontWeight: 800, marginBottom: 32, lineHeight: 1.15 }}>
            Manage applications<br />with AI.
          </h1>
          <p style={{ fontSize: 18, color: '#a3aac4', maxWidth: 480, marginBottom: 48, lineHeight: 1.7 }}>
            Track your job hunt, extract insights from job descriptions automatically, and get tailored resume suggestions.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <div style={pillStyle}>
              <Sparkles size={16} style={{ color: '#c890ff' }} />
              AI-Powered Parsing
            </div>
            <div style={pillStyle}>
              <BarChart3 size={16} style={{ color: '#8a95ff' }} />
              Visual Analytics
            </div>
            <div style={pillStyle}>
              <Target size={16} style={{ color: '#10b981' }} />
              Resume Matching
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
