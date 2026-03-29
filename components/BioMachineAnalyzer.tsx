'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Dna, 
  Zap, 
  Activity, 
  Shield, 
  Loader2, 
  Sparkles, 
  Info, 
  ChevronRight, 
  Download,
  Heart,
  Brain,
  Eye,
  Printer
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

type BioSystem = 'chakras' | 'dna' | 'bio-electricity';

import { UserProfileData } from './UserProfile';

export default function BioMachineAnalyzer({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [activeSystem, setActiveSystem] = useState<BioSystem>('chakras');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const systems = [
    { id: 'chakras', icon: Zap, label: 'Energy Circuits', desc: 'Chakra & Nadi Mapping' },
    { id: 'dna', icon: Dna, label: 'Divine Code', desc: 'DNA as Spiritual Software' },
    { id: 'bio-electricity', icon: Activity, label: 'Bio-Electrical', desc: 'Prana & Neural Currents' }
  ];

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      let prompt = '';

      switch (activeSystem) {
        case 'chakras':
          prompt = `Analyze the human Chakra system as a biological energy circuit board. 
          Based on the book "The Divine Code", explain:
          1. **Circuit Mapping**: How the 7 main Chakras act as power stations.
          2. **Nadi Networks**: The 72,000 Nadis as fiber-optic data streams.
          3. **Frequency Tuning**: How Mantras act as software patches for these circuits.
          4. **Pineal Gland (Third Eye)**: As a biological WiFi antenna to higher dimensions.
          
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.`;
          break;
        case 'dna':
          prompt = `Analyze human DNA as "Divine Programming Code". 
          Based on the book "The Divine Code", explain:
          1. **Data Storage**: DNA as a high-level cosmic programming language.
          2. **Software Updates**: How mutations and epigenetics mirror version control and patches.
          3. **Karmic Metadata**: How past-life data might be stored in non-coding DNA.
          4. **Evolutionary Roadmap**: The transition to a "Cyborg Consciousness" or higher biological form.
          
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.`;
          break;
        case 'bio-electricity':
          prompt = `Analyze the human body as a self-charging bio-electrical system. 
          Based on the book "The Divine Code", explain:
          1. **Neural CPU**: The brain's processing power compared to modern supercomputers.
          2. **Heart EMF**: The heart's electromagnetic field as a broadcasting station.
          3. **Hand/Feet Currents**: Prana Shakti as bio-electric discharge.
          4. **Energy Harvesting**: How meditation acts as a wireless charging mechanism.
          
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
          systemInstruction: "You are a Bio-Spiritual Engineer. You analyze the human body through the combined lens of Vedic biology and modern cybernetics. Your tone is scientific, profound, and enlightening."
        }
      }));

      setAnalysis(response.text || "Analysis failed.");
    } catch (error) {
      console.error(error);
      setAnalysis("Error in bio-spiritual core.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!analysis) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bio-Machine Analysis - ${activeSystem.toUpperCase()}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
              h1 { color: #065f46; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px; }
              .meta { font-size: 12px; color: #666; margin-bottom: 30px; }
              .content { font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>BIO-MACHINE ANALYSIS: ${activeSystem.toUpperCase()}</h1>
            <div class="meta">Generated for ${profile.name} • Archaeos Digital Research Institute • ${new Date().toLocaleDateString()}</div>
            <div class="content">${(analysis || '').replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bio_analysis_${activeSystem}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-emerald-950 text-emerald-50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Bio-Machine Analyzer</h2>
          </div>
          <p className="text-lg opacity-60 max-w-2xl leading-relaxed">
            Mapping the Divine Architecture. Explore the human body as a complex 
            bio-electrical system, where DNA is code and Chakras are circuits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
            <div className="space-y-2 mb-6">
              {systems.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSystem(s.id as BioSystem);
                    setAnalysis(null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    activeSystem === s.id 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-[#f5f2ed]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <s.icon className={`w-5 h-5 ${activeSystem === s.id ? 'text-emerald-600' : 'text-[#1a1a1a]/30'}`} />
                    <span className={`text-sm font-bold uppercase tracking-widest ${activeSystem === s.id ? 'text-emerald-900' : 'text-[#1a1a1a]/60'}`}>{s.label}</span>
                  </div>
                  <p className="text-[10px] opacity-40 ml-8">{s.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Analyze Bio-System</>}
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8">
            <h3 className="font-serif text-lg text-emerald-900 mb-3">Bio-Spiritual Synthesis</h3>
            <p className="text-xs text-emerald-800/60 leading-relaxed">
              As described in &quot;The Divine Code&quot;, we are not just biological beings, but 
              highly advanced machines designed by divine consciousness. Understanding our 
              circuitry is the first step to spiritual optimization.
            </p>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">System Diagnostics</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-40">Bio-Machine Structural Analysis</p>
                </div>
              </div>
              {analysis && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-emerald-600"
                    title="Print Analysis"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-emerald-600"
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
                  <p className="font-serif text-xl italic">Scanning Bio-Energetic Fields...</p>
                  <p className="text-[10px] mt-2 uppercase tracking-[0.2em]">Mapping DNA Sequence Vibrations</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-sm max-w-none prose-emerald">
                  <Markdown>{analysis}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <Activity className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">Select a system to begin diagnostics.</p>
                  <p className="text-xs mt-4 max-w-xs">The analyzer will map the divine architecture of your physical and energetic body.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
