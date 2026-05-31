'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Target, 
  MessageSquare, 
  Heart, 
  Globe, 
  Zap, 
  Shield, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Copy, 
  Download, 
  Save, 
  Trash2,
  History,
  LayoutDashboard,
  Megaphone,
  UserCheck,
  Home,
  Clock,
  Rocket,
  Printer
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import Markdown from 'react-markdown';
import { UserProfileData } from './UserProfile';

interface BusinessStrategy {
  id: string;
  title: string;
  dna: string;
  marketing: string;
  competitors: string;
  communication: {
    clients: string;
    employees: string;
    world: string;
  };
  management: {
    self: string;
    family: string;
    social: string;
  };
  operations: string;
  date: string;
}

type DharmaTab = 'strategist' | 'briefing' | 'history';

export default function DharmaStrategist({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<DharmaTab>('strategist');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<BusinessStrategy | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<BusinessStrategy[]>([]);
  const [businessType, setBusinessType] = useState('');
  const [businessGoals, setBusinessGoals] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('archaeos_business_strategies');
    if (saved) {
      setSavedStrategies(JSON.parse(saved));
    }
  }, []);

  const generateStrategy = async () => {
    if (!businessType.trim()) {
      alert("Please enter your business type or industry.");
      return;
    }
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Generate a comprehensive "Archaeos Publisher CEO" Business Growth & Marketing Execution Strategy.
      
      User Profile (Business DNA Source):
      - Name: ${profile.name}
      - Profession: ${profile.profession}
      - Birth Details: ${profile.birthDate} at ${profile.birthTime} in ${profile.birthPlace}
      
      Business Context:
      - Industry/Type: ${businessType}
      - Goals: ${businessGoals || "Expansion and sustainable growth"}
      
      The strategy MUST be tailored to the user's "Kundali" (astrological blueprint) and provide:
      1. **Business DNA (Swaroop)**: Strengths, weaknesses, and core purpose based on birth details.
      2. **Marketing & Growth Strategy**: Specific execution steps for expansion.
      3. **Competitor Analysis**: How to identify and stay ahead of rivals using strategic wisdom.
      4. **Communication Protocols**: 
         - How to talk to Clients (Sales & Trust)
         - How to talk to Employees (Leadership & Motivation)
         - How to talk to the World (Public Relations)
      5. **Holistic Management**:
         - Self-Management (Mindset & Discipline)
         - Family Balance (Managing home while running business)
         - Social Media Strategy (Digital presence management)
      6. **Operational Roadmap**: How to run and scale the business effectively.

      Language/Style: ${
        globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Vedic Business Wisdom)' : 
        globalLanguage === 'hi' ? 'Pure Hindi' : 
        globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
        'Professional English'
      }.

      Format as JSON:
      {
        "title": "...",
        "dna": "...",
        "marketing": "...",
        "competitors": "...",
        "communication": {
          "clients": "...",
          "employees": "...",
          "world": "..."
        },
        "management": {
          "self": "...",
          "family": "...",
          "social": "..."
        },
        "operations": "..."
      }`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              dna: { type: Type.STRING },
              marketing: { type: Type.STRING },
              competitors: { type: Type.STRING },
              communication: {
                type: Type.OBJECT,
                properties: {
                  clients: { type: Type.STRING },
                  employees: { type: Type.STRING },
                  world: { type: Type.STRING }
                },
                required: ["clients", "employees", "world"]
              },
              management: {
                type: Type.OBJECT,
                properties: {
                  self: { type: Type.STRING },
                  family: { type: Type.STRING },
                  social: { type: Type.STRING }
                },
                required: ["self", "family", "social"]
              },
              operations: { type: Type.STRING }
            },
            required: ["title", "dna", "marketing", "competitors", "communication", "management", "operations"]
          },
          systemInstruction: "You are the Archaeos Publisher CEO Advisor, a world-class business strategist who combines ancient Vedic wisdom with modern corporate execution strategies."
        }
      }));

      let data = { title: '', dna: '', marketing: '', competitors: '', communication: { clients: '', employees: '', world: '' }, management: { self: '', family: '', social: '' }, operations: '' };
      try {
        data = JSON.parse(response.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Failed to parse business strategy");
      }
      const newStrategy: BusinessStrategy = {
        id: Date.now().toString(),
        ...data,
        date: new Date().toLocaleString()
      };

      setStrategy(newStrategy);
      const updated = [newStrategy, ...savedStrategies];
      setSavedStrategies(updated);
      localStorage.setItem('archaeos_business_strategies', JSON.stringify(updated));
    } catch (error) {
      console.error(error);
      alert("The cosmic board of directors is currently unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteStrategy = (id: string) => {
    const updated = savedStrategies.filter(s => s.id !== id);
    setSavedStrategies(updated);
    localStorage.setItem('archaeos_business_strategies', JSON.stringify(updated));
    if (strategy?.id === id) setStrategy(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadStrategy = () => {
    if (!strategy) return;
    const content = `
# ${strategy.title}
Generated on: ${strategy.date}

## Business DNA
${strategy.dna}

## Marketing & Growth
${strategy.marketing}

## Competitor Analysis
${strategy.competitors}

## Communication Protocols
### Clients
${strategy.communication.clients}
### Employees
${strategy.communication.employees}
### The World
${strategy.communication.world}

## Holistic Management
### Self
${strategy.management.self}
### Family
${strategy.management.family}
### Social Media
${strategy.management.social}

## Operational Roadmap
${strategy.operations}
    `;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dharma_strategy_${strategy.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printStrategy = () => {
    window.print();
  };

  const generateCEOBriefing = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Generate a "World Archaeos CEO Strategic Briefing" for World Archaeos.
      
      Context: 
      - Platform: World Archaeos (Research & Knowledge Platform)
      - Leadership: Krishna Vishwakarma (Founder & CEO), Vandna Thakur (Director)
      - Entity: Powered by Royal Bulls Advisory Private Limited
      
      Address these specific points:
      1. **Past, Future, Present**: The journey from vision to infrastructure to global trust.
      2. **Market Analysis**: The intersection of AI, Ancient Wisdom, and Heritage Preservation.
      3. **Growth & Execution**: Scaling the Vedic Intelligence model.
      4. **What is Needed**: Governance, data expansion, and institutional credibility.
      5. **Company News & Updates**: Recent leadership additions and tech milestones.
      6. **Technology**: Our AI stack (Gemini, Grounding, Multimodal).
      7. **Source of Funding & Cost Reduction**: Sustainable models and AI-driven efficiency.
      8. **What Can Be Done**: Immediate strategic actions.
      
      Language: ${globalLanguage}.
      Style: Authoritative, visionary, and strategically grounded. Use Markdown.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are the World Archaeos CEO, the strategic mind behind World Archaeos. You provide high-level briefings to the Founder & CEO."
        }
      }));

      setBriefing(response.text || "The cosmic vision is currently obscured.");
    } catch (error) {
      console.error(error);
      setBriefing("Error generating strategic briefing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Briefcase className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Rocket className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Dharma Strategist</h2>
          </div>
          <p className="text-lg opacity-60 mb-8 max-w-2xl">
            Vedic Business Intelligence for the Modern CEO. Align your business growth with your cosmic DNA.
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('strategist')}
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'strategist' ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Target className="w-4 h-4" />
              Strategist
            </button>
            <button
              onClick={() => {
                setActiveTab('briefing');
                if (!briefing) generateCEOBriefing();
              }}
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'briefing' ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              CEO Briefing
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <History className="w-4 h-4" />
              History ({savedStrategies.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className={`lg:col-span-4 space-y-6 print:hidden ${activeTab !== 'strategist' ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Business Context
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Business Type / Industry</label>
                <input 
                  type="text" 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g. Tech Startup, Organic Farm, Retail"
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Primary Goals</label>
                <textarea 
                  value={businessGoals}
                  onChange={(e) => setBusinessGoals(e.target.value)}
                  placeholder="e.g. Expand to 5 cities, Hire 20 people, Increase revenue by 50%..."
                  className="w-full h-32 bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={generateStrategy}
                disabled={loading}
                className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Strategy</>}
              </button>
            </div>
          </div>

          <div className="bg-indigo-900 text-indigo-50 rounded-[2rem] p-8 shadow-xl">
            <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Vedic Governance
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Our AI analyzes your birth chart to identify your &quot;Artha&quot; (wealth) and &quot;Dharma&quot; (duty) alignment, ensuring your business success is sustainable and spiritually grounded.
            </p>
          </div>
        </div>

        {/* Strategy Display Section */}
        <div className="lg:col-span-8 print:col-span-12 print:w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 min-h-[600px]"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-2xl">Strategy Archive</h3>
                  <button onClick={() => setActiveTab('strategist')} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Back to Strategist</button>
                </div>
                
                {savedStrategies.length === 0 ? (
                  <div className="py-20 text-center opacity-20 border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p>No strategies saved yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {savedStrategies.map(s => (
                      <div key={s.id} className="bg-[#f5f2ed] p-6 rounded-3xl border border-[#1a1a1a]/5 flex items-center justify-between group">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg">{s.title}</h4>
                          <p className="text-[10px] opacity-40">{s.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setStrategy(s);
                              setActiveTab('strategist');
                            }}
                            className="px-4 py-2 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteStrategy(s.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'briefing' ? (
              <motion.div
                key="briefing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#1a1a1a]/5 min-h-[600px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Megaphone className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10 border-b border-[#1a1a1a]/5 pb-6">
                    <div>
                      <h3 className="font-serif text-3xl">CEO Strategic Briefing</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mt-1">World Archaeos Roadmap</p>
                    </div>
                    <button 
                      onClick={generateCEOBriefing}
                      disabled={loading}
                      className="p-3 bg-[#f5f2ed] rounded-xl hover:bg-indigo-50 transition-all text-indigo-600 disabled:opacity-50"
                      title="Refresh Briefing"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    </button>
                  </div>

                  {loading && !briefing ? (
                    <div className="py-32 text-center opacity-30">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p className="font-serif text-xl italic">Synthesizing strategic intelligence...</p>
                    </div>
                  ) : briefing ? (
                    <div className="prose prose-indigo max-w-none">
                      <Markdown>{briefing}</Markdown>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : strategy ? (
              <motion.div
                key="strategy"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Strategy Controls */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5 flex items-center justify-between print:border-none print:shadow-none print:p-0 print:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl">{strategy.title}</h3>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">World Archaeos CEO Roadmap</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    <button 
                      onClick={printStrategy}
                      className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
                      title="Print Strategy"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={downloadStrategy}
                      className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
                      title="Download Strategy"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Strategy Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DNA & Marketing */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-500" />
                          Business DNA
                        </h4>
                        <button onClick={() => copyToClipboard(strategy.dna)} className="p-2 hover:bg-[#f5f2ed] rounded-lg transition-all"><Copy className="w-3 h-3 opacity-40" /></button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <Markdown>{strategy.dna}</Markdown>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          Growth & Marketing
                        </h4>
                        <button onClick={() => copyToClipboard(strategy.marketing)} className="p-2 hover:bg-[#f5f2ed] rounded-lg transition-all"><Copy className="w-3 h-3 opacity-40" /></button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <Markdown>{strategy.marketing}</Markdown>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <Target className="w-3 h-3 text-red-500" />
                          Competitor Analysis
                        </h4>
                        <button onClick={() => copyToClipboard(strategy.competitors)} className="p-2 hover:bg-[#f5f2ed] rounded-lg transition-all"><Copy className="w-3 h-3 opacity-40" /></button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <Markdown>{strategy.competitors}</Markdown>
                      </div>
                    </div>
                  </div>

                  {/* Communication & Management */}
                  <div className="space-y-6">
                    <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-xl space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        Communication Protocols
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <h5 className="text-xs font-bold text-indigo-300 mb-2">Client Interaction</h5>
                          <div className="text-xs opacity-70 leading-relaxed">
                            <Markdown>{strategy.communication.clients}</Markdown>
                          </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <h5 className="text-xs font-bold text-indigo-300 mb-2">Employee Leadership</h5>
                          <div className="text-xs opacity-70 leading-relaxed">
                            <Markdown>{strategy.communication.employees}</Markdown>
                          </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <h5 className="text-xs font-bold text-indigo-300 mb-2">Public Relations</h5>
                          <div className="text-xs opacity-70 leading-relaxed">
                            <Markdown>{strategy.communication.world}</Markdown>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                        <Heart className="w-3 h-3 text-rose-500" />
                        Holistic Management
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                          <h5 className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-2">
                            <UserCheck className="w-3 h-3" /> Self-Management
                          </h5>
                          <div className="text-xs text-rose-900/70 leading-relaxed">
                            <Markdown>{strategy.management.self}</Markdown>
                          </div>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <h5 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-2">
                            <Home className="w-3 h-3" /> Family Balance
                          </h5>
                          <div className="text-xs text-amber-900/70 leading-relaxed">
                            <Markdown>{strategy.management.family}</Markdown>
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <h5 className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-2">
                            <Megaphone className="w-3 h-3" /> Social Media
                          </h5>
                          <div className="text-xs text-indigo-900/70 leading-relaxed">
                            <Markdown>{strategy.management.social}</Markdown>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-600 text-white rounded-[2rem] p-8 shadow-xl space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <Rocket className="w-3 h-3" />
                        Operational Roadmap
                      </h4>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{strategy.operations}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]"
              >
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm">
                  <Briefcase className="w-16 h-16 text-gray-200" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl opacity-40">Dharma CEO Command Center</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Enter your business details on the left to generate a cosmic strategy for growth, communication, and holistic management.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <Sparkles className="w-3 h-3" />
                    Vedic Intelligence
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <TrendingUp className="w-3 h-3" />
                    Growth Strategy
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
