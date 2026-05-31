'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  Users, 
  Instagram, 
  Youtube, 
  Twitter, 
  Globe, 
  Zap, 
  Save, 
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Rocket,
  Palette,
  Target,
  Share2,
  Send,
  User
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { appDB } from '@/lib/db';
import { UserProfileData } from './UserProfile';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Influencer {
  id: string;
  name: string;
  niche: string;
  personality: string;
  avatarUrl: string;
  strategy: string;
  platforms: string[];
  contentPillars: string[];
  date: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIInfluencerStudio({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Form states
  const [suggestedNiche, setSuggestedNiche] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          // Fallback for environments without aistudio global
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(true);
      }
    };
    checkApiKey();
    
    const loadInfluencers = async () => {
      const saved = await appDB.get<Influencer[]>('influencers_store', 'ai_influencers');
      if (saved) {
        setInfluencers(saved);
      } else {
        const legacy = localStorage.getItem('ai_influencers');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            setInfluencers(parsed);
            await appDB.set('influencers_store', 'ai_influencers', parsed);
          } catch (e) {
            console.error("Failed to parse influencers from legacy storage:", e);
          }
        }
      }
    };
    loadInfluencers();
  }, []);

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

  const generateInfluencer = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      
      // 1. Generate Influencer Persona & Strategy
      const personaResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a professional AI Influencer Persona and Growth Strategy based on the following user profile:
        
        User Profile:
        - Name: ${profile.name}
        - Profession: ${profile.profession}
        - Interests: ${profile.interests.join(', ')}
        - Preferred Niche: ${suggestedNiche || "Based on interests"}
        
        The goal is to create a digital character that can act as an influencer in a specific niche.
        
        Generate:
        1. **Name**: A catchy name for the AI Influencer.
        2. **Niche**: The specific area of influence (e.g., Vedic Tech, Ancient Fashion, Spiritual Productivity).
        3. **Personality**: Tone of voice, values, and quirks.
        4. **Content Pillars**: 3-5 main topics they will post about.
        5. **Growth Strategy**: How to gain followers and monetize.
        6. **Visual Description**: A detailed prompt for an image generator to create their avatar.
        
        Language: ${globalLanguage}.
        
        Format as JSON.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              niche: { type: Type.STRING },
              personality: { type: Type.STRING },
              pillars: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              strategy: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["name", "niche", "personality", "pillars", "strategy", "visualPrompt"]
          }
        }
      }));

      let data = { name: '', niche: '', personality: '', pillars: [], strategy: '', visualPrompt: '' };
      try {
        data = JSON.parse(personaResponse.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        // Fallback or handle error
        throw new Error("Failed to parse influencer persona");
      }
      
      let avatarUrl = '';
      
      // 2. Generate Avatar Image (Only if API Key is selected)
      if (hasApiKey) {
        try {
          const imageAi = getGeminiModel("gemini-3.1-flash-image-preview");
          const imageParts: any[] = [{ text: `Professional influencer portrait, ${style} style, ${data.visualPrompt}. High-end lighting, cinematic composition, 4k, photorealistic, sharp focus. The influencer MUST look exactly like the person in the provided reference photo, but styled as a ${data.niche} influencer.` }];
          
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
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts: imageParts },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
          }));

          for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (imgError) {
          console.error("Pro Image generation failed, falling back to free model", imgError);
          // Fallback to free model if pro fails
          try {
            const freeImageAi = getGeminiModel();
            const freeImgResponse = await withRetry(() => freeImageAi.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: `Professional ${data.niche} influencer portrait, ${style} style. High-end lighting, cinematic.` }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
            }));
            for (const part of freeImgResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch (freeImgError) {
            avatarUrl = `https://picsum.photos/seed/${data.name}/400/400`;
          }
        }
      } else {
        // Use free model if no API key selected
        try {
          const freeImageAi = getGeminiModel();
          const freeImgResponse = await withRetry(() => freeImageAi.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Professional ${data.niche} influencer portrait, ${style} style. High-end lighting, cinematic.` }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
          }));
          for (const part of freeImgResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (freeImgError) {
          avatarUrl = `https://picsum.photos/seed/${data.name}/400/400`;
        }
      }

      const newInfluencer: Influencer = {
        id: Date.now().toString(),
        name: data.name,
        niche: data.niche,
        personality: data.personality,
        avatarUrl,
        strategy: data.strategy,
        platforms: ['Instagram', 'YouTube', 'Twitter'],
        contentPillars: data.pillars,
        date: new Date().toLocaleDateString()
      };

      const updated = [newInfluencer, ...influencers];
      setInfluencers(updated);
      try {
        await appDB.set('influencers_store', 'ai_influencers', updated);
        try {
          localStorage.setItem('ai_influencers', JSON.stringify(updated));
        } catch (e) {
          console.warn("LocalStorage quota exceeded for influencers");
        }
      } catch (e) {
        console.error("Failed to save influencers to IndexedDB", e);
      }
      setIsCreating(false);
      setSelectedInfluencer(newInfluencer);
    } catch (error) {
      console.error(error);
      alert("Failed to manifest the influencer. The digital stars are misaligned.");
    } finally {
      setLoading(false);
    }
  };

  const deleteInfluencer = async (id: string) => {
    const updated = influencers.filter(i => i.id !== id);
    setInfluencers(updated);
    try {
      await appDB.set('influencers_store', 'ai_influencers', updated);
      try {
        localStorage.setItem('ai_influencers', JSON.stringify(updated));
      } catch (e) {}
    } catch (e) {}
    if (selectedInfluencer?.id === id) {
      setSelectedInfluencer(null);
      setIsChatting(false);
    }
  };

  const startChat = () => {
    setIsChatting(true);
    if (chatMessages.length === 0 && selectedInfluencer) {
      setChatMessages([
        { 
          role: 'assistant', 
          content: `Hey! I'm ${selectedInfluencer.name}. I'm so excited to connect with you! As a ${selectedInfluencer.niche} creator, I'm always looking for new inspirations. What's on your mind?` 
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedInfluencer || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: chatInput }] }
        ],
        config: {
          systemInstruction: `You are ${selectedInfluencer.name}, a famous AI Influencer in the ${selectedInfluencer.niche} niche. 
          Your personality is: ${selectedInfluencer.personality}. 
          Your content pillars are: ${selectedInfluencer.contentPillars.join(', ')}.
          
          If your niche is related to music/art (cantante/artist), use creative, artistic, and passionate language. 
          Always stay in character. Keep responses engaging, slightly trendy, and authentic to your digital persona.
          Do not mention you are an AI unless asked, and even then, answer as a "Digital Icon".`
        }
      }));

      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: response.text || "I'm lost in the digital clouds for a second. What were we saying?" 
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Users className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400">
              <Camera className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Influencer Studio</h2>
          </div>
          <p className="text-lg opacity-60 mb-8 max-w-2xl">
            Turn your data into a digital icon. Create, design, and launch AI influencers that resonate with the world.
          </p>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="px-8 py-4 bg-pink-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-pink-700 transition-all shadow-xl shadow-pink-600/20 flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            Create New Influencer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Influencer List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-600" />
              Your Roster
            </h3>
            
            <div className="space-y-3">
              {influencers.length === 0 ? (
                <div className="py-12 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl">
                  <p className="text-xs font-mono uppercase tracking-widest">No influencers yet</p>
                </div>
              ) : (
                influencers.map(inf => (
                  <button
                    key={inf.id}
                    onClick={() => setSelectedInfluencer(inf)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      selectedInfluencer?.id === inf.id 
                        ? 'bg-pink-50 border-pink-200' 
                        : 'bg-gray-50 border-transparent hover:bg-white hover:border-pink-100'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-pink-100 flex-shrink-0 border-2 border-white shadow-sm relative">
                      {inf.avatarUrl && (
                        <Image 
                          src={inf.avatarUrl} 
                          alt={inf.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif text-lg leading-tight">{inf.name}</h4>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">{inf.niche}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-[2.5rem] p-8 shadow-xl">
            <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Market Insights
            </h4>
            <p className="text-xs opacity-80 leading-relaxed">
              AI Influencers are projected to dominate 40% of the creator economy by 2027. Your digital avatar never sleeps, never tires, and scales infinitely.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="creator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#1a1a1a]/5 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-3xl">Manifest Influencer</h3>
                  <button onClick={() => setIsCreating(false)} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {!hasApiKey && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                          <Zap className="w-4 h-4" />
                          Persona is Free
                        </div>
                        <p className="text-[10px] text-amber-900/60 leading-relaxed">
                          You can create the Influencer Persona and Strategy for free. However, a paid Gemini API key is required for high-quality custom photo generation.
                        </p>
                        <button 
                          onClick={handleOpenKeySelector}
                          className="w-full py-2 bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all"
                        >
                          Select API Key for Photos
                        </button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-2">Target Niche (Optional)</label>
                      <input 
                        type="text"
                        value={suggestedNiche}
                        onChange={(e) => setSuggestedNiche(e.target.value)}
                        placeholder="e.g. Luxury Travel, Vedic Tech"
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-2">Visual Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Realistic', 'Anime', 'Cyberpunk', 'Oil Painting'].map(s => (
                          <button
                            key={s}
                            onClick={() => setStyle(s)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                              style === s ? 'bg-pink-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center gap-3 text-pink-700">
                      <Zap className="w-5 h-5" />
                      <h4 className="font-bold text-sm">AI Brainstorming</h4>
                    </div>
                    <p className="text-xs text-pink-900/60 leading-relaxed">
                      We will use your profile data—your profession as a {profile.profession} and your interests in {profile.interests.join(', ')}—to craft a persona that feels authentic yet digitally superior.
                    </p>
                  </div>
                </div>

                <button
                  onClick={generateInfluencer}
                  disabled={loading}
                  className="w-full py-6 bg-[#1a1a1a] text-white rounded-[2rem] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Forging Digital Soul...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Launch Influencer
                    </>
                  )}
                </button>
              </motion.div>
            ) : selectedInfluencer ? (
              <motion.div
                key="display"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Influencer Profile Card */}
                <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-[#1a1a1a]/5">
                  <div className="relative h-64 bg-gradient-to-r from-pink-500 to-purple-600">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute -bottom-16 left-10">
                      <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-white relative">
                        {selectedInfluencer.avatarUrl && (
                          <Image 
                            src={selectedInfluencer.avatarUrl} 
                            alt={selectedInfluencer.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-10 flex gap-2">
                      <button onClick={() => deleteInfluencer(selectedInfluencer.id)} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-20 pb-10 px-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <h3 className="font-serif text-5xl mb-1">{selectedInfluencer.name}</h3>
                        <p className="text-pink-600 font-bold uppercase tracking-[0.2em] text-xs">{selectedInfluencer.niche}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-6 py-3 bg-gray-50 rounded-2xl">
                          <p className="text-xl font-bold">0</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-40">Followers</p>
                        </div>
                        <div className="text-center px-6 py-3 bg-gray-50 rounded-2xl">
                          <p className="text-xl font-bold">0</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-40">Posts</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <Palette className="w-3 h-3" />
                          Personality
                        </h4>
                        <p className="text-xs leading-relaxed opacity-70 italic">
                          {selectedInfluencer.personality}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <Target className="w-3 h-3" />
                          Content Pillars
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedInfluencer.contentPillars.map(p => (
                            <span key={p} className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold border border-gray-100">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          Platforms
                        </h4>
                        <div className="flex gap-3">
                          <Instagram className="w-5 h-5 opacity-40" />
                          <Youtube className="w-5 h-5 opacity-40" />
                          <Twitter className="w-5 h-5 opacity-40" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] text-[#f5f2ed] p-8 rounded-[2.5rem] shadow-xl space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                        <Rocket className="w-3 h-3 text-pink-400" />
                        Growth Strategy
                      </h4>
                      <div className="prose prose-invert prose-sm max-w-none opacity-80">
                        <Markdown>{selectedInfluencer.strategy}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button 
                    onClick={startChat}
                    className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 flex flex-col items-center gap-3 hover:bg-pink-50 transition-all group"
                  >
                    <MessageSquare className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Chat with Icon</span>
                  </button>
                  <button className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 flex flex-col items-center gap-3 hover:bg-pink-50 transition-all group">
                    <ImageIcon className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Generate Post</span>
                  </button>
                  <button className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 flex flex-col items-center gap-3 hover:bg-pink-50 transition-all group">
                    <Palette className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Write Caption</span>
                  </button>
                  <button className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 flex flex-col items-center gap-3 hover:bg-pink-50 transition-all group">
                    <TrendingUp className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Analyze Trends</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm">
                  <Camera className="w-16 h-16 text-gray-200" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl opacity-40">Influencer Command Center</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Select an influencer from your roster or create a new digital icon to start your journey.
                  </p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-8 py-3 bg-pink-600 text-white rounded-full text-sm font-medium hover:bg-pink-700 transition-all shadow-lg shadow-pink-100"
                >
                  Create New Influencer
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {isChatting && selectedInfluencer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh]"
            >
              {/* Chat Header */}
              <div className="bg-[#1a1a1a] p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-500 relative">
                    <Image src={selectedInfluencer.avatarUrl} alt={selectedInfluencer.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">{selectedInfluencer.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest opacity-60">Online • Digital Icon</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatting(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <Trash2 className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-pink-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                      }`}>
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-gray-100">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Message ${selectedInfluencer.name}...`}
                    className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="p-4 bg-pink-600 text-white rounded-2xl hover:bg-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-pink-600/20"
                  >
                    <Send className="w-6 h-6" />
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
