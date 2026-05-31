'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Mic2, 
  Play, 
  Pause, 
  Download, 
  History, 
  Sparkles,
  BookOpen,
  Volume2,
  ChevronRight,
  ScrollText,
  Trash2,
  TrendingUp,
  DollarSign,
  Share2,
  Image as ImageIcon,
  Youtube,
  Instagram,
  Twitter,
  X,
  Copy,
  Check
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import { Modality } from "@google/genai";
import Markdown from 'react-markdown';
import Image from 'next/image';
import { appDB } from '@/lib/db';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  increment,
  doc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

interface KathaEpisode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  topic: string;
  text: string;
  summary: string;
  thumbnailPrompt: string;
  thumbnailUrl: string | null;
  revenueTip: string;
  socialKit: {
    youtube: string;
    instagram: string;
    twitter: string;
  };
  audioUrl: string | null;
  audioBase64?: string | null;
  date: string;
}

interface KathaSeries {
  id: string;
  title: string;
  description: string;
  topic: string;
  episodeCount: number;
  episodes: KathaEpisode[];
  date: string;
}

const KATHA_TOPICS = [
  { id: 'ramayana', label: 'Ramayana', icon: '🏹', desc: 'The journey of Lord Rama, the ideal man.' },
  { id: 'mahabharata', label: 'Mahabharata', icon: '⚔️', desc: 'The epic struggle between Dharma and Adharma.' },
  { id: 'bhagavad_gita', label: 'Bhagavad Gita', icon: '☸️', desc: 'The divine song of Lord Krishna on the battlefield.' },
  { id: 'shiva_purana', label: 'Shiva Purana', icon: '🔱', desc: 'The legends and wisdom of Lord Shiva.' },
  { id: 'divine_potential', label: 'Divine Potential', icon: '✨', desc: 'Exploring the essence of ideas and human ability to understand power.' },
  { id: 'custom', label: 'Custom Topic', icon: '📜', desc: 'Enter any historical or spiritual event.' }
];

const VOICES = [
  { id: 'Charon', label: 'Deep & Wise', desc: 'Ideal for serious spiritual discourses.' },
  { id: 'Kore', label: 'Calm & Soothing', desc: 'Perfect for meditative stories.' },
  { id: 'Zephyr', label: 'Soft & Mystical', desc: 'Great for divine revelations.' }
];

const pcmToWav = (base64Pcm: string): { url: string; base64: string } => {
  const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  return { url, base64: base64Pcm };
};

export default function AIKathaVachak({ globalLanguage, profile, logActivity }: { globalLanguage: string, profile?: any, logActivity?: (action: string, tool: string) => void }) {
  const { user } = useAuth();
  const [activeTopic, setActiveTopic] = useState('ramayana');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Series & Episode States
  const [series, setSeries] = useState<KathaSeries[]>([]);
  const [activeSeries, setActiveSeries] = useState<KathaSeries | null>(null);
  const [restoredSeriesId, setRestoredSeriesId] = useState<string | null>(null);
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeEpisode = activeSeries?.episodes.find(e => e.id === activeEpisodeId) || null;

  // Load Series from Firestore
  useEffect(() => {
    if (!user) {
      setSeries([]);
      return;
    }

    const q = query(
      collection(db, 'katha_series'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        episodes: [] // Episodes will be loaded separately when a series is selected
      })) as unknown as KathaSeries[];
      setSeries(seriesData);
    }, (error) => {
      console.error("Error fetching katha series:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Load Episodes for Active Series
  useEffect(() => {
    if (!user || !activeSeries) return;

    const q = query(
      collection(db, 'katha_series', activeSeries.id, 'episodes'),
      orderBy('episodeNumber', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const episodesData = snapshot.docs.map(doc => {
        const data = doc.data();
        let audioUrl = null;
        if (data.audioBase64) {
          try {
            const pcmData = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
            const blob = new Blob([pcmData], { type: 'audio/wav' });
            audioUrl = URL.createObjectURL(blob);
          } catch (err) {
            console.error("Failed to recreate blob for episode:", err);
          }
        }
        return {
          id: doc.id,
          ...data,
          audioUrl
        };
      }) as KathaEpisode[];

      setActiveSeries(prev => prev ? { ...prev, episodes: episodesData } : null);
    }, (error) => {
      console.error("Error fetching episodes:", error);
    });

    return () => unsubscribe();
  }, [user, activeSeries?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save UI state periodically (still using IndexedDB for local UI state)
  useEffect(() => {
    const autoSave = async () => {
      const uiState = {
        activeTopic,
        customTopic,
        selectedVoice,
        newSeriesTitle,
        newSeriesDesc,
        activeSeriesId: activeSeries?.id
      };
      
      try {
        await appDB.set('katha_store', 'archaeos_katha_ui_state', uiState);
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    };

    const interval = setInterval(autoSave, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [activeTopic, customTopic, selectedVoice, newSeriesTitle, newSeriesDesc, activeSeries?.id]);

  useEffect(() => {
    const loadData = async () => {
      const savedUiState = await appDB.get<any>('katha_store', 'archaeos_katha_ui_state');

      if (savedUiState) {
        setActiveTopic(savedUiState.activeTopic || 'ramayana');
        setCustomTopic(savedUiState.customTopic || '');
        setSelectedVoice(savedUiState.selectedVoice || 'Charon');
        setNewSeriesTitle(savedUiState.newSeriesTitle || '');
        setNewSeriesDesc(savedUiState.newSeriesDesc || '');
        
        if (savedUiState.activeSeriesId) {
          setRestoredSeriesId(savedUiState.activeSeriesId);
        }
      }
    };
    loadData();
  }, []);

  // Restore active series once Firestore loads them
  useEffect(() => {
    if (restoredSeriesId && series.length > 0 && !activeSeries) {
      const found = series.find(s => s.id === restoredSeriesId);
      if (found) {
        setActiveSeries(found);
        setRestoredSeriesId(null); // Only restore once
      }
    }
  }, [series, restoredSeriesId, activeSeries]);

  const createSeries = async () => {
    if (!newSeriesTitle.trim() || !user) return;
    
    try {
      const newS = {
        userId: user.uid,
        title: newSeriesTitle,
        description: newSeriesDesc,
        topic: activeTopic === 'custom' ? customTopic : KATHA_TOPICS.find(t => t.id === activeTopic)?.label || 'Spiritual Journey',
        episodeCount: 0,
        date: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'katha_series'), newS);
      
      setActiveSeries({
        id: docRef.id,
        ...newS,
        date: new Date().toLocaleDateString(),
        episodes: []
      } as any);
      
      setIsCreatingSeries(false);
      setNewSeriesTitle('');
      setNewSeriesDesc('');
      
      if (logActivity) {
        logActivity(`Created Katha Series: ${newSeriesTitle}`, 'AI Katha Vachak');
      }
    } catch (e) {
      console.error("Error creating series:", e);
      alert("Failed to create series in the divine grid.");
    }
  };

  const deleteSeries = async (id: string) => {
    if (!user) return;
    try {
      // First delete all episodes
      const episodesSnapshot = await getDocs(collection(db, 'katha_series', id, 'episodes'));
      const deletePromises = episodesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      
      // Then delete the series
      await deleteDoc(doc(db, 'katha_series', id));
      
      if (activeSeries?.id === id) setActiveSeries(null);
    } catch (e) {
      console.error("Error deleting series:", e);
    }
  };

  const generateKatha = async () => {
    if (!activeSeries) return;

    setIsGenerating(true);
    setIsPlaying(false);
    setActiveEpisodeId(null);

    const episodeNumber = activeSeries.episodes.length + 1;
    const previousEpisodesContext = activeSeries.episodes.map(e => `Ep ${e.episodeNumber}: ${e.title}`).join(', ');

    try {
      const ai = getGeminiModel();
      
      // 1. Generate Katha Text & Metadata
      const textResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate Episode ${episodeNumber} of a spiritual "Katha" series titled "${activeSeries.title}".
        Series Topic: ${activeSeries.topic}
        Series Description: ${activeSeries.description}
        Previous Episodes: ${previousEpisodesContext || 'None (This is the first episode)'}

        Requirements:
        1. **Title**: A catchy title for this episode.
        2. **Katha Text**: A rhythmic, poetic, and deeply spiritual narration (approx 1000 words). Start with a traditional invocation if it's the first episode, or a recap if it's a sequel.
        3. **Summary**: A 2-sentence summary for YouTube/Social Media descriptions.
        4. **Thumbnail Prompt**: A detailed visual prompt for an AI image generator to create a YouTube thumbnail for this episode.
        5. **Revenue Tip**: One specific tip on how to monetize this specific episode content.
        6. **Social Kit**: Generate 3 distinct captions: one for YouTube (long), one for Instagram (engaging with emojis), and one for Twitter (short & punchy).

        Language: ${globalLanguage}.
        Format as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING },
              summary: { type: Type.STRING },
              thumbnailPrompt: { type: Type.STRING },
              revenueTip: { type: Type.STRING },
              socialKit: {
                type: Type.OBJECT,
                properties: {
                  youtube: { type: Type.STRING },
                  instagram: { type: Type.STRING },
                  twitter: { type: Type.STRING }
                },
                required: ["youtube", "instagram", "twitter"]
              }
            },
            required: ["title", "text", "summary", "thumbnailPrompt", "revenueTip", "socialKit"]
          },
          systemInstruction: "You are a world-renowned AI Katha Vachak. You specialize in narrating ancient Indian epics and spiritual texts with deep wisdom, rhythmic flow, and emotional resonance. Your goal is to create high-quality, episodic content suitable for public broadcasting and monetization."
        }
      }));

      let data: any = { title: '', text: '', summary: '', thumbnailPrompt: '', revenueTip: '', socialKit: { youtube: '', instagram: '', twitter: '' } };
      try {
        data = JSON.parse(textResponse.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text Length:", textResponse.text?.length);
        // If parsing fails, try a more aggressive regex match for the JSON object
        try {
          const match = textResponse.text?.match(/\{[\s\S]*\}/);
          if (match) {
            data = JSON.parse(match[0]);
          } else {
            throw parseError;
          }
        } catch {
          throw new Error("Failed to parse katha episode due to excessive length or invalid format.");
        }
      }

      // 2. Generate Thumbnail Image
      let thumbnailUrl = null;
      try {
        const imageParts: any[] = [{ text: `A high-quality, cinematic spiritual YouTube thumbnail for: ${data.thumbnailPrompt}. Style: Divine, epic, vibrant colors, 16:9 aspect ratio. The main character in the image MUST look exactly like the person in the provided reference photo, but dressed and styled as a spiritual figure or narrator in this scene.` }];
        
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

        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: imageParts,
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });
        
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            thumbnailUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imgErr) {
        console.error("Thumbnail generation failed:", imgErr);
        thumbnailUrl = `https://picsum.photos/seed/${Date.now()}/1280/720`;
      }

      // 3. Generate TTS Audio
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: data.text.substring(0, 600) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      let url = null;
      let audioBase64 = null;
      if (base64Audio) {
        const res = pcmToWav(base64Audio);
        url = res.url;
        audioBase64 = res.base64;
      }

      const newEpisodeData = {
        seriesId: activeSeries.id,
        episodeNumber,
        title: data.title,
        topic: activeSeries.topic,
        text: data.text,
        summary: data.summary,
        thumbnailPrompt: data.thumbnailPrompt,
        thumbnailUrl,
        revenueTip: data.revenueTip,
        socialKit: data.socialKit,
        audioBase64,
        date: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'katha_series', activeSeries.id, 'episodes'), newEpisodeData);
      
      // Increment episode count on the series document
      await updateDoc(doc(db, 'katha_series', activeSeries.id), {
        episodeCount: increment(1)
      });
      
      setActiveEpisodeId(docRef.id);
      
      if (logActivity) {
        logActivity(`Generated Katha Episode: ${data.title}`, 'AI Katha Vachak');
      }

    } catch (error) {
      console.error("Katha Generation Error:", error);
      alert("Failed to connect to the divine grid. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAudio = (url: string | null, title: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Audio.wav`;
    a.click();
  };

  const downloadImage = (url: string | null, title: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Thumbnail.png`;
    a.click();
  };

  const downloadScript = (text: string, title: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Script.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const navigateEpisode = (direction: 'next' | 'prev') => {
    if (!activeSeries || !activeEpisode) return;
    const currentIndex = activeSeries.episodes.findIndex(e => e.id === activeEpisode.id);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < activeSeries.episodes.length) {
      const nextEp = activeSeries.episodes[nextIndex];
      setActiveEpisodeId(nextEp.id);
    }
  };

  const downloadAllAssets = async (ep: KathaEpisode) => {
    downloadAudio(ep.audioUrl, ep.title);
    await new Promise(r => setTimeout(r, 500));
    downloadImage(ep.thumbnailUrl, ep.title);
    await new Promise(r => setTimeout(r, 500));
    downloadScript(ep.text, ep.title);
  };

  const shareEpisode = async (ep: KathaEpisode) => {
    const shareData = {
      title: ep.title,
      text: `Check out this episode: ${ep.title}\n\n${ep.summary}`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyToClipboard(shareData.text, 'Episode Link');
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {copiedLabel && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            {copiedLabel} Copied
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest border border-orange-100">
          <Mic2 className="w-4 h-4" />
          Divine Voice of Ancient Wisdom
        </div>
        <h2 className="font-serif text-5xl">AI Katha Vachak</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg italic">
          &quot;Listen to the eternal stories of Dharma, narrated by the intelligence of the future.&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Series Management */}
        <div className={`lg:col-span-4 space-y-6 ${activeSeries && 'hidden lg:block'}`}>
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-40">Your Series</h3>
              <button 
                onClick={() => setIsCreatingSeries(true)}
                className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {series.length === 0 ? (
                <div className="py-12 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl">
                  <p className="text-[10px] uppercase tracking-widest">No series started</p>
                </div>
              ) : (
                series.map(s => (
                  <div key={s.id} className="group relative">
                    <button
                      onClick={() => setActiveSeries(s)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        activeSeries?.id === s.id 
                          ? 'bg-orange-50 border-orange-200 shadow-sm' 
                          : 'bg-gray-50 border-transparent hover:bg-white hover:border-orange-100'
                      }`}
                    >
                      <h4 className="font-bold text-sm truncate">{s.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">{s.topic}</p>
                        <span className="text-[10px] font-bold text-orange-600">{s.episodeCount || 0} Eps</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => deleteSeries(s.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {isCreatingSeries && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-orange-50 rounded-3xl border border-orange-200 space-y-4"
              >
                <h4 className="font-serif text-lg">New Series</h4>
                <div className="space-y-3">
                  <input 
                    type="text"
                    value={newSeriesTitle}
                    onChange={(e) => setNewSeriesTitle(e.target.value)}
                    placeholder="Series Title (e.g. Ramayana Deep Dive)"
                    className="w-full px-4 py-3 bg-white rounded-xl border-none text-sm"
                  />
                  <textarea 
                    value={newSeriesDesc}
                    onChange={(e) => setNewSeriesDesc(e.target.value)}
                    placeholder="Brief description or focus..."
                    className="w-full px-4 py-3 bg-white rounded-xl border-none text-sm h-20 resize-none"
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-1">Topic</label>
                    <select 
                      value={activeTopic}
                      onChange={(e) => setActiveTopic(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border-none text-sm"
                    >
                      {KATHA_TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  {activeTopic === 'custom' && (
                    <input 
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Custom Topic Name"
                      className="w-full px-4 py-3 bg-white rounded-xl border-none text-sm"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={createSeries}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                  >
                    Create
                  </button>
                  <button 
                    onClick={() => setIsCreatingSeries(false)}
                    className="px-4 py-3 bg-white text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest"
                  >
                    X
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {activeSeries && (
            <div className="bg-[#1a1a1a] text-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-xl">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl">Voice Settings</h3>
              </div>
              <div className="space-y-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      selectedVoice === voice.id 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Mic2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[10px] uppercase tracking-widest">{voice.label}</h4>
                      <p className="text-[9px] opacity-40">{voice.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Episode Generation & Display */}
        <div className={`lg:col-span-8 ${!activeSeries && 'hidden lg:block'}`}>
          <AnimatePresence mode="wait">
            {!activeSeries ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]"
              >
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm relative">
                  <Mic2 className="w-16 h-16 text-gray-200" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white animate-bounce">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-serif text-3xl opacity-40">Series Command Center</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto">
                    Create or select a series to begin generating full episodes for your public channel.
                  </p>
                </div>
                <button 
                  onClick={() => setIsCreatingSeries(true)}
                  className="px-8 py-3 bg-orange-600 text-white rounded-full text-sm font-medium hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                >
                  Start New Series
                </button>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-white rounded-[3rem] border border-[#1a1a1a]/5 shadow-sm flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
                  <BookOpen className="absolute inset-0 m-auto w-10 h-10 text-orange-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl">Scripting Episode {activeSeries.episodes.length + 1}...</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto italic">
                    &quot;Synthesizing wisdom, summaries, and monetization strategies.&quot;
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="series-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Series Header */}
                <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <button 
                        onClick={() => setActiveSeries(null)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-600 lg:hidden mb-4"
                      >
                        <ChevronRight className="w-3 h-3 rotate-180" />
                        Back to Series
                      </button>
                      <h3 className="font-serif text-3xl md:text-4xl">{activeSeries.title}</h3>
                      <p className="text-sm opacity-50">{activeSeries.description}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {activeSeries.topic}
                        </span>
                        <span className="text-[10px] opacity-40 uppercase tracking-widest">Started: {activeSeries.date}</span>
                      </div>
                    </div>
                    <button 
                      onClick={generateKatha}
                      className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 flex items-center gap-3"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate Episode {activeSeries.episodes.length + 1}
                    </button>
                  </div>
                </div>

                {/* Episode List */}
                <div className="space-y-6">
                  {activeSeries.episodes.length === 0 ? (
                    <div className="py-20 text-center opacity-20 border-2 border-dashed border-[#1a1a1a]/10 rounded-[3rem] bg-white">
                      <History className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-serif text-xl italic">No episodes generated for this series yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {activeSeries.episodes.slice().reverse().map((ep) => (
                        <div key={ep.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1a1a1a]/5 pb-6 gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-serif text-2xl font-bold shadow-lg">
                                {ep.episodeNumber}
                              </div>
                              <div>
                                <h4 className="font-serif text-2xl">{ep.title}</h4>
                                <p className="text-[10px] opacity-40 uppercase tracking-widest">{ep.date}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setActiveEpisodeId(ep.id);
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2"
                              >
                                <Play className="w-3 h-3" />
                                Studio Mode
                              </button>
                              <button 
                                onClick={() => downloadScript(ep.text, ep.title)}
                                className="p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all"
                                title="Download Script"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => shareEpisode(ep)}
                                className="p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all"
                                title="Share Episode"
                              >
                                <Share2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Thumbnail Preview */}
                            <div className="md:col-span-4">
                              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
                                {ep.thumbnailUrl ? (
                                  <Image 
                                    src={ep.thumbnailUrl} 
                                    alt={ep.title} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">No Thumbnail</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => downloadImage(ep.thumbnailUrl, ep.title)}
                                    className="p-3 bg-white rounded-full text-black shadow-xl hover:scale-110 transition-transform"
                                    title="Download Thumbnail"
                                  >
                                    <Download className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Metadata & Monetization */}
                            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-orange-600" />
                                  Public Summary
                                </h5>
                                <p className="text-xs opacity-70 italic leading-relaxed line-clamp-3">
                                  {ep.summary}
                                </p>
                              </div>
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  Monetization Tip
                                </h5>
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                  <p className="text-[10px] text-green-800 font-medium">
                                    {ep.revenueTip}
                                  </p>
                                </div>
                              </div>
                              <div className="md:col-span-2 space-y-4 pt-2">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                  <Share2 className="w-3 h-3 text-blue-600" />
                                  Promotion Kit
                                </h5>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => copyToClipboard(ep.socialKit.youtube, 'YouTube')}
                                      className="flex-1 p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                                      title="Copy YouTube Caption"
                                    >
                                      <Youtube className="w-4 h-4" />
                                      <span className="text-[9px] font-bold uppercase tracking-widest">YouTube</span>
                                    </button>
                                    <button 
                                      onClick={() => copyToClipboard(ep.socialKit.instagram, 'Instagram')}
                                      className="flex-1 p-3 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center gap-2 hover:bg-pink-600 hover:text-white transition-all"
                                      title="Copy Instagram Caption"
                                    >
                                      <Instagram className="w-4 h-4" />
                                      <span className="text-[9px] font-bold uppercase tracking-widest">Instagram</span>
                                    </button>
                                    <button 
                                      onClick={() => copyToClipboard(ep.socialKit.twitter, 'Twitter')}
                                      className="flex-1 p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                                      title="Copy Twitter Caption"
                                    >
                                      <Twitter className="w-4 h-4" />
                                      <span className="text-[9px] font-bold uppercase tracking-widest">Twitter</span>
                                    </button>
                                  </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Immersive Studio Modal */}
      <AnimatePresence>
        {activeEpisode && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] md:bg-black/95 md:backdrop-blur-xl flex items-center justify-center md:p-6"
          >
            <audio 
              ref={audioRef} 
              src={activeEpisode.audioUrl || ''} 
              onEnded={() => setIsPlaying(false)} 
            />
            <div className="w-full h-full md:h-[90vh] md:max-w-7xl bg-[#121212] md:rounded-[3rem] border-0 md:border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
              
              {/* Header - Sticky */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-[#1a1a1a] z-10 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <button 
                    onClick={() => setActiveEpisodeId(null)}
                    className="p-2 bg-white/5 text-white/40 hover:text-white rounded-xl transition-all md:hidden"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center font-serif text-lg md:text-xl font-bold shadow-lg">
                    {activeEpisode.episodeNumber}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg md:text-2xl text-white line-clamp-1">{activeEpisode.title}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{activeEpisode.topic}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                    <button 
                      onClick={() => navigateEpisode('prev')}
                      disabled={!activeSeries || activeSeries.episodes.findIndex(e => e.id === activeEpisode.id) === 0}
                      className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                      title="Previous Episode"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <button 
                      onClick={() => navigateEpisode('next')}
                      disabled={!activeSeries || activeSeries.episodes.findIndex(e => e.id === activeEpisode.id) === activeSeries.episodes.length - 1}
                      className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                      title="Next Episode"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="hidden md:flex items-center gap-2">
                    <button 
                      onClick={() => downloadAllAssets(activeEpisode)}
                      className="px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export All
                    </button>
                    <button 
                      onClick={() => copyToClipboard(activeEpisode.text, 'Script')}
                      className="p-2 md:p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      title="Copy Script"
                    >
                      {copiedLabel === 'Script' ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                  <button 
                    onClick={() => setActiveEpisodeId(null)}
                    className="p-2 md:p-3 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-all"
                    title="Close Studio"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* Left: Script */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-[#121212]">
                  <div className="prose prose-invert max-w-3xl mx-auto">
                    <div className="text-white/80 leading-relaxed font-serif text-lg md:text-2xl first-letter:text-5xl md:first-letter:text-7xl first-letter:font-bold first-letter:text-orange-600 first-letter:mr-4 first-letter:float-left">
                      <Markdown>{activeEpisode.text}</Markdown>
                    </div>
                  </div>
                </div>

                {/* Right: Studio Controls */}
                <div className="w-full lg:w-[400px] bg-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/10 p-6 md:p-8 overflow-y-auto custom-scrollbar shrink-0 space-y-8">
                  
                  {/* Studio Monitor */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Studio Monitor</h4>
                    <div className="aspect-video rounded-2xl overflow-hidden relative border border-white/10 bg-white/5 group">
                      {activeEpisode.thumbnailUrl ? (
                        <Image 
                          src={activeEpisode.thumbnailUrl} 
                          alt="Monitor" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-[10px] uppercase tracking-widest">No Visual</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
                          </div>
                          <button 
                            onClick={() => downloadImage(activeEpisode.thumbnailUrl, activeEpisode.title)}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
                            title="Download Thumbnail"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio Master */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Audio Master</p>
                      <Volume2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <button 
                      onClick={togglePlayback}
                      className="w-full py-4 bg-orange-600 text-white rounded-xl flex items-center justify-center gap-3 hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      <span className="font-bold text-sm uppercase tracking-widest">{isPlaying ? 'Pause' : 'Play Narration'}</span>
                    </button>
                  </div>

                  {/* Export Assets */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Export Assets</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => downloadAudio(activeEpisode.audioUrl, activeEpisode.title)}
                        className="p-4 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                      >
                        <Download className="w-5 h-5 text-orange-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Audio WAV</span>
                      </button>
                      <button 
                        onClick={() => downloadImage(activeEpisode.thumbnailUrl, activeEpisode.title)}
                        className="p-4 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                      >
                        <ImageIcon className="w-5 h-5 text-orange-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Thumbnail</span>
                      </button>
                      <button 
                        onClick={() => downloadScript(activeEpisode.text, activeEpisode.title)}
                        className="p-4 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                      >
                        <ScrollText className="w-5 h-5 text-orange-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Script MD</span>
                      </button>
                      <button 
                        onClick={() => copyToClipboard(activeEpisode.text, 'Script')}
                        className="p-4 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                      >
                        {copiedLabel === 'Script' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-orange-600" />}
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {copiedLabel === 'Script' ? 'Copied' : 'Copy Text'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">AI Mastered</p>
                        <p className="text-[9px] text-white/40">24kHz Audio • 4K Visuals</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="bg-[#1a1a1a] text-white rounded-[3rem] p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="font-serif text-4xl">The Future of Tradition</h3>
            <p className="text-lg opacity-70 leading-relaxed font-serif italic">
              &quot;AI Katha Vachak is not just a storyteller; it is a bridge between the timeless wisdom of our ancestors and the limitless potential of artificial intelligence.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Powered by Gemini TTS</p>
                <p className="text-[10px] opacity-40">24kHz High-Resolution Audio</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sanskrit Mantras', val: '10k+' },
              { label: 'Epic Verses', val: '100k+' },
              { label: 'Spiritual Lessons', val: '5k+' },
              { label: 'Global Seekers', val: '1M+' }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-orange-400">{stat.val}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
