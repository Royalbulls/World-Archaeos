'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Camera, 
  Shield, 
  TrendingUp, 
  Video, 
  Mail, 
  Lock,
  ChevronRight,
  Download,
  Eye,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'foundation',
    title: 'Phase 1: The Digital Foundation',
    icon: Shield,
    color: 'bg-blue-50 text-blue-600',
    steps: [
      'Setting up Google Family Link for parental oversight.',
      'Securing the @name handles across all major platforms.',
      'Creating a dedicated "Legacy Email" for all future registrations.',
      'Enabling Advanced Protection Program for high-value accounts.'
    ]
  },
  {
    id: 'content',
    title: 'Phase 2: Curating the Legacy',
    icon: Camera,
    color: 'bg-pink-50 text-pink-600',
    steps: [
      'The 80/20 Rule: 80% Private Memories, 20% Public Branding.',
      'Capturing milestones: First words, steps, and creative projects.',
      'Maintaining child privacy: Using "Unlisted" YouTube videos for family.',
      'Building a consistent visual aesthetic for the future brand.'
    ]
  },
  {
    id: 'growth',
    title: 'Phase 3: Strategic Growth',
    icon: TrendingUp,
    color: 'bg-emerald-50 text-emerald-600',
    steps: [
      'Understanding YouTube Kids vs. Standard YouTube policies.',
      'SEO for Baby Names: How to keep the child searchable but safe.',
      'Engaging with a community of like-minded "Digital Native" parents.',
      'Monitoring digital footprint and removing unwanted data early.'
    ]
  },
  {
    id: 'monetization',
    title: 'Phase 4: Monetization & ROI',
    icon: Video,
    color: 'bg-red-50 text-red-600',
    steps: [
      'Setting up AdSense under parental tax IDs.',
      'Managing sponsorship inquiries for "Child Influencers".',
      'Reinvesting earnings into the child&apos;s education fund.',
      'Tracking the "Brand Equity" value year-over-year.'
    ]
  }
];

export default function ParentalGuidebook() {
  const [activeSection, setActiveSection] = useState(GUIDE_SECTIONS[0].id);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-100">
          <BookOpen className="w-4 h-4" />
          The Digital Legacy Manual
        </div>
        <h2 className="font-serif text-5xl">Parental Guidebook</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg">
          Your step-by-step roadmap to managing, protecting, and growing your child&apos;s digital empire from birth to adulthood.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {GUIDE_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full p-6 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                activeSection === section.id 
                  ? 'bg-white border-indigo-200 shadow-lg scale-[1.02]' 
                  : 'bg-white/50 border-transparent hover:bg-white'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm">{section.title}</h3>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">View Details</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-90 opacity-100' : 'opacity-20'}`} />
            </button>
          ))}

          <div className="pt-8">
            <button className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl">
              <Download className="w-5 h-5" />
              Download Full PDF
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3rem] p-10 border border-[#1a1a1a]/5 shadow-sm space-y-8 h-full"
          >
            {GUIDE_SECTIONS.find(s => s.id === activeSection) && (
              <>
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${GUIDE_SECTIONS.find(s => s.id === activeSection)?.color}`}>
                    {React.createElement(GUIDE_SECTIONS.find(s => s.id === activeSection)!.icon, { className: 'w-8 h-8' })}
                  </div>
                  <h3 className="font-serif text-3xl">{GUIDE_SECTIONS.find(s => s.id === activeSection)?.title}</h3>
                </div>

                <div className="space-y-6">
                  {GUIDE_SECTIONS.find(s => s.id === activeSection)?.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                        {i + 1}
                      </div>
                      <p className="text-[#1a1a1a]/70 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Pro Tip</span>
                    </div>
                    <p className="text-xs text-amber-800/70 leading-relaxed">
                      Always use a recovery phone number that belongs to the primary guardian, never the child&apos;s temporary device.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Safety Warning</span>
                    </div>
                    <p className="text-xs text-rose-800/70 leading-relaxed">
                      Never share the child&apos;s real-time location or school details in public posts.
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Quick Tools Section */}
      <div className="bg-indigo-900 text-white rounded-[3rem] p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <Mail className="w-10 h-10 text-indigo-300" />
            <h4 className="font-serif text-2xl">Email Templates</h4>
            <p className="text-sm opacity-60">Pre-written templates for handle requests and domain inquiries.</p>
            <button className="text-xs font-bold uppercase tracking-widest text-indigo-300 hover:underline flex items-center gap-2">
              Access Templates <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            <Lock className="w-10 h-10 text-indigo-300" />
            <h4 className="font-serif text-2xl">Security Checklist</h4>
            <p className="text-sm opacity-60">A 20-point checklist to ensure your child&apos;s identity is unhackable.</p>
            <button className="text-xs font-bold uppercase tracking-widest text-indigo-300 hover:underline flex items-center gap-2">
              View Checklist <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            <Eye className="w-10 h-10 text-indigo-300" />
            <h4 className="font-serif text-2xl">Privacy Audit</h4>
            <p className="text-sm opacity-60">Tools to scan the web for any leaked information about your family.</p>
            <button className="text-xs font-bold uppercase tracking-widest text-indigo-300 hover:underline flex items-center gap-2">
              Run Audit <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
