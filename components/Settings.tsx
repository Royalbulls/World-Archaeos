'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Lock, 
  Eye, 
  Trash2, 
  Globe, 
  Bell, 
  Database,
  Info,
  FileText,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<'general' | 'privacy' | 'data' | 'about'>('general');

  const clearData = () => {
    if (confirm('Are you sure you want to clear all local data? This will reset your profile and all saved progress.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const sections = [
    { id: 'general', label: 'General Settings', icon: Globe },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'about', label: 'About Archaeos', icon: Info },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-[#f5f2ed]">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-serif text-3xl">System Settings</h2>
          <p className="text-sm opacity-50">Configure your Archaeos experience and manage your data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`w-full px-6 py-4 rounded-2xl text-left flex items-center gap-4 transition-all ${
                activeSection === section.id 
                  ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg' 
                  : 'hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/70'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-sm min-h-[500px]">
          {activeSection === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h3 className="font-serif text-xl border-b border-[#1a1a1a]/5 pb-4">General Configuration</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">System Language</p>
                    <p className="text-xs opacity-50">Choose your preferred interface language.</p>
                  </div>
                  <select className="bg-[#f5f2ed] border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#1a1a1a]">
                    <option>Hindi + Sanskrit</option>
                    <option>Pure Hindi</option>
                    <option>Sanskrit</option>
                    <option>English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Push Notifications</p>
                    <p className="text-xs opacity-50">Get alerts for new archaeological discoveries.</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Haptic Feedback</p>
                    <p className="text-xs opacity-50">Tactile response during ritual simulations.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#1a1a1a]/10 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h3 className="font-serif text-xl border-b border-[#1a1a1a]/5 pb-4">Privacy & Security</h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex gap-4">
                  <Lock className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-indigo-900">End-to-End Encryption</p>
                    <p className="text-xs text-indigo-700/70 leading-relaxed">
                      All your spiritual data, kundali reports, and personal thoughts are encrypted locally on your device. Archaeos Institute cannot access your private records.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full p-4 rounded-2xl bg-[#f5f2ed] hover:bg-[#1a1a1a]/5 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 opacity-40" />
                      <span className="text-sm font-medium">View Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100" />
                  </button>
                  <button className="w-full p-4 rounded-2xl bg-[#f5f2ed] hover:bg-[#1a1a1a]/5 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 opacity-40" />
                      <span className="text-sm font-medium">Terms of Service</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h3 className="font-serif text-xl border-b border-[#1a1a1a]/5 pb-4">Data Management</h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-amber-900">Local Storage Usage</p>
                    <p className="text-xs text-amber-700/70 leading-relaxed">
                      Archaeos stores approximately 2.4MB of data on your device. This includes your profile, saved discoveries, and AI agent configurations.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={clearData}
                  className="w-full p-6 rounded-3xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs"
                >
                  <Trash2 className="w-5 h-5" />
                  Reset All System Data
                </button>
              </div>
            </motion.div>
          )}

          {activeSection === 'about' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h3 className="font-serif text-xl border-b border-[#1a1a1a]/5 pb-4">About Archaeos</h3>
              
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#f5f2ed] mx-auto mb-4">
                    <SettingsIcon className="w-10 h-10" />
                  </div>
                  <h4 className="font-serif text-2xl">Archaeos</h4>
                  <p className="text-xs opacity-60 font-bold text-indigo-600 uppercase tracking-widest mt-1">Non-Profit Organization</p>
                  <p className="text-[10px] opacity-40 font-mono uppercase tracking-widest mt-1">Version 4.2.0-Alpha</p>
                </div>

                <div className="space-y-4 text-sm text-[#1a1a1a]/70 leading-relaxed">
                  <p>
                    Archaeos is a non-profit organization dedicated to the study and preservation of cultural heritage, both tangible and intangible, irrespective of faith, origin, or gender.
                  </p>
                  
                  <div className="bg-[#f5f2ed] p-6 rounded-3xl space-y-4">
                    <h5 className="font-bold text-[#1a1a1a]">Our Mission Areas:</h5>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Archaeology & Anthropology:</strong> Exploration, recording, and interpretation of ancient and contemporary cultures. Advocacy for indigenous peoples and endangered languages.</li>
                      <li><strong>Built Heritage & Cartography:</strong> Conservation and recording of cities and &apos;cultural spaces&apos;, both ancient and modern.</li>
                      <li><strong>Cultural Heritage & Law:</strong> Promotion of strategies and legislation for the preservation of intangible and tangible heritage.</li>
                    </ul>
                  </div>

                  <p className="italic border-l-4 border-indigo-500 pl-4">
                    &quot;We believe that culture and our shared human history should lie not at the margins of globalization and development but at its very epicenter influencing its direction and its ethics.&quot;
                  </p>

                  <p>
                    Knowledge of other cultures enhances the quality of our lives, fostering self-understanding and community values, and expanding opportunities vital to bridge the chasms of our differences.
                  </p>
                </div>

                <div className="pt-8 border-t border-[#1a1a1a]/5 flex flex-col items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">By Royal Bulls Advisory Private Limited</p>
                  <p className="text-[10px] opacity-40">Founder & CEO Krishna Vishwakarma • Director Vandna Thakur</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
