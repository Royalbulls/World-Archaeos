'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Wind, 
  Shield, 
  Cpu, 
  Loader2, 
  Sparkles, 
  Info, 
  ChevronRight, 
  Download,
  Box,
  Activity,
  Target
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

type TechType = 'vimana' | 'astra' | 'robotics';

import { UserProfileData } from './UserProfile';

export default function VedicTechLab({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<TechType>('vimana');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<string>('');

  const techSpecs = {
    vimana: [
      'Pushpaka (Mercury Vortex)',
      'Shakuna (Bird-shaped Propulsion)',
      'Rukma (Golden High-Speed)',
      'Tripura (Interdimensional City)'
    ],
    astra: [
      'Brahmastra (Nuclear Equivalent)',
      'Narayanastra (Self-Replicating AI)',
      'Sudarshana (Intelligent Disc)',
      'Pashupatastra (Antimatter Weapon)'
    ],
    robotics: [
      'Yantra Purusha (Mechanical Guard)',
      'Kritakas (Artificial Beings)',
      'Maya Danava Automata',
      'Talking Temple Statues'
    ]
  };

  const runSimulation = async (spec: string) => {
    setSelectedSpec(spec);
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Perform a high-level scientific and spiritual simulation of the following ancient Vedic technology: ${spec}.
      
      Based on the book "The Divine Code", analyze:
      1. **Technological Basis**: How it mirrors modern AI, robotics, or quantum physics (e.g., Mercury plasma engines, AI-guided targeting).
      2. **Activation Logic**: The role of Mantras as programming code or frequency triggers.
      3. **Strategic Purpose**: Its role in upholding Dharma.
      4. **Modern Equivalent**: Compare it to current or future tech (e.g., Hypersonic missiles, BCI, AGI).
      5. **Ethical Framework**: The dangers of misuse (Asuric vs. Dharmic use).
      
      The output MUST be in the following language/style: ${
        globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
        globalLanguage === 'hi' ? 'Pure Hindi' : 
        globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
        'English'
      }.
      
      Provide a detailed technical report in Markdown format.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a Chief Scientist at the Vedic Research Institute. You specialize in decoding ancient Sanskrit texts into modern engineering and AI concepts. Be technical, visionary, and respectful of Sanatana Dharma."
        }
      }));

      setAnalysis(response.text || "Simulation failed to initialize.");
    } catch (error) {
      console.error(error);
      setAnalysis("Error in simulation core.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Vedic Tech Lab</h2>
          </div>
          <p className="text-lg opacity-60 max-w-2xl leading-relaxed">
            Decoding the forgotten sciences of the Sages. Simulate ancient aerospace, 
            intelligent weaponry, and automata through the lens of modern AI and physics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
            <div className="flex gap-2 mb-6">
              {[
                { id: 'vimana', icon: Wind, label: 'Aerospace' },
                { id: 'astra', icon: Target, label: 'Astras' },
                { id: 'robotics', icon: Box, label: 'Robotics' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as TechType);
                    setAnalysis(null);
                  }}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    activeTab === t.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-[#f5f2ed] text-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5'
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Select Specification</label>
              {techSpecs[activeTab].map(spec => (
                <button
                  key={spec}
                  onClick={() => runSimulation(spec)}
                  disabled={loading}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    selectedSpec === spec 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-[#f5f2ed] text-[#1a1a1a]/60 hover:bg-blue-50'
                  }`}
                >
                  {spec}
                  <ChevronRight className="w-3 h-3 opacity-30" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-900 text-blue-50 rounded-[2rem] p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="font-serif text-lg">Simulation Engine</h3>
            </div>
            <p className="text-xs opacity-70 leading-relaxed">
              Our engine uses quantum-inspired algorithms to test the aerodynamic and energetic 
              viability of descriptions found in the Vaimanika Shastra and Mahabharata.
            </p>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Technical Analysis</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-40">Vedic Engineering Report</p>
                </div>
              </div>
              {analysis && (
                <button className="p-2 hover:bg-blue-50 rounded-xl transition-all text-blue-600">
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Processing Ancient Blueprints...</p>
                  <p className="text-[10px] mt-2 uppercase tracking-[0.2em]">Decoding Sanskrit Frequency Patterns</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-sm max-w-none prose-blue">
                  <Markdown>{analysis}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <Box className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">Select a technology to begin simulation.</p>
                  <p className="text-xs mt-4 max-w-xs">The lab will analyze the scientific basis of ancient Vedic gadgets.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
