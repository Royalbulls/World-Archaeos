'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Mic2, 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Loader2, 
  Volume2,
  ScrollText,
  Baby,
  Wind,
  Moon,
  Sun,
  Flame,
  Star,
  History,
  Trash2
} from 'lucide-react';
import { getGeminiClient, withRetry, Type } from '@/lib/gemini';
import { Modality } from "@google/genai";
import { appDB } from '@/lib/db';
import Markdown from 'react-markdown';

interface ReconstructedAudio {
  id: string;
  type: 'chant' | 'narration' | 'lullaby';
  title: string;
  text: string;
  audioUrl: string | null;
  audioBase64?: string | null;
  date: string;
}

const VOICES = [
  { id: 'Kore', label: 'Celestial Mother', desc: 'Soft, nurturing, and ethereal.' },
  { id: 'Charon', label: 'Ancient Sage', desc: 'Deep, resonant, and authoritative.' },
  { id: 'Zephyr', label: 'Mystic Breeze', desc: 'Light, airy, and calming.' },
  { id: 'Fenrir', label: 'Guardian Spirit', desc: 'Strong, protective, and warm.' }
];

export default function Reconstructor({ globalLanguage, profile }: { globalLanguage: string, profile: any }) {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ReconstructedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<ReconstructedAudio[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const saved = await appDB.get<ReconstructedAudio[]>('reconstructor_store', 'archaeos_reconstructor_history');
      let historyData: ReconstructedAudio[] = [];
      
      if (saved) {
        historyData = saved;
      } else {
        const legacy = localStorage.getItem('archaeos_reconstructor_history');
        if (legacy) {
          try {
            historyData = JSON.parse(legacy);
            await appDB.set('reconstructor_store', 'archaeos_reconstructor_history', historyData);
          } catch (e) {
            console.error("Failed to parse reconstructor history from legacy storage:", e);
          }
        }
      }

      if (historyData.length > 0) {
        // Recreate Blob URLs for history items
        const withBlobs = historyData.map((item: any) => {
          if (item.audioBase64) {
            try {
              const pcmData = Uint8Array.from(atob(item.audioBase64), c => c.charCodeAt(0));
              const blob = new Blob([pcmData], { type: 'audio/wav' });
              return { ...item, audioUrl: URL.createObjectURL(blob) };
            } catch (e) {
              console.error("Failed to recreate blob for history item:", e);
            }
          }
          return item;
        });
        setHistory(withBlobs);
      }
    };
    loadHistory();
  }, []);

  const pcmToWav = (base64Pcm: string): { url: string; base64: string } => {
    const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmData.length, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmData.length, true);
    
    const wavData = new Uint8Array(header.byteLength + pcmData.byteLength);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, header.byteLength);
    
    const binary = Array.from(wavData).map(b => String.fromCharCode(b)).join('');
    const base64 = btoa(binary);
    
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return { url: URL.createObjectURL(blob), base64 };
  };

  const generateReconstruction = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    setResult(null);
    setIsPlaying(false);

    try {
      const ai = getGeminiClient();
      
      // 1. Generate Content and Type
      const contentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this request: "${userInput}", reconstruct a sacred chant, legacy narration, or ancient lullaby.
        
        Context:
        - User Profile: ${JSON.stringify(profile)}
        - Language: ${globalLanguage}
        
        Determine the most appropriate type (chant, narration, lullaby).
        Generate a title and the full text/lyrics.
        The style should be ancient, soulful, and deeply resonant.
        
        Format as JSON.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["chant", "narration", "lullaby"] },
              title: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["type", "title", "text"]
          },
          systemInstruction: "You are the Reconstructor, an AI specialized in reviving ancient vocal traditions. You create sacred chants, legacy stories, and soothing lullabies that bridge the gap between generations."
        }
      }));

      let data: any = {};
      try {
        data = JSON.parse(contentResponse.text || '{}');
      } catch (e) {
        const match = (contentResponse.text || '').match(/\{[\s\S]*\}/);
        if (match) data = JSON.parse(match[0]);
        else throw e;
      }
      
      // 2. Generate TTS Audio
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
      let audioUrl = null;
      let audioBase64 = null;
      if (base64Audio) {
        const res = pcmToWav(base64Audio);
        audioUrl = res.url;
        audioBase64 = res.base64;
      }

      const newResult: ReconstructedAudio = {
        id: Date.now().toString(),
        type: data.type,
        title: data.title,
        text: data.text,
        audioUrl,
        audioBase64,
        date: new Date().toLocaleString()
      };

      setResult(newResult);
      const updatedHistory = [newResult, ...history].slice(0, 20);
      setHistory(updatedHistory);
      try {
        await appDB.set('reconstructor_store', 'archaeos_reconstructor_history', updatedHistory);
        try {
          localStorage.setItem('archaeos_reconstructor_history', JSON.stringify(updatedHistory));
        } catch (e) {
          console.warn("LocalStorage quota exceeded for reconstructor history");
        }
      } catch (e) {
        console.error("Failed to save reconstructor history to IndexedDB", e);
      }

    } catch (error) {
      console.error("Reconstruction Error:", error);
      alert("The vocal forge is cooling down. Please try again in a moment.");
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

  const deleteHistoryItem = async (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    try {
      await appDB.set('reconstructor_store', 'archaeos_reconstructor_history', updated);
      try {
        localStorage.setItem('archaeos_reconstructor_history', JSON.stringify(updated));
      } catch (e) {}
    } catch (e) {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Immersive Header */}
      <div className="relative h-[400px] rounded-[3.5rem] overflow-hidden flex flex-col items-center justify-center text-center p-12 bg-black">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#3a1510_0%,transparent_60%),radial-gradient(circle_at_10%_80%,#ff4e00_0%,transparent_50%)] blur-[60px]" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400"
          >
            <Wind className="w-4 h-4" />
            Vocal Synthesis Forge
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-7xl text-white tracking-tighter"
          >
            Reconstructor
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-xl mx-auto text-lg font-serif italic"
          >
            &quot;Reviving the sacred echoes of the past. Chants, narrations, and lullabies forged from the digital Akasha.&quot;
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-xl space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-2">What do you need to revive?</label>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., A protective chant for my newborn daughter, or a legacy story about our ancestors' journey..."
                className="w-full h-40 p-6 bg-gray-50 rounded-3xl border-none focus:ring-2 focus:ring-orange-500 text-sm resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-2">Select Vocal Essence</label>
              <div className="grid grid-cols-1 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      selectedVoice === voice.id 
                        ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-lg' 
                        : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedVoice === voice.id ? 'bg-white/10' : 'bg-white'}`}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{voice.label}</h4>
                      <p className={`text-[9px] ${selectedVoice === voice.id ? 'opacity-60' : 'opacity-40'}`}>{voice.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={generateReconstruction}
              disabled={isGenerating || !userInput.trim()}
              className="w-full py-5 bg-orange-600 text-white rounded-3xl font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Forging Echoes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Reconstruct
                </>
              )}
            </button>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-6 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Echoes
            </h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs opacity-30 italic text-center py-8">The archives are empty.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group">
                    <button 
                      onClick={() => setResult(item)}
                      className="flex-grow text-left"
                    >
                      <h4 className="text-xs font-bold truncate">{item.title}</h4>
                      <p className="text-[9px] opacity-40 uppercase tracking-widest">{item.type}</p>
                    </button>
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-white rounded-[3rem] border border-[#1a1a1a]/5 shadow-sm flex flex-col items-center justify-center p-12 text-center space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
                  <Mic2 className="absolute inset-0 m-auto w-10 h-10 text-orange-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl">Synthesizing Ancient Frequencies</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto italic">
                    &quot;The AI is weaving the threads of memory and sound into a new reality.&quot;
                  </p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#fdfbf7] rounded-[3rem] p-12 border border-orange-100 shadow-2xl space-y-10 relative overflow-hidden"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-orange-100">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-orange-600 text-white rounded-3xl flex items-center justify-center shadow-lg">
                      {result.type === 'lullaby' ? <Moon className="w-10 h-10" /> : 
                       result.type === 'chant' ? <Flame className="w-10 h-10" /> : 
                       <ScrollText className="w-10 h-10" />}
                    </div>
                    <div>
                      <h3 className="font-serif text-4xl">{result.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {result.type}
                        </span>
                        <span className="text-[10px] opacity-40 uppercase tracking-widest">{result.date}</span>
                      </div>
                    </div>
                  </div>

                  {result.audioUrl && (
                    <div className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-orange-100">
                      <button 
                        onClick={togglePlayback}
                        className="w-16 h-16 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-700 transition-all shadow-md"
                      >
                        {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                      </button>
                      <div className="pr-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Play Reconstruction</p>
                        <p className="text-[10px] opacity-40 italic">Vocal: {selectedVoice}</p>
                      </div>
                      <audio 
                        ref={audioRef} 
                        src={result.audioUrl} 
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="relative z-10 prose prose-orange max-w-none">
                  <div className="whitespace-pre-wrap text-[#1a1a1a]/80 leading-relaxed font-serif text-2xl first-letter:text-6xl first-letter:font-bold first-letter:text-orange-600 first-letter:mr-4 first-letter:float-left">
                    <Markdown>{result.text}</Markdown>
                  </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-orange-100 flex flex-wrap gap-4">
                  <button className="px-8 py-4 bg-white border border-orange-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center gap-2 text-orange-700">
                    <Download className="w-4 h-4" />
                    Download Audio
                  </button>
                  <button className="px-8 py-4 bg-white border border-orange-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center gap-2 text-orange-700">
                    <Star className="w-4 h-4" />
                    Save to Legacy
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm relative">
                  <Music className="w-16 h-16 text-gray-200" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white animate-bounce">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-serif text-3xl opacity-40">Awaiting the Spark</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Describe a need, a memory, or a prayer. The Reconstructor will synthesize a unique vocal artifact for your child.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { icon: Baby, label: 'Lullabies' },
                    { icon: Flame, label: 'Sacred Chants' },
                    { icon: ScrollText, label: 'Legacy Stories' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
