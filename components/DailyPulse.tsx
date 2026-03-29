'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Sparkles, 
  Volume2, 
  Clock, 
  Eye, 
  Ear, 
  History,
  RefreshCw,
  MessageSquare,
  Instagram,
  Youtube,
  Twitter,
  Copy,
  Check,
  TrendingUp,
  Video
} from 'lucide-react';
import { getGeminiClient, withRetry, Type } from '@/lib/gemini';
import { getBase64Image } from '@/lib/utils';
import { Modality } from "@google/genai";
import Markdown from 'react-markdown';
import Image from 'next/image';
import { appDB } from '@/lib/db';
import { UserProfileData } from './UserProfile';

interface DailyInsight {
  id: string;
  title: string;
  thought: string;
  whatIsForgotten: string;
  hiddenTruth: string;
  hashtags: string[];
  viralHook: string;
  viralTips: string[];
  visualPrompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  audioBase64?: string | null;
  date: string;
}

export default function DailyPulse({ globalLanguage, profile, logActivity }: { globalLanguage: string, profile: UserProfileData, logActivity?: (action: string, tool: string) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [mode, setMode] = useState<'general' | 'finance' | 'business' | 'family' | 'psychology'>('general');
  const [duration, setDuration] = useState<30 | 60 | 90>(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const saveInsightToStorage = async (data: DailyInsight) => {
    const key = 'archaeos_daily_pulse';
    try {
      // Using IndexedDB to avoid localStorage quota issues
      await appDB.set('pulse_store', key, data);
    } catch (e) {
      console.error("IndexedDB Storage Error:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const saved = await appDB.get<DailyInsight>('pulse_store', 'archaeos_daily_pulse');
      if (saved) {
        // Only load if it's from today
        if (saved.date === new Date().toLocaleDateString()) {
          // Recreate Blob URL if audioBase64 exists
          if (saved.audioBase64) {
            try {
              const pcmData = Uint8Array.from(atob(saved.audioBase64), c => c.charCodeAt(0));
              const blob = new Blob([pcmData], { type: 'audio/wav' });
              saved.audioUrl = URL.createObjectURL(blob);
            } catch (e) {
              console.error("Failed to recreate audio blob:", e);
            }
          }
          setInsight(saved);
        }
      } else {
        // Fallback to localStorage for legacy data migration
        const legacy = localStorage.getItem('archaeos_daily_pulse');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (parsed.date === new Date().toLocaleDateString()) {
              setInsight(parsed);
              await appDB.set('pulse_store', 'archaeos_daily_pulse', parsed);
            }
          } catch (e) {
            console.error("Legacy migration error:", e);
          }
        }
      }
    };
    loadData();
  }, []);

  const generatePulse = async () => {
    setIsGenerating(true);
    setInsight(null);
    setIsPlaying(false);

    try {
      const ai = getGeminiClient();
      
      const topicContext = customTopic.trim() ? `Topic: ${customTopic}` : "Topic: System's discretion (Ancient Wisdom meets Quantum Science)";
      let modeContext = "Category: General Awakening";
      if (mode === 'finance') modeContext = "Category: Finance & Abundance (Wealth as Energy Flow)";
      if (mode === 'business') modeContext = "Category: Business & Leadership (Ancient Strategies for Modern Empires)";
      if (mode === 'family') modeContext = "Category: Family Values & Relationships (Generational Wisdom & Unity)";
      if (mode === 'psychology') modeContext = "Category: Understanding Human Nature (Insan ko samjhe - Deep Psychology & Mind Mastery)";

      // 1. Generate Text Content
      const textResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a ${duration}-second "Thought of the Day" for World Archaeos, established as a premium "Historical Intelligence" brand.
        ${topicContext}
        ${modeContext}
        
        Perspective: World Archaeos (Ancient Wisdom + Quantum Science). 
        Tone: Authoritative, Suspenseful, Premium.
        
        Requirements:
        1. **Title**: A provocative 3-4 word title.
        2. **Thought**: A powerful ${duration}-second speech (approx ${duration * 3} words). 
           - START with a question that peaks curiosity.
           - END with the signature CTA: "Ancient secrets are the blueprints for our future. Join World Archaeos to decode the timeline."
        3. **What is Forgotten**: A single sentence about a lost truth humanity has forgotten.
        4. **Hidden Truth**: A single sentence about something happening right now that people can't see or hear.
        5. **Viral Hook**: A 3-second psychological hook to start a YouTube Short (must be high-retention).
        6. **SEO Hashtags**: A list of 10 highly relevant and trending hashtags for YouTube/Instagram.
        7. **Viral Tips**: 3 quick tips on how to edit or present this specific content to make it go viral (mention using suspenseful background music).
        8. **Visual Prompt**: A detailed prompt for an AI image generator (High-definition animated style, cinematic, mystical, high-contrast). 
           CRITICAL: The prompt MUST include instructions to have the branding "WORLD ARCHAEOS" written in a bold, glowing, futuristic font at the bottom or center of the image. The image should feel like a high-end brand asset.

        Language: ${globalLanguage}.
        Format as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              thought: { type: Type.STRING },
              whatIsForgotten: { type: Type.STRING },
              hiddenTruth: { type: Type.STRING },
              viralHook: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              viralTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualPrompt: { type: Type.STRING }
            },
            required: ["title", "thought", "whatIsForgotten", "hiddenTruth", "viralHook", "hashtags", "viralTips", "visualPrompt"]
          },
          systemInstruction: "You are the Voice of World Archaeos, a premium Historical Intelligence brand. You are ancient yet futuristic. Your tone is authoritative, suspenseful, and awakening. You speak to the soul of humanity, bridging the gap between ancient Vedic knowledge and modern Quantum Physics. Every piece of content must feel like a high-end intelligence report from the timeline of history."
        }
      }));

      if (!textResponse.text) throw new Error("No response from AI");
      let data: any = {};
      try {
        data = JSON.parse(textResponse.text);
      } catch (e) {
        const match = textResponse.text.match(/\{[\s\S]*\}/);
        if (match) data = JSON.parse(match[0]);
        else throw e;
      }

      // 2. Generate Visual
      let imageUrl = null;
      try {
        const basePrompt = `Create a cinematic, mystical image based on this prompt: ${data.visualPrompt}. The image should feel like a high-end brand asset for World Archaeos.`;
        const imageParts: any[] = [];
        
        if (profile?.profilePhoto) {
          const base64Data = await getBase64Image(profile.profilePhoto);
          if (base64Data) {
            imageParts.push({
              text: `${basePrompt} The main character in the image MUST look exactly like the person in the provided reference photo, but dressed and styled according to the theme of the prompt. Transform the person into the hero of this scene.`
            });
            imageParts.push({
              inlineData: {
                mimeType: base64Data.mimeType,
                data: base64Data.data
              }
            });
          } else {
            imageParts.push({ text: basePrompt });
          }
        } else {
          imageParts.push({ text: basePrompt });
        }

        const imageResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: imageParts,
          },
          config: {
            imageConfig: { aspectRatio: "9:16" } 
          }
        }));
        
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (e) {
        imageUrl = `https://picsum.photos/seed/${Date.now()}/1080/1920`;
      }

      // 3. Generate Audio
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Listen carefully. ${data.thought}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' }, // Deep & Wise
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      let audioUrl = null;
      let audioBase64ForStorage = null;
      if (base64Audio) {
        const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        view.setUint32(0, 0x52494646, false);
        view.setUint32(4, 36 + pcmData.length, true);
        view.setUint32(8, 0x57415645, false);
        view.setUint32(12, 0x666d7420, false);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 24000, true);
        view.setUint32(28, 48000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false);
        view.setUint32(40, pcmData.length, true);
        const wavData = new Uint8Array(wavHeader.byteLength + pcmData.byteLength);
        wavData.set(new Uint8Array(wavHeader), 0);
        wavData.set(pcmData, wavHeader.byteLength);
        
        // Store the full WAV data as base64 for persistence
        const binary = Array.from(wavData).map(b => String.fromCharCode(b)).join('');
        audioBase64ForStorage = btoa(binary);
        
        const blob = new Blob([wavData], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      }

      const newInsight: DailyInsight = {
        id: Date.now().toString(),
        ...data,
        imageUrl,
        audioUrl,
        audioBase64: audioBase64ForStorage,
        date: new Date().toLocaleDateString()
      };

      setInsight(newInsight);
      await saveInsightToStorage(newInsight);
      
      if (logActivity) {
        logActivity(`Generated Daily Pulse: ${data.title}`, 'Daily Pulse');
      }

    } catch (error) {
      console.error("Pulse Generation Error:", error);
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

  const downloadAudio = () => {
    if (!insight?.audioUrl) return;
    const link = document.createElement('a');
    link.href = insight.audioUrl;
    link.download = `archaeos_pulse_${insight.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = async () => {
    if (!insight?.imageUrl) return;
    try {
      const response = await fetch(insight.imageUrl);
      const blob = await response.blob();
      
      // Create a canvas to convert to JPG and potentially add branding overlay if needed, 
      // but for now just ensuring it's a downloadable JPG.
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((jpgBlob) => {
            if (jpgBlob) {
              const url = window.URL.createObjectURL(jpgBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `WorldArchaeos_Pulse_${insight.id}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }
          }, 'image/jpeg', 0.9);
        }
      };
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const downloadVideo = async () => {
    if (!insight?.audioUrl || !insight?.imageUrl) return;
    setIsExporting(true);

    try {
      // 1. Load Image
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = insight.imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 2. Setup Canvas (2K Resolution for better quality)
      const canvas = document.createElement('canvas');
      canvas.width = 1440;
      canvas.height = 2560;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No canvas context");

      // 3. Setup Audio
      const audio = new Audio(insight.audioUrl);
      audio.crossOrigin = "anonymous";
      
      // 4. Create Streams
      const canvasStream = canvas.captureStream(30);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      // Do not connect to audioCtx.destination so it exports silently in the background
      
      const audioStream = dest.stream;

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = 'video/mp4';
          }
        }
      }

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps for high quality
      });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `WorldArchaeos_Pulse_${insight.id}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      let animationId: number;
      let startTime = performance.now();
      
      const drawFrame = (now: number) => {
        const elapsed = now - startTime;
        // Subtle zoom effect
        const scale = 1 + (elapsed / 30000) * 0.1; // 10% zoom over 30 seconds
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, canvas.height - 600, canvas.width, 600);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px serif';
        ctx.textAlign = 'center';
        
        // Word wrap title
        const words = insight.title.split(' ');
        let line = '';
        let y = canvas.height - 350;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 150 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 90;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '40px sans-serif';
        ctx.fillText("WORLD ARCHAEOS", canvas.width / 2, canvas.height - 150);

        animationId = requestAnimationFrame(drawFrame);
      };

      recorder.start();
      startTime = performance.now();
      drawFrame(startTime);
      
      await audio.play();

      audio.onended = () => {
        cancelAnimationFrame(animationId);
        recorder.stop();
      };

    } catch (err) {
      console.error("Video export failed:", err);
      alert("Failed to export video. Please try downloading audio and image separately.");
      setIsExporting(false);
    }
  };

  const copyHashtags = () => {
    if (!insight) return;
    navigator.clipboard.writeText(insight.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const copyText = () => {
    if (!insight) return;
    const textToCopy = `World Archaeos Daily Pulse: ${insight.title}\n\n"${insight.thought}"\n\nForgotten Truth: ${insight.whatIsForgotten}\nHidden Reality: ${insight.hiddenTruth}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const copyTitle = () => {
    if (!insight) return;
    navigator.clipboard.writeText(insight.title);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const downloadShortsKit = async () => {
    if (!insight) return;
    downloadAudio();
    await new Promise(r => setTimeout(r, 500)); // Small delay to prevent browser blocking multiple downloads
    downloadImage();
  };

  const shareContent = async () => {
    if (!insight) return;
    const textToShare = `World Archaeos Daily Pulse: ${insight.title}\n\n"${insight.thought}"`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: insight.title,
          text: textToShare,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyText();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">
          <Zap className="w-4 h-4 animate-pulse" />
          Archaeos Daily Pulse
        </div>
        <h2 className="font-serif text-5xl">{duration}-Second Awakening</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg italic">
          &quot;What is the world forgetting? What is hidden from your eyes? Discover the daily pulse of World Archaeos.&quot;
        </p>
      </div>

      {/* Controls: Topic & Mode */}
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-2 p-1 bg-gray-100 rounded-2xl">
            <button 
              onClick={() => setMode('general')}
              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              General
            </button>
            <button 
              onClick={() => setMode('finance')}
              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'finance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Finance
            </button>
            <button 
              onClick={() => setMode('business')}
              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'business' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Business
            </button>
            <button 
              onClick={() => setMode('family')}
              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'family' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Family
            </button>
            <button 
              onClick={() => setMode('psychology')}
              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'psychology' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Psychology
            </button>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl shrink-0">
            {[30, 60, 90].map((d) => (
              <button 
                key={d}
                onClick={() => setDuration(d as 30|60|90)}
                className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${duration === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input 
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter a custom topic (e.g., Quantum Love, Ancient Gold...)"
            className="w-full py-4 px-6 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
            Optional
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Interactive Content */}
        <div className="lg:col-span-7 space-y-8">
          <AnimatePresence mode="wait">
            {!insight && !isGenerating ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] p-12 border border-black/5 shadow-sm text-center space-y-8"
              >
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif">Ready for Today&apos;s Insight?</h3>
                  <p className="text-gray-500">Generate a 30-second thought that will challenge your perception of the world.</p>
                </div>
                <button 
                  onClick={generatePulse}
                  className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Daily Pulse
                </button>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[3rem] p-20 border border-black/5 shadow-sm text-center space-y-8"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif">Connecting to the Akashic Grid...</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Retrieving lost information</p>
                </div>
              </motion.div>
            ) : insight && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-serif text-indigo-600">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyTitle}
                        className="p-2 bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg transition-all"
                        title="Copy Title"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
                        <Clock className="w-3 h-3" />
                        {duration}s Episode
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                      <Zap className="w-4 h-4" />
                      Viral Hook (First 3 Seconds)
                    </div>
                    <p className="text-lg font-bold text-indigo-900 italic">
                      &quot;{insight.viralHook}&quot;
                    </p>
                    <div className="h-px bg-indigo-100 w-full" />
                    <p className="text-xl font-serif leading-relaxed italic text-indigo-900/80">
                      &quot;{insight.thought}&quot;
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                        <History className="w-4 h-4" />
                        What is Forgotten
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{insight.whatIsForgotten}</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                        <Eye className="w-4 h-4" />
                        The Hidden Truth
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{insight.hiddenTruth}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={togglePlayback}
                      className="flex-1 py-5 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      {isPlaying ? 'Pause Narration' : 'Listen to Pulse'}
                    </button>
                    <button 
                      onClick={generatePulse}
                      className="p-5 bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={shareContent}
                    className="flex-1 p-4 bg-white rounded-2xl border border-black/5 shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Share</span>
                  </button>
                  <button 
                    onClick={copyText}
                    className="flex-1 p-4 bg-white rounded-2xl border border-black/5 shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{copiedText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button 
                    onClick={downloadAudio}
                    disabled={!insight.audioUrl}
                    className="flex-1 p-4 bg-white rounded-2xl border border-black/5 shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Audio</span>
                  </button>
                </div>

                {/* Viral Growth Section */}
                <div className="bg-gradient-to-br from-indigo-900 to-black text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h4 className="font-serif text-xl">Viral Growth Kit</h4>
                    </div>
                    <button 
                      onClick={copyHashtags}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                    >
                      {copiedHashtags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{copiedHashtags ? 'Copied' : 'Copy SEO Tags'}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">SEO Optimized Hashtags</label>
                      <div className="flex flex-wrap gap-2">
                        {insight.hashtags?.map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-indigo-300 border border-white/5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Viral Presentation Tips</label>
                      <div className="space-y-2">
                        {insight.viralTips?.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-white/80">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Visual & Social */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#1a1a1a] rounded-[3rem] p-8 shadow-2xl space-y-8 sticky top-24">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Visual Manifestation</h4>
                {insight?.imageUrl && (
                  <a 
                    href={insight.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View Full Artwork
                  </a>
                )}
              </div>
              <p className="text-xs text-white/60 italic">Optimized for 9:16 Vertical Content</p>
            </div>

            <div className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group">
              {insight?.imageUrl ? (
                <Image 
                  src={insight.imageUrl} 
                  alt="Daily Pulse Visual" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                  <Sparkles className="w-12 h-12 mb-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Visual Pending</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">World Archaeos Pulse</span>
                  </div>
                  {insight?.imageUrl && (
                    <button 
                      onClick={downloadImage}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all text-white"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {insight && <h5 className="text-2xl font-serif text-white">{insight.title}</h5>}
              </div>
            </div>

              <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quick Export</h4>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={downloadVideo}
                  disabled={isExporting}
                  className="w-full p-4 bg-indigo-600 text-white rounded-2xl border border-indigo-500 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {isExporting ? 'Exporting Video...' : 'Download as Video (MP4/WebM)'}
                  </span>
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={downloadVideo}
                    disabled={isExporting}
                    className="p-4 bg-white/5 text-white rounded-2xl border border-white/10 hover:bg-rose-600 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                    <Youtube className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Shorts</span>
                  </button>
                  <button 
                    onClick={downloadVideo}
                    disabled={isExporting}
                    className="p-4 bg-white/5 text-white rounded-2xl border border-white/10 hover:bg-pink-600 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Reels</span>
                  </button>
                  <button 
                    onClick={copyText}
                    className="p-4 bg-white/5 text-white rounded-2xl border border-white/10 hover:bg-blue-600 transition-all flex flex-col items-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      {insight?.audioUrl && (
        <audio 
          ref={audioRef} 
          src={insight.audioUrl} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
