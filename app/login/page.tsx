'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/login', { name, password, mobile: false });

      const data = res.data;

      if (data.status === 200 && data.token) {
        setSuccess(data.message || 'Login successful!');

        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('roleId', data.user.roleId);

        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } else {
        setError(data.message || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 z-10">
        <div className="w-full max-w-md mx-auto">

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-[var(--color-neutral-900)] mb-3">Welcome Back</h1>
            <p className="text-[var(--color-neutral-500)]">
              Please enter your details to sign in to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-neutral-400)]">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-neutral-200)] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] outline-none transition-all bg-[var(--color-neutral-50)] focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-neutral-400)]">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-neutral-200)] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] outline-none transition-all bg-[var(--color-neutral-50)] focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary-200)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                'Logging in...'
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm text-center">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Right Pane - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--color-neutral-900)] items-center justify-center overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-900)] to-[var(--color-neutral-900)] opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Research & Innovation
          </h2>
          <p className="text-[var(--color-primary-100)] text-lg leading-relaxed">
            Join the Chevalier Laboratory SAS community. Explore the latest in IT products, programming, and technology research.
          </p>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[var(--color-primary-500)] opacity-20 blur-3xl"></div>
        <div className="absolute top-24 right-24 w-96 h-96 rounded-full bg-[var(--color-info)] opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}