'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ErrorResponse } from '@/lib/types';

// Define API error response type
interface ApiErrorResponse {
  response?: {
    data?: ErrorResponse;
  };
}

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'EXPLORER' as 'EXPLORER' | 'ADMIN',
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    redirect('/');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading toast
    const loadingToast = toast.loading('Creating your account...');
    
    try {
      const result = await register.mutateAsync(formData);
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('Account created successfully! Redirecting...');
        // Use window.location for a full page reload after registration
        window.location.href = '/';
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      
      // Type guard to check if error matches our ErrorResponse interface
      const isErrorResponse = (err: unknown): err is ErrorResponse => {
        return typeof err === 'object' && err !== null && 'message' in err;
      };
      
      // Type guard for API error response
      const isApiErrorResponse = (err: unknown): err is ApiErrorResponse => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      // Handle API error responses
      if (isApiErrorResponse(error) && error.response?.data) {
        toast.error(error.response.data.message);
      } else if (isErrorResponse(error)) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-12 px-3 sm:px-4 md:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-50"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      
      <div className="max-w-lg w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gurbetci
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-2">Join the community of abroad workers & students</p>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 space-y-5 sm:space-y-6 transform transition-all duration-300 hover:shadow-3xl">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Create your account</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Join thousands of people sharing their abroad experiences
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-slate-700 block">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Choose a username"
                  required
                  className="w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 block">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Choose a strong password"
                  required
                  className="w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 block">
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'EXPLORER' })}
                  className={`relative h-14 sm:h-16 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'EXPLORER'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-1">
                    <span className="text-base sm:text-lg">🧭</span>
                    <span className="text-xs sm:text-sm font-medium">Explorer</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                  className={`relative h-14 sm:h-16 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'ADMIN'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-1">
                    <span className="text-base sm:text-lg">👑</span>
                    <span className="text-xs sm:text-sm font-medium">Admin</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {formData.role === 'EXPLORER' 
                  ? 'Looking to move abroad or connect with others' 
                  : 'Administrative access'
                }
              </p>
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {register.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </button>

            {register.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-700 text-xs sm:text-sm font-medium">
                    Registration failed. Please check your information and try again.
                  </p>
                </div>
              </div>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 sm:px-4 bg-white/70 text-slate-600 text-xs sm:text-sm">Already have an account?</span>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
            >
              Sign in instead
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-slate-500">
          <p>© 2024 Gurbetci. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
} 