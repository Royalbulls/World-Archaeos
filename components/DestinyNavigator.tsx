'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Briefcase, 
  Heart, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Loader2, 
  History, 
  User, 
  Shield, 
  Zap,
  Download,
  Printer,
  ChevronLeft,
  Info,
  Globe
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';
import { UserProfileData } from './UserProfile';

interface DestinyNavigatorProps {
  profile: UserProfileData;
  globalLanguage: string;
}

type TimeFrame = 'today' | 'week' | 'month' | 'year' | 'past' | 'ancestor';

export default function DestinyNavigator({ profile, globalLanguage }: DestinyNavigatorProps) {
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Ancestor Mode State
  const [ancestorData, setAncestorData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    deathDate: '',
    relation: 'Grandfather'
  });

  const generateGuide = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      
      let prompt = '';
      const baseInfo = `
        Name: ${profile.name}
        Birth: ${profile.birthDate} at ${profile.birthTime} in ${profile.birthPlace}
        Gender: ${profile.gender}
        Profession: ${profile.profession}
        Marital Status: ${profile.maritalStatus}
      `;

      switch (timeFrame) {
        case 'today':
          prompt = `Generate a highly personalized Daily Destiny Guide for today (${new Date().toLocaleDateString()}). 
          User Profile: ${baseInfo}
          Include:
          1. **Daily Energy**: Overall vibe for the day.
          2. **Business/Career Advice**: Specific guidance for a ${profile.profession}.
          3. **Auspicious Elements**: Lucky color, lucky number, and best time for important tasks.
          4. **Relationship Insight**: Based on marital status (${profile.maritalStatus}).
          5. **Precautions**: What to avoid today.`;
          break;
        case 'week':
          prompt = `Generate a Weekly Destiny Forecast for the upcoming 7 days.
          User Profile: ${baseInfo}
          Include:
          1. **Weekly Theme**: The core focus of the week.
          2. **Professional Milestones**: What to expect in their business/job.
          3. **Financial Outlook**: Wealth and investment advice.
          4. **Health & Wellness**: Energy levels and physical health.
          5. **Day-by-Day Summary**: Brief one-liner for each day.`;
          break;
        case 'month':
          prompt = `Generate a Monthly Cosmic Roadmap for this month.
          User Profile: ${baseInfo}
          Include:
          1. **Major Transits**: How planetary movements affect them this month.
          2. **Business Strategy**: Best moves for their career/business.
          3. **Social & Family Life**: Marital and family dynamics.
          4. **Spiritual Growth**: Recommended rituals or meditations.
          5. **Key Dates**: 3 most important dates of the month.`;
          break;
        case 'year':
          prompt = `Generate a Yearly Life Blueprint for 2026.
          User Profile: ${baseInfo}
          Include:
          1. **Yearly Narrative**: The big picture of their life this year.
          2. **Career Trajectory**: Growth, changes, or stability in ${profile.profession}.
          3. **Personal Evolution**: Emotional and spiritual development.
          4. **Relationship Cycle**: Evolution of their ${profile.maritalStatus} status.
          5. **Quarterly Breakdown**: Focus for Q1, Q2, Q3, and Q4.`;
          break;
        case 'past':
          prompt = `Analyze the astrological and cosmic influences for a specific date in the past: ${customDate}.
          User Profile: ${baseInfo}
          Explain:
          1. **The Cosmic Snapshot**: What was happening in the stars on that day?
          2. **Personal Impact**: How did those influences likely manifest in the user's life then?
          3. **Karmic Lesson**: What was the hidden lesson of that period?
          4. **Retrospective Wisdom**: How can they use that experience for their current growth?`;
          break;
        case 'ancestor':
          prompt = `Perform an Ancestral Soul Analysis for:
          Relation: ${ancestorData.relation} (${ancestorData.name})
          Birth: ${ancestorData.birthDate} at ${ancestorData.birthTime} in ${ancestorData.birthPlace}
          Death Date: ${ancestorData.deathDate}
          
          Provide:
          1. **Soul Blueprint**: Their core personality and life purpose based on their birth chart.
          2. **Life Legacy**: The primary astrological influences that shaped their life journey.
          3. **Karmic Inheritance**: What traits or lessons have they passed down to their descendant (${profile.name})?
          4. **Spiritual Connection**: How can the user honor their memory and resolve any ancestral karma?
          5. **The Time of Departure**: Astrological significance of their passing date (${ancestorData.deathDate}).`;
          break;
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are the "Destiny Navigator," a master of Vedic Astrology, Western Astrology, Numerology, and Life Coaching. 
          Your advice is profound, accurate, and deeply personalized. 
          Use the provided profile details (profession, age, marital status, etc.) to make the advice feel unique to the user.
          
          Language Style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.
          
          Format the output as a beautiful, structured Markdown report with clear headings and bullet points.`
        }
      }));

      setGuide(response.text || "The stars are veiled. Try again later.");
    } catch (error) {
      console.error(error);
      setGuide("An error occurred while navigating the destiny streams.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!guide) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Destiny Guide - ${timeFrame.toUpperCase()}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
              h1 { color: #92400e; border-bottom: 2px solid #fef3c7; padding-bottom: 10px; }
              .meta { font-size: 12px; color: #666; margin-bottom: 30px; }
              .content { font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>DESTINY GUIDE: ${timeFrame.toUpperCase()}</h1>
            <div class="meta">Generated for ${profile.name} • Archaeos Digital Research Institute • ${new Date().toLocaleDateString()}</div>
            <div class="content">${(guide || '').replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadGuide = () => {
    if (!guide) return;
    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `destiny_guide_${timeFrame}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#1a1a1a]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Destiny Navigator</h2>
          </div>
          <p className="text-lg text-[#1a1a1a]/60 mb-8 max-w-2xl">
            Personalized cosmic guidance tailored to your profession, life stage, and ancestral lineage.
          </p>

          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'year', 'past', 'ancestor'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeFrame(tf);
                  setGuide(null);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                  timeFrame === tf 
                    ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg' 
                    : 'bg-[#f5f2ed] text-[#1a1a1a]/40 hover:bg-amber-50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Navigation Parameters
            </h3>

            {!profile.isSetup ? (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-6">
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest mb-1">Profile Required</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Please complete your profile in the &quot;My Profile&quot; tab to enable personalized navigation.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-[#f5f2ed] rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Active Identity</p>
                  <p className="text-sm font-bold">{profile.name}</p>
                  <p className="text-[10px] opacity-60 mt-1">{profile.profession} • {profile.maritalStatus}</p>
                </div>

                {timeFrame === 'past' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Target Date</label>
                    <input 
                      type="date" 
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                )}

                {timeFrame === 'ancestor' && (
                  <div className="space-y-4 pt-4 border-t border-[#1a1a1a]/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Ancestor Name</label>
                      <input 
                        type="text" 
                        value={ancestorData.name}
                        onChange={(e) => setAncestorData({...ancestorData, name: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="e.g. Late Shri Ram"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Date</label>
                        <input 
                          type="date" 
                          value={ancestorData.birthDate}
                          onChange={(e) => setAncestorData({...ancestorData, birthDate: e.target.value})}
                          className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Death Date</label>
                        <input 
                          type="date" 
                          value={ancestorData.deathDate}
                          onChange={(e) => setAncestorData({...ancestorData, deathDate: e.target.value})}
                          className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Place</label>
                      <input 
                        type="text" 
                        value={ancestorData.birthPlace}
                        onChange={(e) => setAncestorData({...ancestorData, birthPlace: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={generateGuide}
              disabled={loading || !profile.isSetup}
              className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Navigate Destiny</>}
            </button>
          </div>

          <div className="bg-amber-900 text-amber-50 rounded-[2rem] p-8 shadow-xl">
            <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Karmic Protection
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Our navigator uses high-precision ephemeris data to calculate planetary positions for any date in the last 5,000 years. 
              This allows for deep ancestral work and retrospective analysis.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">The Destiny Guide</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-40">
                    {timeFrame === 'ancestor' ? 'Ancestral Wisdom' : 'Personal Cosmic Roadmap'}
                  </p>
                </div>
              </div>
              
              {guide && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGuide(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f5f2ed] text-[#1a1a1a] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                    title="Print Guide"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadGuide}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                    title="Download Markdown"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Calculating Destiny Streams...</p>
                </div>
              ) : guide ? (
                <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal prose-amber">
                  <Markdown>{guide}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <History className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">The future is a tapestry yet to be woven.</p>
                  <p className="text-xs mt-4 max-w-xs">Select a timeframe and click &quot;Navigate Destiny&quot; to receive your personalized guide.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
