'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Target, 
  Globe, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Rocket,
  Sparkles,
  Layers,
  Users,
  Cpu,
  Lock,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import Image from 'next/image';

const SLIDES = [
  {
    id: 'title',
    title: 'World Archaeos',
    subtitle: 'Decoding Ancient Wisdom with Multi-Modal AI',
    content: 'Building the world’s first Historical Intelligence & Spiritual Tech Suite.',
    icon: Sparkles,
    bg: 'https://picsum.photos/seed/mystic/1920/1080?blur=2',
    recipe: 'editorial'
  },
  {
    id: 'problem',
    title: 'The "Wisdom Gap"',
    subtitle: 'The Problem We Are Solving',
    points: [
      { icon: Zap, title: 'Content Saturation', desc: 'Creators ko authentic Vedic/Historical content banane mein hafte lagte hain.' },
      { icon: ShieldCheck, title: 'Accuracy Issue', desc: 'Internet par mojud spiritual data bikhra hua aur unverified hai.' },
      { icon: Lock, title: 'Tech Barrier', desc: 'Vedic sciences (Vastu/Astrology) ko calculate aur visualize karna mushkil hai.' }
    ],
    recipe: 'technical'
  },
  {
    id: 'solution',
    title: 'The "Category Creator"',
    subtitle: 'World Archaeos Suite',
    content: 'Ek aisi jagah jahan AI, History aur Spirituality milti hain.',
    highlights: [
      '1-Click Multi-modal pipeline (Script + Audio + 2K Images + Video)',
      'Quantum Science meets Ancient Logic (Proprietary IP)'
    ],
    recipe: 'luxury'
  },
  {
    id: 'market',
    title: 'Market Opportunity',
    subtitle: 'The $80B+ Global Market',
    stats: [
      { label: 'Spiritual Tech', value: '$40B+', sub: 'India Market (10% CAGR)' },
      { label: 'Creator Economy', value: '50M+', sub: 'Global History/Mystery Creators' },
      { label: 'EdTech & Research', value: 'High', sub: 'Global interest in Vedic simulations' }
    ],
    recipe: 'brutalist'
  },
  {
    id: 'product',
    title: 'The 4 Pillars',
    subtitle: 'Product Deep Dive',
    pillars: [
      { title: 'Influencer Studio', desc: 'Automated content for YouTube/Camera.' },
      { title: 'Vedic Suite', desc: 'Kundli Generator & Vastu Architect.' },
      { title: 'Akashic Explorer', desc: 'AI-driven historical research tool.' },
      { title: 'Daily Pulse', desc: 'Hyper-personalized spiritual insights.' }
    ],
    recipe: 'utility'
  },
  {
    id: 'business',
    title: 'Business Model',
    subtitle: 'How we make money',
    models: [
      { type: 'SaaS (B2C)', desc: 'Monthly subscriptions ($9.99 - $49.99)' },
      { type: 'Micro-transactions', desc: 'Pay-per-report (Vastu/Astrology)' },
      { type: 'B2B Licensing', desc: 'API access for spiritual brands' }
    ],
    recipe: 'luxury'
  },
  {
    id: 'tech',
    title: 'Technology & IP',
    subtitle: 'The Moat',
    features: [
      { title: 'Proprietary Prompt Engineering', desc: 'Logic jo copy karna namumkin hai.' },
      { title: 'Scalable AI Architecture', desc: 'Cloud-based system for millions of users.' },
      { title: 'Data Loop', desc: 'Har interaction se AI aur behtar hota jata hai.' }
    ],
    recipe: 'technical'
  },
  {
    id: 'roadmap',
    title: 'Traction & Roadmap',
    subtitle: 'The Journey Ahead',
    steps: [
      { phase: 'Current State', desc: 'MVP/Prototype ready (20+ Micro-apps).' },
      { phase: 'Phase 1', desc: 'Beta launch with 1,000 "Founding Members".' },
      { phase: 'Phase 2', desc: 'Global expansion (English + Sanskrit + Hindi).' }
    ],
    recipe: 'editorial'
  },
  {
    id: 'ask',
    title: 'The Ask',
    subtitle: 'Valuation & Funding',
    details: {
      target: 'Seeking Seed Funding ($500k - $1M)',
      valuation: '$2M - $5M (Pre-revenue/Early Stage)',
      allocation: [
        { label: 'Product R&D', value: '50%' },
        { label: 'Marketing', value: '30%' },
        { label: 'Operations', value: '20%' }
      ]
    },
    recipe: 'luxury'
  }
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-[80vh] flex flex-col bg-black text-white rounded-[3rem] overflow-hidden relative border border-white/10">
      {/* Navigation Controls */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
        <div className="text-[10px] font-mono opacity-40 tracking-widest">
          {String(currentSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevSlide}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={nextSlide}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full border border-indigo-400/50 transition-all shadow-lg shadow-indigo-900/20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="w-full h-full flex flex-col"
          >
            {/* Background for Title Slide */}
            {slide.bg && (
              <div className="absolute inset-0 z-0">
                <Image 
                  src={slide.bg} 
                  alt="Background" 
                  fill 
                  className="object-cover opacity-30"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col p-12 lg:p-24 justify-center">
              {/* Header */}
              <div className="space-y-4 mb-12">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-indigo-500/20"
                >
                  <Sparkles className="w-3 h-3" />
                  {slide.subtitle}
                </motion.div>
                <h2 className={`text-6xl lg:text-8xl font-serif font-bold tracking-tight leading-none ${slide.recipe === 'brutalist' ? 'uppercase' : ''}`}>
                  {slide.title}
                </h2>
              </div>

              {/* Dynamic Content Sections */}
              <div className="max-w-4xl">
                {slide.content && (
                  <p className="text-2xl lg:text-3xl text-white/70 font-light leading-relaxed italic font-serif">
                    &quot;{slide.content}&quot;
                  </p>
                )}

                {slide.points && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {slide.points.map((p, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-4 hover:bg-white/10 transition-all"
                      >
                        <div className="p-3 bg-indigo-500/20 rounded-xl w-fit">
                          <p.icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h4 className="text-xl font-bold">{p.title}</h4>
                        <p className="text-sm text-white/60 leading-relaxed">{p.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {slide.highlights && (
                  <div className="space-y-6">
                    {slide.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-4 text-2xl font-light">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                        {h}
                      </div>
                    ))}
                  </div>
                )}

                {slide.stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {slide.stats.map((s, i) => (
                      <div key={i} className="space-y-2">
                        <div className="text-5xl font-bold text-indigo-400">{s.value}</div>
                        <div className="text-sm font-bold uppercase tracking-widest text-white/40">{s.label}</div>
                        <div className="text-xs text-white/60">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                )}

                {slide.pillars && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {slide.pillars.map((p, i) => (
                      <div key={i} className="p-6 border-l-2 border-indigo-500 bg-white/5 space-y-1">
                        <h4 className="text-lg font-bold">{p.title}</h4>
                        <p className="text-sm text-white/60">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {slide.models && (
                  <div className="space-y-4">
                    {slide.models.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-xl font-bold">{m.type}</span>
                        <span className="text-indigo-400 font-mono">{m.desc}</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.features && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {slide.features.map((f, i) => (
                      <div key={i} className="space-y-2">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">0{i+1}</div>
                        <h4 className="text-lg font-bold">{f.title}</h4>
                        <p className="text-sm text-white/60">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {slide.steps && (
                  <div className="space-y-8">
                    {slide.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-8">
                        <div className="text-4xl font-serif italic text-white/20">0{i+1}</div>
                        <div className="flex-1 pb-8 border-b border-white/10">
                          <h4 className="text-xl font-bold text-indigo-400">{s.phase}</h4>
                          <p className="text-lg text-white/80">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {slide.details && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Target</label>
                        <div className="text-3xl font-bold">{slide.details.target}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Valuation</label>
                        <div className="text-3xl font-bold text-indigo-400">{slide.details.valuation}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Allocation</label>
                      {slide.details.allocation.map((a, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{a.label}</span>
                            <span className="font-mono">{a.value}</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: a.value }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Branding */}
            <div className="p-12 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-serif text-xl font-bold">W</div>
                <div className="text-sm font-serif font-bold tracking-tight">World Archaeos</div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                Confidential & Proprietary
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-500" style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }} />
    </div>
  );
}
