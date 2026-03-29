'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  RefreshCcw, 
  Lock, 
  Scale, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface PolicySection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

const POLICIES: PolicySection[] = [
  {
    id: 'agreement',
    title: 'Service Handover Agreement',
    icon: FileText,
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="font-bold text-indigo-900">1. Digital Asset Handover</p>
        <p>Upon completion of the Digital Identity setup, Archaeos will provide all credentials via a secure encrypted channel. Once the &quot;Handover Confirmation&quot; is signed/acknowledged, the Client assumes 100% responsibility for account security, password management, and two-factor authentication.</p>
        
        <p className="font-bold text-indigo-900">2. Limitation of Liability</p>
        <p>Archaeos is not liable for any account suspensions, deletions, or policy changes made by third-party platforms (Google, Meta, X, etc.) after the handover. We act as architects; the maintenance of the structure is the owner&apos;s responsibility.</p>
        
        <p className="font-bold text-indigo-900">3. Support Duration</p>
        <p>Post-handover support is limited to 30 days for technical queries related to the initial setup. Ongoing management is not included unless a separate maintenance contract is signed.</p>
        
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 italic">Important: We will never ask for your passwords after the handover. Any such request should be treated as a security threat.</p>
        </div>
      </div>
    )
  },
  {
    id: 'refund',
    title: 'Refund & Cancellation Policy',
    icon: RefreshCcw,
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="font-bold text-rose-900">1. Non-Refundable Nature</p>
        <p>Due to the immediate costs associated with domain registration, blockchain verification, and expert consultation time, all Professional Services are non-refundable once the &quot;Work Commencement&quot; phase has started.</p>
        
        <p className="font-bold text-rose-900">2. Partial Refunds</p>
        <p>If a cancellation request is received within 2 hours of payment and before any digital assets (domains/accounts) are purchased, a 70% refund may be processed (30% administrative fee applies).</p>
        
        <p className="font-bold text-rose-900">3. Service Dissatisfaction</p>
        <p>In case of dissatisfaction with the naming suggestions, we offer one (1) complimentary revision session. No refunds will be issued based on subjective preferences.</p>
      </div>
    )
  },
  {
    id: 'privacy',
    title: 'Privacy & Data Protection',
    icon: Lock,
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="font-bold text-emerald-900">1. Data Minimization</p>
        <p>We only collect the minimum data required for Vedic calculations and account setup. Your child&apos;s birth data is encrypted and stored in an isolated environment.</p>
        
        <p className="font-bold text-emerald-900">2. Zero-Sale Policy</p>
        <p>Archaeos will NEVER sell your or your child&apos;s personal data to third-party advertisers. Our revenue comes solely from service fees, not data monetization.</p>
        
        <p className="font-bold text-emerald-900">3. Parental Control</p>
        <p>All accounts are created using Google Family Link or similar parental supervision tools, ensuring you have the master key to your child&apos;s digital life.</p>
      </div>
    )
  }
];

export default function LegalCenter() {
  const [expanded, setExpanded] = useState<string | null>('agreement');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">
          <ShieldCheck className="w-4 h-4" />
          Suraksha Kavach (Safety Shield)
        </div>
        <h2 className="font-serif text-4xl">Trust, Transparency & Security</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto">
          We value the sacred trust you place in us. Our legal framework is designed to protect both your child&apos;s future and our professional integrity.
        </p>
      </div>

      <div className="space-y-4">
        {POLICIES.map((policy) => (
          <div 
            key={policy.id}
            className={`bg-white rounded-[2rem] border transition-all overflow-hidden ${
              expanded === policy.id ? 'border-indigo-200 shadow-xl' : 'border-[#1a1a1a]/5 shadow-sm'
            }`}
          >
            <button 
              onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}
              className="w-full p-8 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  expanded === policy.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <policy.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl">{policy.title}</h3>
              </div>
              {expanded === policy.id ? <ChevronUp className="w-5 h-5 opacity-30" /> : <ChevronDown className="w-5 h-5 opacity-30" />}
            </button>

            <AnimatePresence>
              {expanded === policy.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  <div className="pt-4 border-t border-gray-50">
                    {policy.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center shrink-0">
          <Scale className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-serif text-2xl">The Archaeos Commitment</h4>
          <p className="text-sm opacity-60 leading-relaxed">
            Every service is backed by a formal agreement that clearly defines our role as your Digital Architect. We build the foundation; you own the legacy.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Legally Binding</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Data Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
