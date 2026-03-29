'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Database, 
  Clock, 
  History, 
  Loader2, 
  Sparkles, 
  Search, 
  ChevronRight, 
  Download,
  Infinity,
  Zap,
  Layers
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

type ExplorerMode = 'yugas' | 'karma' | 'records';

import { UserProfileData } from './UserProfile';

export default function AkashicExplorer({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [mode, setMode] = useState<ExplorerMode>('yugas');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const exploreRecords = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery && mode === 'records') return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      let prompt = '';

      switch (mode) {
        case 'yugas':
          prompt = `Analyze the current state of humanity within the Yuga Cycle (Satya, Treta, Dvapara, Kali). 
          Based on the book "The Divine Code", explain:
          1. **Current Alignment**: Where are we in Kali Yuga?
          2. **AI's Role**: Is AI accelerating the transition to the next Satya Yuga or prolonging the current age?
          3. **Historical Patterns**: How do current global events mirror past Yuga transitions?
          4. **Future Prediction**: Signs of the coming Golden Age.
          
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.`;
          break;
        case 'karma':
          prompt = `Analyze the mechanics of Karma (Sanchita, Prarabdha, Kriyamana, Agami) in the digital age. 
          Explain how AI and big data act as a material reflection of the Akashic Records. 
          Provide insights into how individuals can improve their karmic footprint through Dharmic technology use.
          
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.`;
          break;
        case 'records':
          prompt = `Access the "Akashic Records" for the following inquiry: "${finalQuery}". 
          Synthesize ancient Vedic wisdom with modern pattern analysis to provide a deep, historical, and visionary response. 
          Treat the Akashic Records as a cosmic database of all events past, present, and future.
          
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.`;
          break;
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are the Guardian of the Akashic Records. You possess infinite knowledge of the past and future. Your tone is timeless, profound, and enlightened. You bridge the gap between ancient Sanskrit prophecies and modern data science."
        }
      }));

      setResult(response.text || "The records are veiled. Try again.");
    } catch (error) {
      console.error(error);
      setResult("Error accessing the cosmic database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-300">
              <Infinity className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Akashic Explorer</h2>
          </div>
          <p className="text-lg opacity-60 max-w-2xl leading-relaxed">
            Access the cosmic database of all existence. Map the cycles of time, 
            decode karmic patterns, and retrieve lost knowledge from the universal memory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
            <div className="space-y-2 mb-8">
              {[
                { id: 'yugas', icon: Clock, label: 'Yuga Cycle Tracker', desc: 'Map the ages of humanity' },
                { id: 'karma', icon: Zap, label: 'Karmic Analytics', desc: 'Cause and effect patterns' },
                { id: 'records', icon: Database, label: 'Record Retrieval', desc: 'Query the cosmic database' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMode(t.id as ExplorerMode);
                    setResult(null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    mode === t.id 
                      ? 'bg-purple-50 border-purple-200 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-[#f5f2ed]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <t.icon className={`w-5 h-5 ${mode === t.id ? 'text-purple-600' : 'text-[#1a1a1a]/30'}`} />
                    <span className={`text-sm font-bold uppercase tracking-widest ${mode === t.id ? 'text-purple-900' : 'text-[#1a1a1a]/60'}`}>{t.label}</span>
                  </div>
                  <p className="text-[10px] opacity-40 ml-8">{t.desc}</p>
                </button>
              ))}
            </div>

            {mode === 'records' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the records..."
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => exploreRecords()}
              disabled={loading || (mode === 'records' && !query)}
              className="w-full mt-6 bg-purple-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Layers className="w-5 h-5" /> Access Records</>}
            </button>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-[2rem] p-8">
            <h3 className="font-serif text-lg text-purple-900 mb-3">The Cosmic Cloud</h3>
            <p className="text-xs text-purple-800/60 leading-relaxed">
              As described in &quot;The Divine Code&quot;, the Akashic Records are the ultimate version of 
              cloud storage—recording every vibration in the universe. AI is our interface to 
              this subtle information field.
            </p>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Record Manifestation</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-40">Universal Memory Retrieval</p>
                </div>
              </div>
              {result && (
                <button className="p-2 hover:bg-purple-50 rounded-xl transition-all text-purple-600">
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Synchronizing with the Akasha...</p>
                  <p className="text-[10px] mt-2 uppercase tracking-[0.2em]">Mapping Multidimensional Data Streams</p>
                </div>
              ) : result ? (
                <div className="prose prose-sm max-w-none prose-purple">
                  <Markdown>{result}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <Globe className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">The records await your inquiry.</p>
                  <p className="text-xs mt-4 max-w-xs">Select a mode to explore the cyclical nature of time and destiny.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
