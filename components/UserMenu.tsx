'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Shield, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Architect';

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link 
          href="/auth/login"
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-indigo-600 transition-all"
        >
          <LogIn className="w-4 h-4" />
          Login
        </Link>
        <Link 
          href="/auth/signup"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <UserPlus className="w-4 h-4" />
          Join
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-4 bg-gray-50 rounded-full border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1">Architect</p>
          <p className="text-xs font-bold text-gray-900 leading-none">{displayName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
            >
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-lg leading-none mb-1 truncate max-w-[140px]">{displayName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 truncate max-w-[140px]">{user.email}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[8px] font-bold uppercase tracking-widest inline-block">
                  Verified Legacy Member
                </div>
              </div>

              <div className="p-2">
                <button 
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout from Suite
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
