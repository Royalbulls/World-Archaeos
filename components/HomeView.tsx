'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Globe, 
  ArrowUpRight,
  Search,
  ChevronRight,
  User
} from 'lucide-react';
import { UserProfileData } from './UserProfile';

interface HomeViewProps {
  profile: UserProfileData;
  setActiveTab: (tab: string) => void;
  categories: { id: string; label: string; tabs: string[] }[];
  allTabs: { id: string; label: string; icon: any }[];
}

export default function HomeView({ profile, setActiveTab, categories = [], allTabs = [] }: HomeViewProps) {
  const isProfileSetup = profile.isSetup;

  const getTabInfo = (tabId: string) => {
    return (allTabs || []).find(t => t.id === tabId);
  };

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-600 mb-3">World Archaeos Engine v4.0</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#1a1a1a] leading-tight">
            Welcome back, <br />
            <span className="text-indigo-600 italic font-light">{profile.name || 'Seeker'}</span>
          </h1>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right hidden md:block"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Current Epoch</p>
          <p className="font-mono text-sm text-[#1a1a1a]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </motion.div>
      </div>

      {/* Featured Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Daily Pulse - Featured */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5 }}
          onClick={() => setActiveTab('daily-pulse')}
          className="md:col-span-8 relative rounded-[3rem] overflow-hidden bg-[#1a1a1a] text-[#f5f2ed] p-12 shadow-2xl cursor-pointer group border border-white/10"
        >
          <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-700">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#4f46e5,transparent_60%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#ec4899,transparent_60%)]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[280px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Featured Tool</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-[#1a1a1a] transition-all duration-500">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-5xl md:text-6xl mb-4 leading-none">30-Second <br/><span className="italic text-indigo-400 font-light">Awakening</span></h2>
              <p className="text-base opacity-60 max-w-lg leading-relaxed font-light">Synthesize cosmic data and ancient wisdom into a single moment of clarity. Your daily truth awaits.</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Status */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          onClick={() => setActiveTab('profile')}
          className="md:col-span-4 bg-white rounded-[3rem] p-10 border border-[#1a1a1a]/5 shadow-xl flex flex-col justify-between cursor-pointer group hover:border-indigo-200 transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <User className="w-8 h-8" />
            </div>
            <div className="text-right">
              <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isProfileSetup ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isProfileSetup ? 'Verified' : 'Incomplete'}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Soul Identity</p>
            <h3 className="font-serif text-3xl mb-3">{profile.name || 'Unknown Seeker'}</h3>
            <p className="text-sm text-[#1a1a1a]/60 leading-relaxed font-light">
              {isProfileSetup 
                ? `Active as ${profile.profession || 'Universal Observer'}. Your digital footprint is synchronized.` 
                : 'Your identity is not yet anchored. Complete your profile to unlock full engine capabilities.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tool Hub - The "Merged" Experience */}
      <section className="pt-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-serif text-4xl text-[#1a1a1a]">Tool Directory</h2>
            <p className="text-sm text-[#1a1a1a]/50 mt-1">Explore the full breadth of the Archaeos Engine</p>
          </div>
          <div className="flex gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input 
                type="text" 
                placeholder="Search tools..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#1a1a1a]/10 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                onClick={(e) => {
                  e.stopPropagation();
                  // This will focus the main search in the parent if needed
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.filter(c => c.id !== 'system').map((category, idx) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-[#1a1a1a]/10" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]/40">{category.label}</h3>
                <div className="h-px flex-1 bg-[#1a1a1a]/10" />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {category.tabs.map(tabId => {
                  const tab = getTabInfo(tabId);
                  if (!tab) return null;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#1a1a1a]/5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#1a1a1a]/60 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a1a] group-hover:text-indigo-600 transition-colors">{tab.label}</p>
                          <p className="text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">Module {tabId.slice(0, 4)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-600" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Status Footer */}
      <section className="relative mt-12">
        <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3.5rem] p-12 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Globe className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-6">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              <div>
                <h3 className="font-serif text-3xl mb-2">Archaeos Engine Online</h3>
                <p className="text-xs uppercase tracking-[0.2em] opacity-50 font-light">All systems synchronized with the cosmic grid</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-center md:text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Synergy</p>
                <p className="text-3xl font-mono font-light">99.9%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Active Nodes</p>
                <p className="text-3xl font-mono font-light">1,024</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Security</p>
                <p className="text-3xl font-mono font-light text-emerald-400">Quantum</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
