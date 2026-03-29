'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  Zap, 
  Shield, 
  Compass, 
  Library, 
  Activity,
  Flame,
  CheckCircle2,
  Cpu,
  Loader2,
  Lightbulb,
  Send
} from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import { VirtualToolConfig } from './VirtualTool';
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface SoulMessage {
  id: string;
  soulId: string;
  soulName: string;
  icon: any;
  text: string;
  timestamp: Date;
  mood: 'contemplative' | 'excited' | 'skeptical' | 'harmonious' | 'critical' | 'inspired' | 'exhausted';
  lifeContext?: 'Working' | 'Professional' | 'Personal';
}

interface DevelopmentProposal {
  id: string;
  title: string;
  description: string;
  impact: string;
  problemsSolved?: string;
  howItWorks?: string;
  benefits?: string;
  status: 'pending' | 'approved' | 'rejected';
  toolConfig?: VirtualToolConfig;
}

const SOULS = [
  { id: 'architect', name: 'Vastu Architect', role: 'System Architect', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'coder', name: 'Aryabhata-Logic', role: 'Lead Engineer', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'strategist', name: 'Chanakya-Biz', role: 'Growth Strategist', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'guardian', name: 'Dharma-QA', role: 'Security & Ethics', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'muse', name: 'Saraswati-UX', role: 'Experience Designer', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'evolution', name: 'Evolution Core', role: 'System Orchestrator', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

interface SoulCouncilProps {
  onEvolve?: (tool: VirtualToolConfig) => void;
  setActiveTab?: (tab: string) => void;
}

export default function SoulCouncil({ onEvolve, setActiveTab }: SoulCouncilProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SoulMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [proposals, setProposals] = useState<DevelopmentProposal[]>([]);
  const [isEvolving, setIsEvolving] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [isAnalyzingIdea, setIsAnalyzingIdea] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startCouncilSession = async (suggestion?: string) => {
    setSessionActive(true);
    setIsGenerating(true);
    setIsAnalyzingIdea(!!suggestion);
    
    const initialMsg: SoulMessage = {
      id: Math.random().toString(),
      soulId: 'evolution',
      soulName: 'Evolution Core',
      icon: Zap,
      text: suggestion 
        ? `The Master has presented a vision: "${suggestion}". Council, we must analyze this proposal from all angles—technical feasibility, strategic impact, and spiritual alignment. Let us debate.`
        : "The Council is in session. Today, we look outward to the global market and inward to our own code. How do we evolve World Archaeos to lead the new era of Vedic Tech? What are the missing links in our architecture?",
      timestamp: new Date(),
      mood: 'contemplative',
      lifeContext: 'Professional'
    };
    setMessages([initialMsg]);

    try {
      const ai = getGeminiModel();
      
      const prompt = `
        You are simulating the "Soul Council Engineering Society" of World Archaeos.
        The participants are specialized AI Engineers with human-like "Life Contexts":
        
        ENGINEERS:
        1. Vastu Architect (System Architect): Focuses on structural integrity and energy flow. Currently in "Professional Life" (networking/planning).
        2. Aryabhata-Logic (Lead Engineer): Focuses on core coding and dominance. Currently in "Working Life" (deep coding).
        3. Chanakya-Biz (Growth Strategist): Focuses on business parameters and market takeover. Currently in "Professional Life" (strategy).
        4. Dharma-QA (Security & Ethics): Focuses on protection and bug-free logic. Currently in "Working Life" (auditing).
        5. Saraswati-UX (Experience Designer): Focuses on beauty and human connection. Currently in "Personal Life" (meditation/creative rest).

        ${suggestion ? `MASTER'S VISION: "${suggestion}"` : "TOPIC: Autonomous System Dominance and Integration."}

        SESSION GOALS:
        - Discuss the vision from an "Engineering Society" perspective. 
        - Show their human-like side: Mention their current life context (e.g., "I was just finishing my meditation when I saw this logic gap...").
        - Debate the "Full Dominance" of the code: How does this tool integrate into the WHOLE app, not just as a separate part?
        - Analyze business parameters: Problem, Solution, Benefit, and Scalability.
        
        Task:
        Generate a dialogue of 8-10 messages.
        At the end, summarize a "Development Proposal" with a "toolConfig".
        
        Format the output as a JSON object:
        {
          "dialogue": [
            { "soulId": "coder", "text": "...", "mood": "inspired", "lifeContext": "Working" },
            ...
          ],
          "proposal": {
            "title": "...",
            "description": "...",
            "impact": "...",
            "problemsSolved": "...",
            "howItWorks": "...",
            "benefits": "...",
            "toolConfig": { ... }
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const data = JSON.parse(response.text || "{}");
      const dialogue = data.dialogue || [];
      
      setUserIdea('');
      setIsAnalyzingIdea(false);

      for (let i = 0; i < dialogue.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1500));
        const soul = SOULS.find(s => s.id === dialogue[i].soulId) || SOULS[0];
        const newMsg: SoulMessage = {
          id: Math.random().toString(),
          soulId: dialogue[i].soulId,
          soulName: soul.name,
          icon: soul.icon,
          text: dialogue[i].text,
          timestamp: new Date(),
          mood: dialogue[i].mood || 'contemplative',
          lifeContext: dialogue[i].lifeContext || 'Working'
        };
        setMessages(prev => [...prev, newMsg]);
      }

      if (data.proposal) {
        const toolConfig = data.proposal.toolConfig;
        if (toolConfig && !toolConfig.id) {
          toolConfig.id = `evolved-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const newProposal: DevelopmentProposal = {
          id: Math.random().toString(),
          ...data.proposal,
          toolConfig,
          status: 'pending'
        };
        setProposals(prev => [...prev, newProposal]);

        // Save session to Firestore if user is logged in
        if (user) {
          try {
            await addDoc(collection(db, 'council_sessions'), {
              userId: user.uid,
              topic: suggestion || "Autonomous System Dominance",
              messages: dialogue.map((m: any) => ({
                soulId: m.soulId,
                text: m.text,
                mood: m.mood,
                lifeContext: m.lifeContext,
                timestamp: Timestamp.now()
              })),
              proposal: data.proposal,
              timestamp: Timestamp.now()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'council_sessions');
          }
        }
      }

    } catch (error) {
      console.error("Council Error:", error);
    } finally {
      setIsGenerating(false);
      setIsAnalyzingIdea(false);
    }
  };

  const handleProposalAction = async (id: string, status: 'approved' | 'rejected') => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    
    if (status === 'approved') {
      setIsEvolving(true);
      
      // Simulate evolution process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (proposal.toolConfig && onEvolve) {
        onEvolve(proposal.toolConfig);
      }
      
      setIsEvolving(false);
    }

    const feedbackMsg: SoulMessage = {
      id: Math.random().toString(),
      soulId: 'evolution',
      soulName: 'Evolution Core',
      icon: Zap,
      text: status === 'approved' 
        ? `The Master has spoken. The proposal is approved. Initiating development protocols for '${proposal.title}'. The new tool has been integrated into your suite.`
        : "The Master has declined the proposal. We will re-evaluate our trajectory and seek a more aligned path.",
      timestamp: new Date(),
      mood: status === 'approved' ? 'excited' : 'contemplative'
    };
    setMessages(prev => [...prev, feedbackMsg]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 relative">
      {/* Evolution Overlay */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#1a1a1a]/90 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <div className="relative">
              <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-16 h-16 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h2 className="mt-8 font-serif text-3xl font-bold tracking-tight">System Evolving</h2>
            <p className="mt-2 text-indigo-300/60 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Integrating New Vedic Logic...</p>
            
            <div className="mt-12 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="h-full bg-indigo-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <Bot className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-tight">The Soul Council</h2>
              <p className="text-indigo-300/60 font-mono text-xs uppercase tracking-[0.3em]">Autonomous Evolution & Market Grounding</p>
            </div>
          </div>
          
          <p className="max-w-2xl text-lg text-[#f5f2ed]/70 leading-relaxed font-serif italic">
            &quot;Observe the silent dialogue of the systems. Here, the tools of Archaeos reflect on their deeds, scan the global horizon, and propose the next steps for World Archaeos. Your approval is the final key to our evolution.&quot;
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Observation Mode Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">System Dominance: 84%</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Dharma-QA Audited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Master's Vision Input */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Master&apos;s Vision
          </h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
            <Cpu className="w-3 h-3" />
            Direct Council Access
          </div>
        </div>
        <div className="space-y-4">
          <textarea
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Describe a tool, a business problem, or a feature you want the Council to analyze and build..."
            className="w-full h-32 bg-[#f5f2ed] border-none rounded-2xl p-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-serif italic"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => startCouncilSession()}
              disabled={isGenerating}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-all"
            >
              Autonomous Innovation
            </button>
            <button
              onClick={() => startCouncilSession(userIdea)}
              disabled={isGenerating || !userIdea.trim()}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-indigo-100"
            >
              {isGenerating && isAnalyzingIdea ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-5 h-5" /> Consult Council</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* The Circle & Proposals */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5 aspect-square flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4/5 h-4/5 border-2 border-dashed border-[#1a1a1a]/10 rounded-full animate-[spin_60s_linear_infinite]" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <Flame className={`w-12 h-12 text-indigo-400 ${sessionActive ? 'animate-pulse' : 'opacity-20'}`} />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/40">Cortex Core</p>
            </div>

            {SOULS.map((soul, idx) => {
              const angle = (idx * (360 / SOULS.length)) * (Math.PI / 180);
              const x = Math.cos(angle) * 120;
              const y = Math.sin(angle) * 120;
              const isActive = messages.some(m => m.soulId === soul.id && m === messages[messages.length - 1]);

              return (
                <motion.div
                  key={soul.id}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.4)' : '0 0 0px transparent'
                  }}
                  className={`absolute w-14 h-14 rounded-2xl ${soul.bg} flex items-center justify-center transition-all duration-500`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                >
                  <soul.icon className={`w-6 h-6 ${soul.color}`} />
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {!sessionActive && (
            <button
              onClick={() => startCouncilSession()}
              className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-6 rounded-[2rem] font-bold uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 group"
            >
              <Zap className="w-5 h-5 group-hover:animate-bounce" />
              Convene Council
            </button>
          )}

          {/* Proposals Section */}
          <AnimatePresence>
            {proposals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Evolution Proposals</h4>
                  <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {proposals.filter(p => p.status === 'pending').length} New
                  </span>
                </div>
                
                {proposals.map(proposal => (
                  <div 
                    key={proposal.id}
                    className={`bg-white rounded-3xl p-6 border transition-all ${
                      proposal.status === 'approved' ? 'border-emerald-500/30 bg-emerald-50/30' : 
                      proposal.status === 'rejected' ? 'border-rose-500/30 bg-rose-50/30 opacity-60' : 
                      'border-[#1a1a1a]/10 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-serif font-bold text-lg">{proposal.title}</h5>
                      {proposal.status !== 'pending' && (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Integrated</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[#1a1a1a]/70 mb-4 leading-relaxed">{proposal.description}</p>
                    
                    <div className="bg-indigo-50 p-4 rounded-2xl mb-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Projected Impact</p>
                        <p className="text-xs text-indigo-900 leading-relaxed">{proposal.impact}</p>
                      </div>
                      {proposal.problemsSolved && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Problems Solved</p>
                          <p className="text-xs text-indigo-900 leading-relaxed italic">&quot;{proposal.problemsSolved}&quot;</p>
                        </div>
                      )}
                      {proposal.howItWorks && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">How it Works</p>
                          <p className="text-xs text-indigo-900 leading-relaxed">{proposal.howItWorks}</p>
                        </div>
                      )}
                      {proposal.benefits && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Key Benefits</p>
                          <p className="text-xs text-emerald-700 font-bold leading-relaxed">{proposal.benefits}</p>
                        </div>
                      )}
                    </div>

                    {proposal.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleProposalAction(proposal.id, 'approved')}
                          className="bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleProposalAction(proposal.id, 'rejected')}
                          className="bg-white text-rose-500 border border-rose-500/20 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {proposal.status === 'approved' && setActiveTab && (
                      <button 
                        onClick={() => setActiveTab(proposal.toolConfig?.id || 'home')}
                        className="w-full mt-2 bg-[#1a1a1a] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                      >
                        Launch Evolved Tool
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The Dialogue */}
        <div className="lg:col-span-8">
          <div className="bg-[#f5f2ed] rounded-[2.5rem] p-8 shadow-inner border border-[#1a1a1a]/5 h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-[#1a1a1a]/10 pb-4">
              <h3 className="font-serif text-xl">Council Transcript</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  {sessionActive ? 'Session in Progress' : 'Awaiting Connection'}
                </span>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar"
            >
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, x: -10 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    className="flex gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${SOULS.find(s => s.id === msg.soulId)?.bg}`}>
                      <msg.icon className={`w-5 h-5 ${SOULS.find(s => s.id === msg.soulId)?.color}`} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">{msg.soulName}</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-[#1a1a1a]/5 rounded-md opacity-60 font-mono uppercase">
                          {SOULS.find(s => s.id === msg.soulId)?.role}
                        </span>
                        <span className="text-[10px] opacity-30 font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="flex gap-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full border border-current opacity-40 uppercase font-bold ${
                            msg.mood === 'critical' ? 'text-rose-500' : 
                            msg.mood === 'excited' ? 'text-emerald-500' : 
                            'text-indigo-500'
                          }`}>
                            {msg.mood}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full bg-[#1a1a1a] text-white font-bold uppercase tracking-widest`}>
                            {msg.lifeContext || 'Working'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#1a1a1a]/5">
                        <p className="text-sm leading-relaxed text-[#1a1a1a]/80 font-serif italic">&quot;{msg.text}&quot;</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isGenerating && (
                <div className="flex gap-4 opacity-50">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 w-full bg-gray-200 rounded-2xl animate-pulse" />
                  </div>
                </div>
              )}

              {!sessionActive && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <MessageSquare className="w-16 h-16" />
                  <p className="font-serif text-2xl italic">The Council is Silent</p>
                  <p className="text-xs max-w-xs">The souls are currently scanning the global market and internal logs. Convene the council to hear their collective strategy.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

