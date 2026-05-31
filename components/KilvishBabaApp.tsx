'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Shield, 
  Zap, 
  Heart, 
  Share2, 
  Camera, 
  ShoppingBag, 
  MessageCircle, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  History, 
  Globe,
  Flame,
  Star,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  FileText,
  ShieldAlert,
  Coins,
  PenTool,
  Download,
  Copy,
  Mail,
  Megaphone,
  Youtube,
  HeartHandshake,
  Feather
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';

type KilvishTab = 'profile' | 'cleansing' | 'legacy' | 'community' | 'marketplace' | 'dham_studio';

interface SpiritualMemory {
  id: string;
  type: 'photo' | 'video' | 'thought';
  content: string;
  timestamp: string;
  caption?: string;
}

import { UserProfileData } from './UserProfile';

export default function KilvishBabaApp({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<KilvishTab>('profile');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [memories, setMemories] = useState<SpiritualMemory[]>([]);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [newMemory, setNewMemory] = useState({ type: 'thought' as const, content: '', caption: '' });
  const [nazarLevel, setNazarLevel] = useState<number | null>(null);
  
  // Dham Studio State
  const [dhamContent, setDhamContent] = useState<{title: string, text: string, imageUrl: string | null} | null>(null);
  const [isGeneratingDham, setIsGeneratingDham] = useState(false);
  const [dhamTopic, setDhamTopic] = useState('');
  const [dhamTemplate, setDhamTemplate] = useState<'inspirational' | 'educational' | 'urgent'>('inspirational');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(true);
      }
    };
    checkApiKey();

    const saved = localStorage.getItem('spiritual_memories');
    if (saved) {
      try {
        setMemories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse spiritual memories from localStorage:", e);
      }
    }
  }, []);

  const saveMemory = () => {
    const memory: SpiritualMemory = {
      id: Date.now().toString(),
      ...newMemory,
      timestamp: new Date().toLocaleString()
    };
    const updated = [memory, ...memories];
    setMemories(updated);
    localStorage.setItem('spiritual_memories', JSON.stringify(updated));
    setShowAddMemory(false);
    setNewMemory({ type: 'thought', content: '', caption: '' });
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('spiritual_memories', JSON.stringify(updated));
  };

  const generateCosmicInsight = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Generate a personalized cosmic insight and daily spiritual guidance for a seeker.
      
      Context: Kilvish Baba's Spiritual Social Network and the Kilvish Tan Mukti Dham initiative.
      Focus: Karma cleansing, energy protection, spiritual growth, and the importance of dignified final rites and preserving family legacy.
      Language: ${globalLanguage}.
      
      Include:
      1. **Daily Energy Reading**: Current cosmic vibrations.
      2. **Mantra of the Day**: A specific Sanskrit mantra for protection or growth.
      3. **Dham Wisdom**: A brief reflection on the importance of a dignified final journey or preserving memories, inspired by Kilvish Tan Mukti Dham.
      4. **Nazar Dosh Check**: A brief assessment of negative energy protection.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Kilvish Baba, a spiritual guide and tech innovator. You bridge ancient wisdom with digital intelligence. Your tone is wise, protective, and empowering."
        }
      }));

      setInsights(response.text || "The cosmos is silent today.");
    } catch (error) {
      console.error(error);
      setInsights("Error connecting to the cosmic grid.");
    } finally {
      setLoading(false);
    }
  };

  const runCleansingRitual = async (type: string) => {
    if (type === 'Nazar Dosh Removal') {
      setNazarLevel(Math.floor(Math.random() * 100));
    }
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Perform a virtual ${type} ritual for the user.
      
      Language: ${globalLanguage}.
      
      Provide:
      1. **Ritual Steps**: Visualizations and actions.
      2. **Protective Mantras**: Specific sounds for energy shielding.
      3. **Post-Ritual Guidance**: How to maintain the cleansed state.
      4. **Energy Seal**: A final blessing from Kilvish Baba.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Kilvish Baba. You specialize in energy healing, Nazar Dosh removal, and spiritual protection."
        }
      }));

      setInsights(response.text || "The ritual could not be completed.");
    } catch (error) {
      console.error(error);
      setInsights("Ritual interrupted by energy flux.");
    } finally {
      setLoading(false);
    }
  };

  const generateDhamContent = async (contentType: 'blog' | 'daily_guide' | 'social' | 'newsletter' | 'press_release' | 'video_script' | 'fundraising_pitch' | 'memorial_tribute' | 'daily_bundle') => {
    setIsGeneratingDham(true);
    setDhamContent(null);
    try {
      const ai = getGeminiModel();
      
      let prompt = '';
      const topicContext = dhamTopic ? `Specific Topic: ${dhamTopic}. ` : '';
      const templateContext = `Tone/Style: ${dhamTemplate}. `;

      if (contentType === 'daily_bundle') {
        prompt = `Generate a "Daily Dham Bundle" including 1 Short Blog, 1 Social Media Post, and 1 Daily Spiritual Guide. ${topicContext}${templateContext} Focus on Kilvish Tan Mukti Dham's mission. Format as JSON: {"title": "Daily Dham Bundle", "text": "### Blog\\n...\\n\\n### Social Post\\n...\\n\\n### Daily Guide\\n..."}`;
      } else {
        switch (contentType) {
          case 'blog':
            prompt = `Write a comprehensive, SEO-friendly blog post about Kilvish Tan Mukti Dham. ${topicContext}${templateContext} Focus on dignified final rites, eco-friendly cremations, digital memorials, and preserving family legacy. Include a catchy title. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'daily_guide':
            prompt = `Write a daily spiritual guide for families dealing with grief or planning for the future, inspired by Kilvish Tan Mukti Dham's philosophy. ${topicContext}${templateContext} Include a comforting thought, a practical step for legacy preservation, and a short prayer. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'social':
            prompt = `Write an engaging social media post promoting Kilvish Tan Mukti Dham's mission. ${topicContext}${templateContext} Include relevant hashtags. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'newsletter':
            prompt = `Write an engaging email newsletter update for Kilvish Tan Mukti Dham supporters. ${topicContext}${templateContext} Highlight recent milestones and community impact. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'press_release':
            prompt = `Write a professional press release for Kilvish Tan Mukti Dham. ${topicContext}${templateContext} Follow standard press release format. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'video_script':
            prompt = `Write a 60-second video script (YouTube Shorts / Reels) for Kilvish Tan Mukti Dham. ${topicContext}${templateContext} Include visual cues and spoken audio. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'fundraising_pitch':
            prompt = `Write a compelling fundraising and CSR pitch for Kilvish Tan Mukti Dham. ${topicContext}${templateContext} Explain the social and environmental impact. Format as JSON: {"title": "...", "text": "..."}`;
            break;
          case 'memorial_tribute':
            prompt = `Write a beautiful digital memorial tribute template for Kilvish Tan Mukti Dham. ${topicContext}${templateContext} It should be touching and respectful. Format as JSON: {"title": "...", "text": "..."}`;
            break;
        }
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["title", "text"]
          },
          systemInstruction: "You are a content creator for Kilvish Tan Mukti Dham, a spiritual and social initiative. Always return valid JSON."
        }
      }));

      let data = { title: 'Dham Content', text: '' };
      try {
        data = JSON.parse(response.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", response.text);
        // Fallback: if parsing fails but there is text, try to extract title and text manually or just use raw text
        data = { 
          title: 'Dham Content', 
          text: response.text || 'The cosmos provided a message, but it was difficult to decode.' 
        };
      }

      // Generate Image
      let imageUrl = null;
      try {
        const imageResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `Peaceful transition, eco-friendly nature, digital glowing memories, divine light, respectful and calming atmosphere. Highly cinematic and spiritual. No text.` }] },
          config: { imageConfig: { aspectRatio: "16:9" } }
        }));
        
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (e) {
        console.error("AI Image generation failed, using fallback:", e);
        // Fallback to a high-quality spiritual placeholder image
        imageUrl = `https://picsum.photos/seed/spiritual_dham_${Date.now()}/1200/675`;
      }

      setDhamContent({ title: data.title || 'Dham Content', text: data.text || '', imageUrl });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingDham(false);
    }
  };

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error opening key selector:", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Brand Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-[#f5f2ed] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="font-serif text-4xl font-bold tracking-tight uppercase">KILVISH BABA</h2>
              </div>
              
              {!hasApiKey && window.aistudio && (
                <button 
                  onClick={handleOpenKeySelector}
                  className="hidden md:flex px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-amber-400 transition-all items-center gap-2"
                >
                  <ShieldAlert className="w-3 h-3" />
                  Select API Key for Pro Features
                </button>
              )}
            </div>
            <p className="text-xl opacity-80 font-serif italic max-w-xl leading-relaxed">
              &quot;Connecting the spiritual world with the digital age. Home of the Kilvish Tan Mukti Dham.&quot;
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-indigo-100 overflow-hidden relative">
                    <Image 
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      alt="Seeker" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">12.4k Seekers Online</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={generateCosmicInsight}
              className="px-8 py-4 bg-yellow-400 text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" /> Get Daily Insight
            </button>
            <p className="text-[10px] text-center opacity-40 uppercase tracking-widest">Founder: Krishna Vishwakarma • Director: Vandna Thakur</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] border border-[#1a1a1a]/5 shadow-sm">
        {[
          { id: 'profile', label: 'Spiritual Profile', icon: User },
          { id: 'cleansing', label: 'Energy Cleansing', icon: Shield },
          { id: 'legacy', label: 'Legacy Vault', icon: History },
          { id: 'community', label: 'Seeker Circle', icon: Globe },
          { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
          { id: 'dham_studio', label: 'Dham Studio', icon: PenTool }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as KilvishTab);
              setInsights(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Workspace */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Kilvish Tan Mukti Dham Mission Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-200/50 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-2xl text-amber-900">Kilvish Tan Mukti Dham</h3>
              </div>
              <p className="text-amber-800/80 leading-relaxed mb-6 max-w-2xl">
                A revolutionary initiative to provide dignified final rites, eco-friendly cremations, and digital memorials. 
                We are building a space where every soul receives respect, and every family&apos;s legacy is preserved for eternity.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl text-xs font-bold text-amber-900">
                  <Shield className="w-4 h-4 text-amber-600" /> Dignified Rites
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl text-xs font-bold text-amber-900">
                  <History className="w-4 h-4 text-amber-600" /> Digital Memorials
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl text-xs font-bold text-amber-900">
                  <Heart className="w-4 h-4 text-amber-600" /> Eco-Friendly
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 border-4 border-white shadow-xl overflow-hidden font-serif text-4xl">
                      {profile.name ? profile.name[0] : 'K'}
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl">{profile.name || 'Modern Seeker'}</h3>
                      <p className="text-sm opacity-50">{profile.birthPlace || 'Global'} • Level 12 Spiritual Explorer</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[8px] font-bold uppercase tracking-widest">Protected</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[8px] font-bold uppercase tracking-widest">Karma: Balanced</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#f5f2ed] p-6 rounded-3xl text-center">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-red-400" />
                      <p className="text-xl font-bold">84%</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Soul Harmony</p>
                    </div>
                    <div className="bg-[#f5f2ed] p-6 rounded-3xl text-center">
                      <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-xl font-bold">2.4k</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Karmic Points</p>
                    </div>
                    <div className="bg-[#f5f2ed] p-6 rounded-3xl text-center">
                      <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-xl font-bold">High</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Energy Shield</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <h4 className="font-serif text-xl mb-6">Spiritual Progress</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Meditation Consistency', val: 75, color: 'bg-indigo-500' },
                      { label: 'Karma Cleansing', val: 40, color: 'bg-emerald-500' },
                      { label: 'Mantra Mastery', val: 90, color: 'bg-purple-500' }
                    ].map(p => (
                      <div key={p.label} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
                          <span>{p.label}</span>
                          <span>{p.val}%</span>
                        </div>
                        <div className="h-2 bg-[#f5f2ed] rounded-full overflow-hidden">
                          <div className={`h-full ${p.color}`} style={{ width: `${p.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cleansing' && (
              <motion.div
                key="cleansing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <h3 className="font-serif text-2xl mb-2">Energy Cleansing Lab</h3>
                  <p className="text-sm opacity-50 mb-8">Remove Nazar Dosh and negative energy through AI-guided rituals.</p>
                  
                  {nazarLevel !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Nazar Dosh Assessment</p>
                        <h4 className="font-serif text-xl text-red-900">Negative Energy Level: {nazarLevel}%</h4>
                        <p className="text-xs text-red-700/60 mt-1">Baba recommends an immediate &quot;Aura Shielding&quot; ritual.</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 flex items-center justify-center font-bold text-red-600">
                        {nazarLevel}%
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'nazar', label: 'Nazar Dosh Removal', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
                      { id: 'karma', label: 'Karma Cleansing', icon: History, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { id: 'aura', label: 'Aura Shielding', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { id: 'chakra', label: 'Chakra Balancing', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => runCleansingRitual(r.label)}
                        className={`p-6 rounded-[2rem] border border-transparent hover:border-[#1a1a1a]/10 transition-all text-left flex items-center gap-4 ${r.bg}`}
                      >
                        <div className={`p-4 rounded-2xl bg-white shadow-sm ${r.color}`}>
                          <r.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">{r.label}</p>
                          <p className="text-[10px] opacity-40">Start AI-Guided Ritual</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-6 h-6 text-yellow-400" />
                    <h4 className="font-serif text-xl">Live Healing Sessions</h4>
                  </div>
                  <p className="text-sm opacity-70 mb-6 leading-relaxed">
                    Participate in real-time energy healing guided by Kilvish Baba&apos;s wisdom. 
                    Next session starts in: <span className="font-bold text-yellow-400">14:22</span>
                  </p>
                  <button className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                    Join Waiting Room
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'legacy' && (
              <motion.div
                key="legacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-serif text-2xl">Legacy Vault</h3>
                      <p className="text-sm opacity-50">Preserve your spiritual journey for future generations.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddMemory(true)}
                      className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {memories.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-[#1a1a1a]/10 rounded-[2rem]">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-serif text-xl">Your vault is empty.</p>
                        <p className="text-xs mt-2">Add your first spiritual memory.</p>
                      </div>
                    ) : (
                      memories.map(m => (
                        <div key={m.id} className="bg-[#f5f2ed] p-6 rounded-3xl relative group">
                          <button 
                            onClick={() => deleteMemory(m.id)}
                            className="absolute top-4 right-4 p-2 bg-white rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-lg text-indigo-600">
                              {m.type === 'photo' ? <ImageIcon className="w-4 h-4" /> : m.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{m.timestamp}</span>
                          </div>
                          <p className="text-sm leading-relaxed mb-4">{m.content}</p>
                          {m.caption && <p className="text-[10px] italic opacity-50"># {m.caption}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <h3 className="font-serif text-2xl mb-8">Seeker Circle</h3>
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-6 pb-8 border-b border-[#1a1a1a]/5 last:border-0">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0 relative">
                          <Image 
                            src={`https://picsum.photos/seed/user${i+10}/100/100`} 
                            alt="User" 
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">Seeker_{i}42</h4>
                            <span className="text-[10px] opacity-30 uppercase tracking-widest">{i}h ago</span>
                          </div>
                          <p className="text-sm text-[#1a1a1a]/70 leading-relaxed">
                            Just finished the 21-day Karma Cleansing ritual. I feel a profound shift in my energy. 
                            The AI-guided visualizations were incredibly vivid. Highly recommend the &quot;Aura Shielding&quot; session!
                          </p>
                          <div className="flex items-center gap-4 pt-2">
                            <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                              <Heart className="w-3 h-3" /> 24
                            </button>
                            <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                              <MessageCircle className="w-3 h-3" /> 8
                            </button>
                            <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                              <Share2 className="w-3 h-3" /> Share
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'marketplace' && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-serif text-2xl">Spiritual Marketplace</h3>
                      <p className="text-sm opacity-50">Sacred items and personalized consultations.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-sm border border-yellow-100">
                      <Coins className="w-4 h-4" /> 1,240
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { name: 'Sudarshana Amulet', price: '₹1,299', img: 'https://picsum.photos/seed/amulet/400/400', desc: 'AI-blessed protective charm.' },
                      { name: 'Sri Yantra Plate', price: '₹2,499', img: 'https://picsum.photos/seed/yantra/400/400', desc: 'Hand-etched copper energy grid.' },
                      { name: 'Personalized Kundali', price: '₹999', img: 'https://picsum.photos/seed/kundali/400/400', desc: 'Deep astrological report.' },
                      { name: 'Karma Cleansing Kit', price: '₹1,599', img: 'https://picsum.photos/seed/kit/400/400', desc: 'Complete set for home rituals.' }
                    ].map(item => (
                      <div key={item.name} className="bg-[#f5f2ed] rounded-3xl overflow-hidden border border-transparent hover:border-indigo-200 transition-all group">
                        <div className="aspect-square relative overflow-hidden">
                          <Image 
                            src={item.img} 
                            alt={item.name} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                            {item.price}
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                          <p className="text-xs opacity-50 mb-4">{item.desc}</p>
                          <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dham_studio' && (
              <motion.div
                key="dham_studio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl">Dham Content Studio</h3>
                      <p className="text-sm opacity-50">Refine and generate comprehensive content to spread the mission of Kilvish Tan Mukti Dham.</p>
                    </div>
                  </div>

                  {/* AI Guided Prompts & Templates */}
                  <div className="bg-[#f5f2ed] rounded-3xl p-6 mb-8 space-y-4 border border-[#1a1a1a]/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">AI Guided Writing Prompt</label>
                        <input 
                          type="text"
                          value={dhamTopic}
                          onChange={(e) => setDhamTopic(e.target.value)}
                          placeholder="e.g. The importance of Green Cremation..."
                          className="w-full bg-white border border-[#1a1a1a]/10 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Content Template / Tone</label>
                        <div className="flex gap-2">
                          {(['inspirational', 'educational', 'urgent'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setDhamTemplate(t)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                dhamTemplate === t 
                                  ? 'bg-amber-600 border-amber-600 text-white shadow-md' 
                                  : 'bg-white border-[#1a1a1a]/10 text-[#1a1a1a]/40 hover:bg-gray-50'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={() => generateDhamContent('daily_bundle')}
                        disabled={isGeneratingDham}
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" /> Generate Daily Dham Bundle
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                      { id: 'blog', label: 'Blog Post', icon: FileText },
                      { id: 'daily_guide', label: 'Daily Guide', icon: Star },
                      { id: 'social', label: 'Social Post', icon: Share2 },
                      { id: 'newsletter', label: 'Newsletter', icon: Mail },
                      { id: 'press_release', label: 'Press Release', icon: Megaphone },
                      { id: 'video_script', label: 'Video Script', icon: Youtube },
                      { id: 'fundraising_pitch', label: 'CSR Pitch', icon: HeartHandshake },
                      { id: 'memorial_tribute', label: 'Tribute', icon: Feather }
                    ].map((type) => (
                      <button 
                        key={type.id}
                        onClick={() => generateDhamContent(type.id as any)}
                        disabled={isGeneratingDham}
                        className="p-4 bg-[#f5f2ed] hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-2xl transition-all flex flex-col items-center gap-2 disabled:opacity-50 text-center"
                      >
                        <type.icon className="w-6 h-6 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  {isGeneratingDham && (
                    <div className="py-12 flex flex-col items-center justify-center text-amber-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">Channeling Dham Wisdom...</p>
                    </div>
                  )}

                  {dhamContent && !isGeneratingDham && (
                    <div className="bg-[#f5f2ed] rounded-[2rem] overflow-hidden border border-[#1a1a1a]/5">
                      {dhamContent.imageUrl && (
                        <div className="w-full h-64 relative">
                          <Image 
                            src={dhamContent.imageUrl} 
                            alt="Dham Content" 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="p-8">
                        <h4 className="font-serif text-2xl mb-6">{dhamContent.title}</h4>
                        <div className="prose prose-sm max-w-none prose-amber mb-8">
                          <Markdown>{dhamContent.text}</Markdown>
                        </div>
                        <div className="flex gap-4 border-t border-[#1a1a1a]/10 pt-6">
                          <button 
                            onClick={() => navigator.clipboard.writeText(dhamContent.text)}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all"
                          >
                            <Copy className="w-4 h-4" /> Copy Text
                          </button>
                          {dhamContent.imageUrl && (
                            <a 
                              href={dhamContent.imageUrl}
                              download="dham_image.png"
                              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-amber-700 transition-all"
                            >
                              <Download className="w-4 h-4" /> Download Image
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: AI Insights & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-xl">Baba&apos;s Wisdom</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-40">AI Spiritual Assistant</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Consulting the Cosmos...</p>
                </div>
              ) : insights ? (
                <div className="prose prose-sm max-w-none prose-indigo">
                  <Markdown>{insights}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                  <Sparkles className="w-12 h-12 mb-6" />
                  <p className="font-serif text-xl italic">Ask for guidance or get your daily cosmic insight.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#1a1a1a]/5 space-y-4">
              <button 
                onClick={() => setShowPremium(true)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-yellow-400/10 text-yellow-700 rounded-2xl border border-yellow-200 hover:bg-yellow-400/20 transition-all"
              >
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Upgrade to Premium</span>
              </button>
              <p className="text-[10px] opacity-30 leading-relaxed text-center">
                Your spiritual journey is private and protected by advanced AI encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddMemory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemory(false)}
              className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="font-serif text-2xl mb-6">Add Spiritual Memory</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[
                    { id: 'thought', icon: FileText, label: 'Thought' },
                    { id: 'photo', icon: ImageIcon, label: 'Photo' },
                    { id: 'video', icon: Video, label: 'Video' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setNewMemory({ ...newMemory, type: t.id as any })}
                      className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                        newMemory.type === t.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-transparent border-[#1a1a1a]/10 opacity-40'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 ml-1">Content</label>
                  <textarea
                    value={newMemory.content}
                    onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                    placeholder="Describe your spiritual experience..."
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 ml-1">Caption / Tags</label>
                  <input
                    type="text"
                    value={newMemory.caption}
                    onChange={(e) => setNewMemory({ ...newMemory, caption: e.target.value })}
                    placeholder="e.g., #meditation #peace"
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={saveMemory}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
                >
                  Save to Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremium && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremium(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="bg-indigo-900 p-12 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                <div className="relative z-10">
                  <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                  <h3 className="font-serif text-4xl mb-2">Kilvish Premium</h3>
                  <p className="text-indigo-200 uppercase tracking-[0.3em] text-[10px] font-bold">Unlock the Full Cosmic Potential</p>
                </div>
              </div>
              
              <div className="p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-[#f5f2ed] rounded-3xl border border-indigo-100">
                    <h4 className="font-bold text-lg mb-4">Monthly Seeker</h4>
                    <p className="text-3xl font-serif mb-2">₹199<span className="text-sm opacity-40 font-sans">/mo</span></p>
                    <ul className="text-xs space-y-3 opacity-60 mb-8">
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Exclusive Rituals</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Daily Personalized Insights</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Priority Healing Sessions</li>
                    </ul>
                    <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Subscribe Now</button>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-200 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-black text-[8px] font-bold uppercase tracking-widest rounded-full">Best Value</div>
                    <h4 className="font-bold text-lg mb-4">Lifetime Soul</h4>
                    <p className="text-3xl font-serif mb-2">₹999<span className="text-sm opacity-40 font-sans">/year</span></p>
                    <ul className="text-xs space-y-3 opacity-60 mb-8">
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> All Monthly Features</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> 1-on-1 Spiritual Guidance</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Legacy Vault Unlimited Storage</li>
                    </ul>
                    <button className="w-full py-3 bg-indigo-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Get Lifetime Access</button>
                  </div>
                </div>
                
                <p className="text-[10px] text-center opacity-30">
                  By subscribing, you support the mission of connecting ancient wisdom with modern technology. 
                  All payments are secure and encrypted.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
