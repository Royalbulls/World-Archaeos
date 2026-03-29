'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn, user } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(255,182,193,0.1)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_90%_80%,rgba(147,112,219,0.1)_0%,transparent_50%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-[#1a1a1a]/5 relative z-10"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl">Create Legacy</h1>
          <p className="text-sm text-gray-500">Join the elite circle of digital architects.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-widest border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-xl border border-gray-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Join with Google
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Legacy Access Only</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Registration is currently restricted to authorized researchers via Google.
          </p>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 font-bold hover:underline">
              Login
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30">
            <Sparkles className="w-3 h-3" />
            Archaeos Digital Research Institute
          </div>
        </div>
      </motion.div>
    </div>
  );
}
