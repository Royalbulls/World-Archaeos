'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LegalCenter from './LegalCenter';
import ParentalGuidebook from './ParentalGuidebook';
import { 
  FileText, 
  Award, 
  Hospital, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Clock,
  Briefcase,
  Users,
  Sparkles,
  Download,
  Printer,
  Infinity,
  Globe,
  Shield,
  Heart,
  Gem,
  Zap
} from 'lucide-react';

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  features: string[];
  icon: any;
  color: string;
}

const PACKAGES: ServicePackage[] = [
  {
    id: 'basic',
    name: 'Spiritual Birth Record',
    price: '₹499',
    features: [
      'Digital Birth Certificate',
      'Basic Rashi & Nakshatra',
      '5 Name Suggestions',
      'Instant Email Delivery'
    ],
    icon: FileText,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'premium',
    name: 'Royal Janmapatri Suite',
    price: '₹1,499',
    features: [
      'Premium Gold-Foil Certificate',
      'Detailed Kundali (Birth Chart)',
      '15+ Name Suggestions',
      'Personality & Career Forecast',
      'Auspicious Muhurat Guide'
    ],
    icon: Award,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    id: 'branding',
    name: 'Global Digital Identity',
    price: '₹2,999',
    features: [
      'Unique Global Name Selection',
      'Real-time Social Handle Verification',
      'Domain Name Reservation (.com/.in)',
      'Future Brand Style Guide',
      'Universal Cultural Analysis'
    ],
    icon: Globe,
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    id: 'architect',
    name: 'Digital Identity Architect',
    price: '₹9,999',
    features: [
      'Parental Supervision Setup (Family Link)',
      'Full Account Creation (Gmail, IG, YT)',
      '18-Year Future Value Projection',
      'Digital Asset Handover Kit',
      'Remote Advisor Support'
    ],
    icon: Shield,
    color: 'bg-purple-50 text-purple-600'
  },
  {
    id: 'concierge',
    name: 'Royal Identity Concierge',
    price: '₹24,999',
    features: [
      'In-Person Advisor Visit',
      'Monetization Strategy (YouTube/Social)',
      'Biometric Security Integration',
      'Premium Physical Brand Book',
      'Lifetime Identity & ROI Management'
    ],
    icon: Users,
    color: 'bg-rose-50 text-rose-600'
  },
  {
    id: 'eternal',
    name: 'Eternal Legacy Vault',
    price: '₹4,999',
    features: [
      'Lifetime Digital Soul Vault',
      'Blockchain-Verified Records',
      'Annual Spiritual Forecasts',
      'Family Tree Integration',
      'Concierge Ritual Support'
    ],
    icon: Infinity,
    color: 'bg-indigo-50 text-indigo-600'
  }
];

export default function ProfessionalServices() {
  const [activeTab, setActiveTab] = useState<'parents' | 'hospitals' | 'legal' | 'guidebook'>('parents');

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
            <Star className="w-3 h-3 text-amber-400" />
            Professional Birth Services
          </div>
          <h2 className="font-serif text-5xl leading-tight">
            Eternal Knowledge for <br />
            <span className="text-indigo-400 italic">Life&apos;s Sacred Milestones</span>
          </h2>
          <p className="text-lg opacity-60 leading-relaxed">
            Birth, Marriage, and the Final Transition happen but once. Archaeos provides the precision and depth that even the wisest may overlook, ensuring every ceremony is a perfect alignment with the cosmos.
          </p>
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setActiveTab('parents')}
              className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                activeTab === 'parents' ? 'bg-white text-[#1a1a1a]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              For Parents
            </button>
            <button 
              onClick={() => setActiveTab('hospitals')}
              className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                activeTab === 'hospitals' ? 'bg-white text-[#1a1a1a]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              For Hospitals
            </button>
            <button 
              onClick={() => setActiveTab('legal')}
              className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                activeTab === 'legal' ? 'bg-white text-[#1a1a1a]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Trust & Legal
            </button>
            <button 
              onClick={() => setActiveTab('guidebook')}
              className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                activeTab === 'guidebook' ? 'bg-white text-[#1a1a1a]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Guidebook
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'parents' ? (
          <motion.div
            key="parents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Value Proposition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Clock, title: 'Immediate Issuance', desc: 'Generate a special birth certificate within minutes of birth.' },
                { icon: ShieldCheck, title: 'Verified Content', desc: 'Astrologically accurate data cross-referenced with Vedic charts.' },
                { icon: Sparkles, title: 'Valuable Keepsake', desc: 'High-resolution, printable patrikaaye that last a lifetime.' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-[#1a1a1a]/5 shadow-sm space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl">{item.title}</h3>
                  <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Eternal Knowledge Section */}
            <div className="bg-white rounded-[3rem] p-12 border border-[#1a1a1a]/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <Zap className="w-3 h-3" />
                    The Archaeos Advantage
                  </div>
                  <h3 className="font-serif text-4xl leading-tight">Precision Beyond <br />Human Intuition</h3>
                  <p className="text-lg text-[#1a1a1a]/60 leading-relaxed">
                    While traditional wisdom is vast, our platform cross-references thousands of Vedic parameters with astronomical precision. We provide details that even the most learned scholars might spend weeks calculating—delivered to you in seconds.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-amber-600">99.9%</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Calculation Accuracy</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-amber-600">1000+</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Parameters Analyzed</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 text-[#f5f2ed] space-y-6">
                  <h4 className="font-serif text-2xl">The Power of the Name</h4>
                  <p className="text-sm opacity-60 leading-relaxed italic">
                    &quot;As the name, so the work.&quot;
                  </p>
                  <p className="text-sm opacity-80 leading-relaxed">
                    A name is not just an identifier; it is a vibration that shapes a child&apos;s identity and qualities. We suggest names that carry profound meanings and positive vibrations, ensuring your child&apos;s name creates a legacy of strength and wisdom.
                  </p>
                  <div className="pt-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <Gem className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Meaningful Identity Creation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="font-serif text-3xl">Service Packages</h3>
                <p className="text-sm opacity-40 uppercase tracking-widest mt-2">Professional Pricing for Sacred Records</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PACKAGES.filter(p => p.id !== 'hospital').map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-xl relative overflow-hidden group hover:border-indigo-200 transition-all flex flex-col">
                    {pkg.id === 'concierge' && (
                      <div className="absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                        World First
                      </div>
                    )}
                    <div className="space-y-6 flex-grow">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${pkg.color}`}>
                        <pkg.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-serif text-xl">{pkg.name}</h4>
                        <p className="text-2xl font-bold mt-2">{pkg.price}</p>
                      </div>
                      <ul className="space-y-3">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-[10px] text-[#1a1a1a]/70">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-8">
                      <button className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                        Order Now <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'hospitals' ? (
          <motion.div
            key="hospitals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Business Proposition */}
            <div className="bg-emerald-900 text-emerald-50 rounded-[3rem] p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="font-serif text-4xl leading-tight">Partner with Archaeos <br />for Maternity Excellence</h3>
                <p className="opacity-70 leading-relaxed">
                  Enhance your hospital&apos;s value proposition by offering immediate, professionally generated birth certificates and naming ceremony kits to new parents.
                </p>
                <div className="space-y-4">
                  {[
                    'Increase patient satisfaction scores',
                    'Differentiate your maternity services',
                    'Automated generation upon admission/delivery',
                    'Co-branded professional documentation'
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>
                <button className="px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-50 transition-all">
                  Request Partner Deck
                </button>
              </div>
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold">Marketing Services</h4>
                    <p className="text-xs opacity-60">Boost your hospital&apos;s reach</p>
                  </div>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  We provide digital marketing assets for your hospital to showcase these value-added services to expectant parents during the admission process.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xl font-bold">25%</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Higher Retention</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xl font-bold">Immediate</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">ROI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Package */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-[2.5rem] p-10 border border-[#1a1a1a]/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <Briefcase className="w-12 h-12 opacity-5" />
                </div>
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Hospital className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-3xl">Hospital Enterprise Suite</h4>
                  <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">
                    A comprehensive solution for maternity hospitals to automate birth certificate generation, naming suggestions, and digital Janmapatri issuance.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PACKAGES.find(p => p.id === 'hospital')?.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#1a1a1a]/70">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all">
                    Contact Sales Team
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'legal' ? (
          <motion.div
            key="legal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LegalCenter />
          </motion.div>
        ) : (
          <motion.div
            key="guidebook"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ParentalGuidebook />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Future Value & Legacy Roadmap */}
      <div className="bg-white rounded-[3rem] p-12 border border-[#1a1a1a]/5 shadow-sm space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" />
            The ROI of Identity
          </div>
          <h3 className="font-serif text-4xl leading-tight">Investing in the <br /><span className="text-indigo-600 italic">Future of Your Child</span></h3>
          <p className="text-lg text-[#1a1a1a]/60 leading-relaxed">
            You aren&apos;t just buying a name; you are buying a 18-year head start. By securing their digital identity today, you create a compounding asset that grows with them.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roadmap Steps */}
          <div className="lg:col-span-2 space-y-8">
            {[
              { 
                age: 'Birth to 1 Year', 
                title: 'Foundation & Setup', 
                desc: 'Accounts created under Parental Supervision (Google Family Link). Secure handles, reserved domains, and the first "Life Chapter" storage setup.',
                icon: ShieldCheck
              },
              { 
                age: '1 to 12 Years', 
                title: 'Content Compounding', 
                desc: 'Curated childhood milestones uploaded to a private-then-public YouTube channel. Building a "Digital Portfolio" that attracts organic growth.',
                icon: Zap
              },
              { 
                age: '13 to 18 Years', 
                title: 'Brand Monetization', 
                desc: 'Transitioning from childhood memories to a personal brand. Ad revenue, sponsorships, and a verified history that commands authority.',
                icon: DollarSign
              }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1a1a1a] text-white rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                    <step.icon className="w-6 h-6" />
                  </div>
                  {i < 2 && <div className="w-0.5 h-full bg-gray-100 my-2" />}
                </div>
                <div className="pb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">{step.age}</p>
                  <h4 className="font-serif text-xl mb-2">{step.title}</h4>
                  <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Value Projection Card */}
          <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="space-y-2 relative z-10">
              <h4 className="font-serif text-2xl">Estimated Value at 18</h4>
              <p className="text-[10px] uppercase tracking-widest opacity-40">Based on Moderate Growth (10k-50k Subs)</p>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Ad Revenue Potential</p>
                <p className="text-3xl font-bold text-emerald-400">₹15L - ₹45L</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Brand Equity Value</p>
                <p className="text-3xl font-bold text-indigo-400">Priceless</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Digital Assets (Domains/Handles)</p>
                <p className="text-3xl font-bold text-amber-400">₹5L+</p>
              </div>
            </div>

            <p className="text-[10px] opacity-30 leading-relaxed italic">
              *Calculations are estimates based on current CPM rates and brand valuation metrics. Actual results depend on content quality and engagement.
            </p>
          </div>
        </div>
      </div>

      {/* Value of Content Section */}
      <div className="bg-indigo-50 rounded-[3rem] p-12 border border-indigo-100 flex flex-col lg:flex-row gap-12 items-center">
        <div className="lg:w-1/3 text-center lg:text-left space-y-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm">
            <Star className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="font-serif text-3xl">Why Value This Content?</h3>
          <p className="text-sm text-indigo-900/60 leading-relaxed">
            A birth record is more than a document; it is the first chapter of a human life. Investing in high-quality, astrologically verified content ensures a strong spiritual foundation.
          </p>
        </div>
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Digital Identity', desc: 'Names optimized for social handles and domains, ensuring a unique global presence.' },
            { title: 'Universal Appeal', desc: 'Cross-cultural analysis to ensure the name resonates across all religions and countries.' },
            { title: 'Historical Value', desc: 'A permanent digital and physical record for future generations to cherish.' },
            { title: 'Professional Branding', desc: 'Names that balance modern appeal with ancient phonetic power and digital readiness.' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-indigo-100/50 space-y-2">
              <h4 className="font-bold text-indigo-900">{item.title}</h4>
              <p className="text-xs text-indigo-900/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
