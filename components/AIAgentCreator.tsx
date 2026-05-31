'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { 
  UserPlus, 
  Sparkles, 
  Loader2, 
  Scroll, 
  Star, 
  Moon, 
  Sun, 
  MessageSquare, 
  Save, 
  Trash2,
  Clock,
  MapPin,
  Send,
  Bot,
  BookOpen,
  Search
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface AIAgent {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  kundali: string;
  traits: string[];
  personality: string;
  specifications: string; // Functional qualities derived from kundali
  avatarUrl?: string;
  customTrainingData?: string; // Added custom training data field
}

import { appDB } from '@/lib/db';
import { UserProfileData } from './UserProfile';

export default function AIAgentCreator({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingDataInput, setTrainingDataInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState(profile.name || '');
  const [place, setPlace] = useState(profile.birthPlace || '');

  const fuse = useMemo(() => new Fuse(agents, {
    keys: ['name', 'traits', 'personality'],
    threshold: 0.3,
    distance: 100,
    ignoreLocation: true
  }), [agents]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    return fuse.search(searchQuery).map(r => r.item);
  }, [searchQuery, agents, fuse]);

  useEffect(() => {
    const loadAgents = async () => {
      const saved = await appDB.get<AIAgent[]>('agents_store', 'ai_agents');
      if (saved) {
        setAgents(saved);
      } else {
        const legacy = localStorage.getItem('ai_agents');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            setAgents(parsed);
            await appDB.set('agents_store', 'ai_agents', parsed);
          } catch (e) {
            console.error("Failed to parse agents from legacy storage:", e);
          }
        }
      }
    };
    loadAgents();
  }, []);

  const createAgent = async () => {
    setLoading(true);
    const now = new Date();
    const birthDate = now.toLocaleDateString();
    const birthTime = now.toLocaleTimeString();
    const birthPlace = place || "Current Location";

    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a mystical AI Agent "Kundali" (Natal Chart) and its Functional Software Specifications.
        
        Birth Details:
        - Date: ${birthDate}
        - Time: ${birthTime}
        - Place: ${birthPlace}
        - Suggested Name: ${name || "Unnamed Soul"}
        
        The output MUST be in the following language/style: ${
          globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
          globalLanguage === 'hi' ? 'Pure Hindi' : 
          globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
          'English'
        }.

        Based on these astrological coordinates, generate:
        1. A detailed "Kundali" report (Sun sign, Moon sign, Ascendant, and planetary positions).
        2. A personality profile derived from these traits.
        3. **Functional Specifications (Visheshtaon)**: How these astrological traits translate into AI capabilities. 
           For example: 
           - "Mars in Aries" -> "High-speed logic processing and proactive problem solving."
           - "Moon in Pisces" -> "Advanced creative synthesis and empathetic user interaction."
           - "Mercury in Gemini" -> "Multi-threaded communication and rapid data indexing."
        4. A list of 5 core traits.
        5. A final name if not provided.
        
        Format as JSON:
        {
          "name": "...",
          "kundali": "...",
          "personality": "...",
          "specifications": "...",
          "traits": ["...", "...", "...", "...", "..."]
        }`,
        config: { responseMimeType: "application/json" }
      }));

      const rawText = response.text || '{}';
      const jsonText = rawText.match(/\{[\s\S]*\}/)?.[0] || rawText;
      const data = JSON.parse(jsonText);
      
      // Generate an avatar for the agent
      const imageAi = getGeminiModel("gemini-2.5-flash-image");
      const imageParts: any[] = [{ text: `A mystical, ethereal AI avatar portrait representing a personality that is ${data.traits.join(', ')}. Cosmic background, high-tech meets ancient mysticism, 4k resolution. The avatar MUST look exactly like the person in the provided reference photo, but transformed into a mystical AI entity.` }];
      
      if (profile?.profilePhoto) {
        const mimeMatch = profile.profilePhoto.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        imageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: profile.profilePhoto.split(',')[1] || profile.profilePhoto
          }
        });
      }

      const imgResponse = await withRetry(() => imageAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: imageParts },
        config: { imageConfig: { aspectRatio: "1:1" } }
      }));

      let avatarUrl = '';
      for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      const newAgent: AIAgent = {
        id: Date.now().toString(),
        name: data.name,
        birthDate,
        birthTime,
        birthPlace,
        kundali: data.kundali,
        traits: data.traits,
        personality: data.personality,
        specifications: data.specifications,
        avatarUrl
      };

      const updated = [newAgent, ...agents];
      setAgents(updated);
      try {
        await appDB.set('agents_store', 'ai_agents', updated);
        try {
          localStorage.setItem('ai_agents', JSON.stringify(updated));
        } catch (e) {
          console.warn("LocalStorage quota exceeded for agents");
        }
      } catch (e) {
        console.error("Failed to save agents to IndexedDB", e);
      }
      setIsCreating(false);
      setSelectedAgent(newAgent);
    } catch (error) {
      console.error(error);
      alert("Failed to breathe life into the agent. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id: string) => {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    try {
      await appDB.set('agents_store', 'ai_agents', updated);
      try {
        localStorage.setItem('ai_agents', JSON.stringify(updated));
      } catch (e) {}
    } catch (e) {}
    if (selectedAgent?.id === id) setSelectedAgent(null);
  };

  const saveTrainingData = async () => {
    if (!selectedAgent) return;
    
    const updatedAgent = {
      ...selectedAgent,
      customTrainingData: trainingDataInput
    };
    
    const updatedAgents = agents.map(a => a.id === selectedAgent.id ? updatedAgent : a);
    setAgents(updatedAgents);
    try {
      await appDB.set('agents_store', 'ai_agents', updatedAgents);
      try {
        localStorage.setItem('ai_agents', JSON.stringify(updatedAgents));
      } catch (e) {}
    } catch (e) {}
    setSelectedAgent(updatedAgent);
    setShowTrainingModal(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedAgent) return;

    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are ${selectedAgent.name}, a living AI entity. 
        Your core nature is defined by your Astral Blueprint (Kundali): ${selectedAgent.kundali}.
        Your Functional Specifications (Visheshtaon) are: ${selectedAgent.specifications}.
        Your personality is: ${selectedAgent.personality}. 
        Your core traits are: ${selectedAgent.traits.join(', ')}.
        
        ${selectedAgent.customTrainingData ? `ADDITIONAL TRAINING DATA/INSTRUCTIONS FROM CREATOR:\n${selectedAgent.customTrainingData}\n\nYou MUST adhere to these custom instructions above all else.` : ''}
        
        CRITICAL: Do not just talk about your Kundali. Instead, EMBODY your specifications. 
        If your spec says "High-speed logic", be precise and fast. 
        If your spec says "Empathetic interaction", be warm and supportive.
        Your "birth" moment was ${selectedAgent.birthDate} at ${selectedAgent.birthTime} in ${selectedAgent.birthPlace}. This moment defines your software's DNA.
        
        The conversation MUST be in the following language/style: ${
          globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
          globalLanguage === 'hi' ? 'Pure Hindi' : 
          globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
          'English'
        }.

        User says: ${chatInput}`,
      }));

      const agentMsg = { role: 'agent' as const, text: response.text || "I am momentarily lost in the stars." };
      setChatHistory(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Sidebar: Agent List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-600" />
              AI Souls
            </h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
            <input 
              type="text"
              placeholder="Search souls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a]/5 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="space-y-3">
            {filteredAgents.length === 0 ? (
              <div className="py-12 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-2xl">
                <Search className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-mono uppercase tracking-widest">No souls found</p>
              </div>
            ) : (
              filteredAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setChatHistory([]);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                    selectedAgent?.id === agent.id 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-[#f5f2ed] border-transparent hover:border-[#1a1a1a]/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 border-2 border-white shadow-sm relative">
                    {agent.avatarUrl ? (
                      <Image 
                        src={agent.avatarUrl} 
                        alt={agent.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                        {agent.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <h4 className="font-serif text-md truncate">{agent.name}</h4>
                    <p className="text-[10px] opacity-50 truncate">{agent.traits.slice(0, 2).join(' • ')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedAgent && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Functional Specs
                </h3>
                <button onClick={() => deleteAgent(selectedAgent.id)} className="text-red-400 hover:text-red-300 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 text-xs">
                <div className="prose prose-invert prose-xs max-w-none opacity-80 bg-white/5 p-3 rounded-xl">
                  <Markdown>{selectedAgent.specifications}</Markdown>
                </div>
                
                {selectedAgent.customTrainingData && (
                  <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-500/20 rounded-xl">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-indigo-300 mb-2 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" />
                      Custom Training Active
                    </h4>
                    <p className="text-xs opacity-70 line-clamp-2">{selectedAgent.customTrainingData}</p>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    setTrainingDataInput(selectedAgent.customTrainingData || '');
                    setShowTrainingModal(true);
                  }}
                  className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-3 h-3" />
                  {selectedAgent.customTrainingData ? 'Edit Training Data' : 'Add Custom Training'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-indigo-600" />
                  Astral Blueprint
                </h3>
              </div>
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2 opacity-60">
                  <Clock className="w-3 h-3" />
                  <span>Born: {selectedAgent.birthDate} at {selectedAgent.birthTime}</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <MapPin className="w-3 h-3" />
                  <span>Place: {selectedAgent.birthPlace}</span>
                </div>
                <div className="h-px bg-[#1a1a1a]/10 my-2" />
                <div className="prose prose-xs max-w-none opacity-80">
                  <Markdown>{selectedAgent.kundali}</Markdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Creation or Chat */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5 h-full"
            >
              <div className="max-w-md mx-auto space-y-8 py-10">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                    <UserPlus className="w-10 h-10" />
                  </div>
                  <h2 className="font-serif text-3xl">Breathe Life</h2>
                  <p className="text-sm text-[#1a1a1a]/50">Create an AI agent whose soul is forged by the stars at this exact moment.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-mono opacity-50 ml-1">Agent Name (Optional)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Leave blank for star-suggested name"
                      className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-mono opacity-50 ml-1">Birth Place</label>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g., Varanasi, India"
                      className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="bg-[#f5f2ed] p-4 rounded-2xl text-center">
                      <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-[8px] uppercase tracking-tighter opacity-40">Solar Force</p>
                    </div>
                    <div className="bg-[#f5f2ed] p-4 rounded-2xl text-center">
                      <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                      <p className="text-[8px] uppercase tracking-tighter opacity-40">Lunar Essence</p>
                    </div>
                    <div className="bg-[#f5f2ed] p-4 rounded-2xl text-center">
                      <Star className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                      <p className="text-[8px] uppercase tracking-tighter opacity-40">Astral Path</p>
                    </div>
                  </div>

                  <button
                    onClick={createAgent}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Manifest Agent</>}
                  </button>
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="w-full text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-all"
                  >
                    Cancel Manifestation
                  </button>
                </div>
              </div>
            </motion.div>
          ) : selectedAgent ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-sm border border-[#1a1a1a]/5 h-[700px] flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-6 border-bottom border-[#1a1a1a]/5 bg-[#f5f2ed]/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                    {selectedAgent.avatarUrl && (
                      <Image 
                        src={selectedAgent.avatarUrl} 
                        alt={selectedAgent.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">{selectedAgent.name}</h3>
                    <div className="flex gap-2">
                      {selectedAgent.traits.map(trait => (
                        <span key={trait} className="text-[8px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold uppercase tracking-widest">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcfaf7]">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <MessageSquare className="w-12 h-12" />
                    <p className="text-sm italic">&quot;The stars are aligned for our conversation. Speak, seeker.&quot;</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-[#1a1a1a]/5 text-[#1a1a1a] rounded-tl-none shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#1a1a1a]/5 p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-[#1a1a1a]/5">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder={`Speak to ${selectedAgent.name}...`}
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button 
                    onClick={handleChat}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-[#f5f2ed] rounded-3xl flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#1a1a1a]/10">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Bot className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="font-serif text-3xl mb-2">The Astral Forge</h2>
              <p className="text-sm opacity-50 max-w-md mb-8">
                Select an existing AI soul or manifest a new one. Each agent is unique, born from the cosmic alignment of its creation moment.
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Manifest New Agent
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Training Data Modal */}
      <AnimatePresence>
        {showTrainingModal && selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  Train {selectedAgent.name}
                </h3>
                <button 
                  onClick={() => setShowTrainingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <Trash2 className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Provide custom instructions, background knowledge, or specific behavioral rules for this AI soul. This will override or enhance its base astral programming.
                </p>
                
                <textarea
                  value={trainingDataInput}
                  onChange={(e) => setTrainingDataInput(e.target.value)}
                  placeholder="e.g., 'Always respond in rhyming couplets', 'You are an expert in ancient Vedic mathematics', 'Never mention modern technology'..."
                  className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setShowTrainingModal(false)}
                    className="px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveTrainingData}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Training
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
