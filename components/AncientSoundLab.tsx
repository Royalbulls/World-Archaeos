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
  Volume2, 
  Headphones,
  Wand2,
  History,
  Baby,
  ChevronRight,
  Loader2,
  Video,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { appDB } from '@/lib/db';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const VOICES = [
  { id: 'Puck', label: 'Puck (Energetic)', desc: 'Great for storytelling and upbeat narrations.' },
  { id: 'Charon', label: 'Charon (Deep)', desc: 'Perfect for ancient wisdom and serious history.' },
  { id: 'Kore', label: 'Kore (Calm)', desc: 'Ideal for lullabies and soothing chants.' },
  { id: 'Fenrir', label: 'Fenrir (Strong)', desc: 'Commanding voice for epic legacies.' },
  { id: 'Zephyr', label: 'Zephyr (Soft)', desc: 'Whisper-like quality for mystical content.' }
];

export default function AncientSoundLab() {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<{ id: string; text: string; audioUrl: string | null; audioBase64?: string | null; videoUrl: string | null; voice: string; date: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    const loadHistory = async () => {
      const saved = await appDB.get<any[]>('sound_store', 'archaeos_sound_history');
      let historyData: any[] = [];
      
      if (saved) {
        historyData = saved;
      } else {
        const legacy = localStorage.getItem('archaeos_sound_history');
        if (legacy) {
          try {
            historyData = JSON.parse(legacy);
            await appDB.set('sound_store', 'archaeos_sound_history', historyData);
          } catch (e) {
            console.error("Failed to parse sound history from legacy storage:", e);
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

  const saveToHistory = async (audio: string | null, video: string | null, base64?: string | null) => {
    const newEntry = {
      id: Date.now().toString(),
      text,
      audioUrl: audio,
      audioBase64: base64 || audioBase64,
      videoUrl: video,
      voice: selectedVoice,
      date: new Date().toLocaleString()
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      await appDB.set('sound_store', 'archaeos_sound_history', updated);
      try {
        localStorage.setItem('archaeos_sound_history', JSON.stringify(updated));
      } catch (e) {
        console.warn("LocalStorage quota exceeded for sound history");
      }
    } catch (e) {
      console.error("Failed to save sound history to IndexedDB", e);
    }
  };

  const checkApiKey = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      return false;
    }
    return true;
  };

  const generateVideo = async () => {
    if (!text) return;
    const hasKey = await checkApiKey();
    if (!hasKey) return;

    setIsVideoGenerating(true);
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A cinematic, mystical, and sacred visual representation of: ${text}. High quality, ancient aesthetic, spiritual atmosphere.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(downloadLink);
        saveToHistory(audioUrl, downloadLink);
      }
    } catch (error) {
      console.error("Video Generation Error:", error);
      alert("Failed to generate video. Please ensure you have a valid paid API key selected.");
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!text) return;
    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const { url, base64 } = pcmToWav(base64Audio);
        setAudioUrl(url);
        setAudioBase64(base64);
        saveToHistory(url, null, base64);
      }
    } catch (error) {
      console.error("Audio Generation Error:", error);
      alert("Failed to generate audio. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">
          <Music className="w-4 h-4" />
          Vedic Sound & Chant Lab
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <h2 className="font-serif text-5xl">Ancient Audio Reconstructor</h2>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-gray-400 hover:text-indigo-600"
            title="View History"
          >
            <History className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg">
          Generate sacred chants, legacy narrations, and ancient lullabies for your child using AI-powered vocal synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-[#1a1a1a]/5 shadow-xl space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Script / Mantra / Story</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter a mantra, a story for your child, or an ancient chant..."
                className="w-full h-40 p-6 bg-gray-50 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-serif text-lg resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setText("Om Shanti Shanti Shanti. May your life be filled with eternal peace and wisdom.")}
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  Peace Mantra
                </button>
                <button 
                  onClick={() => setText("Once upon a time, in the ancient valley of the Indus, a great legacy was born...")}
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  Legacy Story
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Select Divine Voice</label>
              <div className="grid grid-cols-1 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                      selectedVoice === voice.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                        : 'bg-gray-50 border-transparent hover:bg-white hover:border-indigo-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedVoice === voice.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm">{voice.label}</h4>
                      <p className={`text-[10px] ${selectedVoice === voice.id ? 'opacity-60' : 'opacity-40'}`}>
                        {voice.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={!text || isGenerating}
              onClick={generateAudio}
              className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synthesizing Sound...
                </>
              ) : (
                <>
                  Generate Sacred Audio <Wand2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Player Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-white rounded-[4rem] p-12 border border-[#1a1a1a]/5 shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-3xl">Sound History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Back to Player</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                      <History className="w-16 h-16 mb-4" />
                      <p>No history yet.</p>
                    </div>
                  ) : (
                    history.map(entry => (
                      <div key={entry.id} className="p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all space-y-4 group">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{entry.date} • Voice: {entry.voice}</p>
                            <p className="text-sm font-serif line-clamp-2 italic">&quot;{entry.text}&quot;</p>
                          </div>
                          <div className="flex gap-2">
                            {entry.audioUrl && (
                              <button 
                                onClick={() => {
                                  setText(entry.text);
                                  setSelectedVoice(entry.voice);
                                  setAudioUrl(entry.audioUrl);
                                  setVideoUrl(entry.videoUrl);
                                  setShowHistory(false);
                                }}
                                className="p-2 bg-white rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={async () => {
                                const updated = history.filter(h => h.id !== entry.id);
                                setHistory(updated);
                                try {
                                  await appDB.set('sound_store', 'archaeos_sound_history', updated);
                                  try {
                                    localStorage.setItem('archaeos_sound_history', JSON.stringify(updated));
                                  } catch (e) {}
                                } catch (e) {}
                              }}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : audioUrl ? (
              <motion.div 
                key="player"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full bg-white rounded-[4rem] p-12 border border-[#1a1a1a]/5 shadow-2xl flex flex-col items-center justify-center space-y-12 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                
                {/* Visualizer Mockup */}
                <div className="flex items-end gap-1 h-32">
                  {[...Array(20)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: isPlaying ? [20, 80, 40, 100, 20] : 20 }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                      className="w-2 bg-indigo-600 rounded-full"
                    />
                  ))}
                </div>

                <div className="text-center space-y-2">
                  <h3 className="font-serif text-3xl">Legacy Audio Generated</h3>
                  <p className="text-sm opacity-40 uppercase tracking-widest">Voice: {selectedVoice} • Format: High-Res WAV</p>
                </div>

                <div className="flex items-center gap-8">
                  <button 
                    onClick={togglePlay}
                    className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all"
                  >
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
                  </button>
                  <div className="flex flex-col gap-4">
                    <a 
                      href={audioUrl} 
                      download={`archaeos-legacy-${Date.now()}.wav`}
                      className="w-16 h-16 bg-gray-100 text-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm"
                      title="Download Audio (WAV)"
                    >
                      <Download className="w-6 h-6" />
                    </a>
                    <button 
                      onClick={generateVideo}
                      disabled={isVideoGenerating}
                      className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-all shadow-sm disabled:opacity-50 group relative"
                      title="Convert to Visual Video"
                    >
                      {isVideoGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Video className="w-6 h-6" />}
                      <span className="absolute left-full ml-4 px-3 py-1 bg-[#1a1a1a] text-white text-[8px] font-bold uppercase tracking-widest rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Generate Video Format
                      </span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {videoUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full space-y-4 pt-8 border-t border-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Visual Mantra Generated</h4>
                        <a 
                          href={videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1 hover:underline"
                        >
                          Download Video <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
                        <video 
                          src={videoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="w-full pt-12 border-t border-gray-50 grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sample Rate</p>
                    <p className="text-sm font-bold">24,000 Hz</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Bit Depth</p>
                    <p className="text-sm font-bold">16-bit PCM</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8"
              >
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm">
                  <Headphones className="w-16 h-16 text-gray-200" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl opacity-40">Sound of the Ancients</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Enter a script on the left to generate high-quality audio narrations, chants, or lullabies for your child&apos;s digital legacy.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <Mic2 className="w-3 h-3" />
                    Studio Quality
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <Sparkles className="w-3 h-3" />
                    AI Synthesis
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legacy Audio Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: 'Digital Lullabies', 
            desc: 'Create personalized soothing chants with your child&apos;s name to help them sleep.',
            icon: Baby,
            color: 'bg-pink-50 text-pink-600'
          },
          { 
            title: 'Legacy Narrations', 
            desc: 'Narrate the story of your family history to be preserved for generations.',
            icon: History,
            color: 'bg-amber-50 text-amber-600'
          },
          { 
            title: 'Mantra Chanting', 
            desc: 'Generate perfect Vedic pronunciations of mantras for spiritual growth.',
            icon: Sparkles,
            color: 'bg-emerald-50 text-emerald-600'
          }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-[#1a1a1a]/5 shadow-sm space-y-4 hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-all`}>
              <item.icon className="w-7 h-7" />
            </div>
            <h4 className="font-serif text-2xl">{item.title}</h4>
            <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">{item.desc}</p>
            <button className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2 pt-2">
              Try This Mode <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
