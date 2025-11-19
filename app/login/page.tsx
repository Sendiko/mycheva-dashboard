'use client';

import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image'; // <-- PREVIEW FIX: Commented out for the preview environment.
import { useRouter } from 'next/navigation'; // <-- PREVIEW FIX: Commented out for the preview environment.

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- PREVIEW FIX ---
  // In your local project, uncomment the line below:
  const router = useRouter();
  // For the preview, we'll use a placeholder:
  // const router = { push: (path: string) => console.log(`Redirecting to ${path}`) };
  // ---------------------


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post('https://api-my.chevalierlabsas.org/login', { name, password, mobile: false }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = res.data;

      if (data.status === 200 && data.token) {
        setSuccess(data.message || 'Login successful!');
        
        // 1. Save the token
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('roleId', data.user.roleId);
        
        // 2. Redirect to dashboard
        // We add a small delay so the user can see the success message
        setTimeout(() => {
          router.push('/dashboard'); 
        }, 1000); // 1-second delay before redirect

      } else {
        setError(data.message || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-lg">
        
        {/* --- PREVIEW FIX ---
          The <Image> component is replaced with a div
          for the preview. In your local Next.js project,
          you should use the original <Image> component code.
        ----------------------*/}
        <div className="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full">
          <Image
            src="/image/logo.png" // Make sure this path is correct!
            alt="MyCheva Logo"
            width={160}
            height={160}
            className="object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl text-neutral-900 text-center mb-2">Welcome Back!</h1>
        <p className="text-body-md font-bold text-neutral-700 text-center mb-8">
          Please log in to your account.
        </p>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-body-md font-semibold text-neutral-900 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-body-md font-semibold text-neutral-900 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-4 rounded-lg bg-primary-500 py-3 text-white font-semibold text-body-lg shadow-sm hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          {/* Messages */}
          {error && (
            <p className="text-center text-body-md text-error">{error}</p>
          )}
          {success && (
            <p className="text-center text-body-md text-success">{success}</p>
          )}
        </form>
      </div>
    </main>
  );
}