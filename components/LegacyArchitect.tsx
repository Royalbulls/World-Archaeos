'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  TrendingUp, 
  BookOpen, 
  Download, 
  Zap, 
  Globe, 
  Video, 
  Camera, 
  MessageCircle, 
  Mail,
  ChevronRight,
  Sparkles,
  Calculator,
  Award,
  Lock,
  Share2,
  Loader2
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';

interface LegacyPlan {
  childName: string;
  niche: string;
  estimatedValue: number;
  roiDetails: string;
  roadmap: { phase: string; goal: string; action: string }[];
  suggestedHandles: string[];
  identityManual: {
    voice: string;
    values: string[];
    visuals: string;
    security: string;
  };
}

const NICHES = [
  { id: 'creative', label: 'Creative/Artistic', multiplier: 1.5, icon: Sparkles },
  { id: 'tech', label: 'Tech/Innovation', multiplier: 2.0, icon: Zap },
  { id: 'lifestyle', label: 'Lifestyle/Influencer', multiplier: 1.8, icon: Camera },
  { id: 'educational', label: 'Educational/Scholar', multiplier: 1.2, icon: BookOpen }
];

export default function LegacyArchitect() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('lifestyle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<LegacyPlan | null>(null);

  const handleGenerate = async () => {
    if (!name) return;
    setIsGenerating(true);
    try {
      const ai = getGeminiModel();
      const selectedNiche = NICHES.find(n => n.id === niche);
      
      const prompt = `Act as a Digital Legacy Architect and Financial Forecaster. 
      Generate a comprehensive 18-year digital legacy plan for a child named "${name}" in the "${selectedNiche?.label}" niche.
      
      Requirements:
      1. **ROI Projection**: Estimate the potential financial value of this child's digital identity at age 18 in Indian Rupees (INR). Provide a brief explanation of how this value is reached.
      2. **18-Year Roadmap**: Provide a 4-phase roadmap (Year 0, Year 1-5, Year 6-12, Year 13-18). Each phase must have a Phase Name, a Goal, and a Key Action.
      3. **Identity Manual**: Define the digital persona's Voice (tone), Core Values (3 items), Visual Identity (style), and Security Protocol (how to protect the identity).
      4. **Suggested Handles**: Suggest 4 unique, brandable social media handles.
      
      Return JSON format:
      {
        "estimatedValue": number,
        "roiDetails": "string",
        "roadmap": [
          { "phase": "string", "goal": "string", "action": "string" }
        ],
        "identityManual": {
          "voice": "string",
          "values": ["string"],
          "visuals": "string",
          "security": "string"
        },
        "suggestedHandles": ["string"]
      }`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedValue: { type: Type.NUMBER },
              roiDetails: { type: Type.STRING },
              roadmap: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    age: { type: Type.STRING },
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["age", "title", "desc"]
                }
              },
              identityManual: {
                type: Type.OBJECT,
                properties: {
                  voice: { type: Type.STRING },
                  values: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  visuals: { type: Type.STRING },
                  security: { type: Type.STRING }
                },
                required: ["voice", "values", "visuals", "security"]
              },
              suggestedHandles: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["estimatedValue", "roiDetails", "roadmap", "identityManual", "suggestedHandles"]
          },
          systemInstruction: "You are a world-class Digital Legacy Architect. Your goal is to help parents build a multi-million dollar digital presence for their children from birth to adulthood."
        }
      }));

      let data = { estimatedValue: 5000000, roiDetails: '', roadmap: [], identityManual: { voice: '', values: [], visuals: '', security: '' }, suggestedHandles: [] };
      try {
        data = JSON.parse(response.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Failed to parse legacy plan");
      }

      setPlan({
        childName: name,
        niche: niche,
        estimatedValue: data.estimatedValue || 5000000,
        roiDetails: data.roiDetails || "Based on projected growth of the creator economy.",
        roadmap: data.roadmap || [],
        suggestedHandles: data.suggestedHandles || [],
        identityManual: data.identityManual || {
          voice: "Authentic and Inspiring",
          values: ["Integrity", "Innovation", "Impact"],
          visuals: "Clean, modern, and vibrant",
          security: "Multi-factor authentication and biometric locks"
        }
      });
      setStep(3);
    } catch (error) {
      console.error("Legacy generation error:", error);
      alert("Failed to architect legacy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">
          <Shield className="w-4 h-4" />
          World&apos;s First Digital Legacy Generator
        </div>
        <h2 className="font-serif text-5xl">Legacy Architect</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg">
          Design your child&apos;s 18-year digital empire. Generate a personalized roadmap, ROI projection, and identity manual.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-xl space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Child&apos;s Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-serif text-xl"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Future Path (Niche)</label>
              <div className="grid grid-cols-2 gap-3">
                {NICHES.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNiche(n.id)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                      niche === n.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 border-transparent hover:bg-white hover:border-indigo-100'
                    }`}
                  >
                    <n.icon className={`w-5 h-5 ${niche === n.id ? 'text-white' : 'text-indigo-600'}`} />
                    <p className="text-[10px] font-bold leading-tight">{n.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={!name || isGenerating}
              onClick={handleGenerate}
              className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Architecting...
                </>
              ) : (
                <>
                  Generate Legacy Plan <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Lock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Privacy First</span>
            </div>
            <p className="text-xs text-amber-800/70 leading-relaxed">
              This tool uses AI to project future value based on current market trends. No data is stored permanently until you save the plan.
            </p>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                  <Calculator className="w-10 h-10 text-gray-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl opacity-40">Ready to Build?</h3>
                  <p className="text-sm opacity-40 max-w-xs">Enter your child&apos;s name and select a niche to generate a comprehensive 18-year digital legacy plan.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* ROI Card */}
                <div className="bg-[#1a1a1a] text-white rounded-[3rem] p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Projected Value at Age 18</p>
                        <h3 className="font-serif text-5xl">₹{plan?.estimatedValue.toLocaleString()}</h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                          {plan?.niche} Niche
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                          High Potential
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs opacity-60 leading-relaxed">
                        This valuation includes projected Ad Revenue, Brand Equity, and Digital Asset appreciation (Domains/Handles).
                      </p>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">+420% Growth Expected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roadmap & Handles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-sm space-y-6">
                    <h4 className="font-serif text-xl flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      18-Year Roadmap
                    </h4>
                    <div className="space-y-6">
                      {plan?.roadmap.map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{item.phase}</p>
                            <p className="text-sm font-bold">{item.goal}</p>
                            <p className="text-xs text-[#1a1a1a]/60 leading-relaxed">{item.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-sm space-y-6">
                    <h4 className="font-serif text-xl flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      Identity Handles
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {plan?.suggestedHandles.map((handle, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group hover:bg-indigo-50 transition-all">
                          <span className="font-mono text-sm font-bold text-gray-600 group-hover:text-indigo-600">{handle}</span>
                          <div className="flex gap-2">
                            <Camera className="w-3 h-3 opacity-20" />
                            <Video className="w-3 h-3 opacity-20" />
                            <MessageCircle className="w-3 h-3 opacity-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 print:hidden">
                  <button 
                    onClick={handlePrint}
                    className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Download Full Legacy Book
                  </button>
                  <button className="px-8 py-4 bg-white text-[#1a1a1a] border border-[#1a1a1a]/10 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Plan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Book Preview Section */}
      {plan && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f5f2ed] rounded-[4rem] p-16 border border-[#1a1a1a]/5 space-y-12"
        >
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h3 className="font-serif text-4xl italic">The Digital Legacy Book</h3>
            <p className="text-[#1a1a1a]/60">A personalized 50-page manual generated specifically for {plan.childName}.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
            {/* Book Cover Mockup */}
            <div className="w-72 h-96 bg-[#1a1a1a] rounded-r-3xl shadow-2xl relative overflow-hidden group cursor-pointer perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-4 bg-black/40" />
              <div className="p-10 h-full flex flex-col justify-between relative z-10">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="font-serif text-2xl text-white leading-tight">The Legacy of <br />{plan.childName}</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-indigo-400">Volume I: Digital Foundation</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Archaeos Publishing</p>
                </div>
              </div>
            </div>

            {/* Book Content Preview */}
            <div className="flex-grow max-w-xl space-y-8">
              <div className="space-y-6">
                <h4 className="font-serif text-2xl">What&apos;s inside this book?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Identity Security', desc: plan.identityManual.security },
                    { title: 'Monetization Roadmap', desc: plan.roiDetails },
                    { title: 'Content Strategy', desc: `A 12-year plan for ${plan.niche} based storytelling.` },
                    { title: 'Brand Voice', desc: plan.identityManual.voice }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <h5 className="font-bold text-sm text-indigo-600">{item.title}</h5>
                      <p className="text-xs opacity-60 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Ready to Print?</p>
                    <p className="text-[10px] opacity-40">High-resolution PDF (12.4 MB)</p>
                  </div>
                </div>
                <button 
                  onClick={handlePrint}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                  Get My Copy
                </button>
              </div>
            </div>
          </div>

          {/* Print Only Section */}
          <div className="hidden print:block space-y-12 p-12 bg-white text-black">
            <div className="text-center space-y-4 border-b pb-12">
              <h1 className="text-6xl font-serif">The Digital Legacy of {plan.childName}</h1>
              <p className="text-xl uppercase tracking-widest opacity-60">18-Year Strategic Roadmap & Identity Manual</p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-serif border-b pb-2">ROI Projection</h2>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">₹{plan.estimatedValue.toLocaleString()}</p>
                  <p className="text-sm opacity-70">{plan.roiDetails}</p>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-serif border-b pb-2">Identity Handles</h2>
                <div className="space-y-2">
                  {plan.suggestedHandles.map(h => <p key={h} className="font-mono text-xl">{h}</p>)}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-serif border-b pb-2">18-Year Roadmap</h2>
              <div className="grid grid-cols-1 gap-8">
                {plan.roadmap.map((r, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="text-xl font-bold">{r.phase}</h3>
                    <p className="font-bold">Goal: {r.goal}</p>
                    <p className="opacity-70">{r.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-serif border-b pb-2">Identity Manual</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h3 className="font-bold">Brand Voice</h3>
                  <p>{plan.identityManual.voice}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold">Core Values</h3>
                  <ul className="list-disc list-inside">
                    {plan.identityManual.values.map(v => <li key={v}>{v}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold">Visual Identity</h3>
                  <p>{plan.identityManual.visuals}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold">Security Protocol</h3>
                  <p>{plan.identityManual.security}</p>
                </div>
              </div>
            </div>

            <div className="pt-12 text-center border-t opacity-40 text-xs">
              Generated by Legacy Architect • Archaeos Digital Research Institute • {new Date().toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
