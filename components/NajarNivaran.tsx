'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Eye, 
  Zap, 
  Sparkles, 
  Loader2, 
  Flame, 
  Wind, 
  Droplets, 
  Sun, 
  Moon, 
  History, 
  Trash2, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Heart,
  Crosshair,
  Wifi,
  Lock,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import { Modality } from "@google/genai";
import { UserProfileData } from './UserProfile';

interface NajarRitual {
  id: string;
  type: string;
  method: string;
  description: string;
  mantra: string;
  visuals: string;
  date: string;
}

export default function NajarNivaran({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ritual, setRitual] = useState<NajarRitual | null>(null);
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [history, setHistory] = useState<NajarRitual[]>([]);

  const pcmToWav = (base64Pcm: string): string => {
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
    
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    const toggleCamera = async () => {
      try {
        if (useCamera) {
          await startCamera();
        } else {
          stopCamera();
        }
      } catch (e) {
        console.error("Camera toggle error:", e);
      }
    };
    toggleCamera();
    return () => stopCamera();
  }, [useCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setUseCamera(false);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        return canvasRef.current.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setUseCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    let imageToAnalyze = capturedImage;
    if (useCamera) {
      imageToAnalyze = captureFrame();
      setCapturedImage(imageToAnalyze);
    }

    setIsScanning(true);
    setScanProgress(0);
    setRitual(null);
    setIsRitualActive(false);
    setAudioBase64(null);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    try {
      const ai = getGeminiModel();
      
      const parts: any[] = [
        { text: `Perform a global "Najar Dosh" (Evil Eye) diagnosis and provide a personalized removal ritual.
      
      User Context:
      - Name: ${profile.name}
      - Profession: ${profile.profession}
      - Current State: Feeling heavy, drained, or blocked.
      
      The AI must act as the "World's First Universal Najar Nivaran System", combining:
      1. Vedic (Lemon, Chili, Salt, Mustard seeds)
      2. Mediterranean (Mati/Nazar Boncuğu)
      3. Middle Eastern (Hamsa/Khamsa)
      4. Latin American (Ojo de Venado)
      5. Modern Energy Healing (Frequency & Intent)

      Response Format (JSON):
      {
        "type": "The specific type of negative energy detected (e.g., Professional Envy, Karmic Block, Social Media Najar)",
        "method": "The primary cultural method used for removal",
        "description": "A detailed explanation of the ritual being performed digitally",
        "mantra": "A powerful protective chant or affirmation",
        "visuals": "Description of the visual frequencies being projected"
      }

      Language: ${globalLanguage === 'hi-sa' ? 'Hindi-Sanskrit mix' : globalLanguage === 'hi' ? 'Hindi' : 'English'}.` }
      ];

      if (imageToAnalyze) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageToAnalyze.split(',')[1]
          }
        });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              method: { type: Type.STRING },
              description: { type: Type.STRING },
              mantra: { type: Type.STRING },
              visuals: { type: Type.STRING }
            },
            required: ["type", "method", "description", "mantra", "visuals"]
          },
          systemInstruction: "You are the Archaeos Najar Arbiter, a master of global protective rituals and energy cleansing. Analyze the provided image (if any) to detect energy imbalances. Always return valid JSON."
        }
      }));

      let data = { type: '', method: '', description: '', mantra: '', visuals: '' };
      try {
        data = JSON.parse(response.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", response.text);
        data = { 
          type: 'Energy Imbalance', 
          method: 'Universal Cleansing', 
          description: response.text || 'The scan detected subtle energy shifts.', 
          mantra: 'Om Shanti Shanti Shanti', 
          visuals: 'Projecting white light frequencies' 
        };
      }
      const newRitual: NajarRitual = {
        id: Date.now().toString(),
        ...data,
        date: new Date().toLocaleString()
      };

      // Generate protective audio frequency (TTS of the mantra)
      const ttsResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Chanting the protective mantra: ${data.mantra}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }
            }
          }
        }
      }));

      const base64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) setAudioBase64(base64);

      setRitual(newRitual);
      const updated = [newRitual, ...history];
      setHistory(updated);
      localStorage.setItem('archaeos_najar_history', JSON.stringify(updated));

    } catch (error) {
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleAudio = () => {
    if (!audioBase64) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      if (!audioRef.current) {
        const url = pcmToWav(audioBase64);
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Immersive Header */}
      <div className="relative h-64 rounded-[3rem] overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]"
          />
        </div>
        
        <div className="relative z-20 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-indigo-500/30">
            <Shield className="w-3 h-3" />
            Universal Protection System
          </div>
          <h2 className="font-serif text-5xl text-white">Najar Nivaran AI</h2>
          <p className="text-indigo-200/60 text-sm max-w-md mx-auto">
            The world&apos;s first AI-driven evil eye removal system. Combining ancient rituals with quantum intentionality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Control Panel */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-indigo-600" />
              Energy Scanner
            </h3>
            
            <div className="space-y-6">
              <div className="relative aspect-square rounded-[2.5rem] bg-gray-900 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl">
                {isScanning ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-32 h-32 rounded-full border-2 border-indigo-500/40 flex items-center justify-center"
                    >
                      <Eye className="w-12 h-12 text-white animate-pulse" />
                    </motion.div>
                    <div className="mt-4 text-[10px] font-bold text-white uppercase tracking-widest">
                      Analyzing Aura... {scanProgress}%
                    </div>
                  </div>
                ) : null}

                {useCamera ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
                  />
                ) : capturedImage ? (
                  <img 
                    src={capturedImage} 
                    alt="Aura Source" 
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/20">
                    <Shield className="w-24 h-24 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Aura Source Required</p>
                  </div>
                )}
                
                {isScanning && (
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: "-100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-30"
                  />
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setUseCamera(!useCamera);
                    setCapturedImage(null);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${useCamera ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{useCamera ? 'Stop Camera' : 'Live Scan'}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${capturedImage && !useCamera ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">Upload Photo</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </button>
              </div>

              <button
                onClick={startScan}
                disabled={isScanning || (!useCamera && !capturedImage)}
                className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
              >
                {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Start Energy Diagnosis</>}
              </button>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">System Status</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Sensors calibrated for global ritualistic frequencies. Ready for karmic cleansing.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] text-white rounded-[2.5rem] p-8 shadow-2xl">
            <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Recent Cleansings
            </h4>
            <div className="space-y-3">
              {history.slice(0, 3).map(h => (
                <div key={h.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase">{h.type}</span>
                    <span className="text-[8px] opacity-40">{h.date.split(',')[0]}</span>
                  </div>
                  <p className="text-[10px] opacity-60 line-clamp-1">{h.method}</p>
                </div>
              ))}
              {history.length === 0 && <p className="text-xs opacity-30 italic">No history yet.</p>}
            </div>
          </div>
        </div>

        {/* Ritual Display */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            {ritual ? (
              <motion.div
                key="ritual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Sparkles className="w-48 h-48" />
                  </div>
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-serif text-3xl text-indigo-900">{ritual.type} Detected</h3>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Diagnosis Complete</p>
                      </div>
                      {audioBase64 && (
                        <button 
                          onClick={toggleAudio}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <RefreshCw className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Ritual Method</span>
                        </div>
                        <p className="text-sm font-bold text-indigo-900">{ritual.method}</p>
                        <p className="text-xs text-indigo-700/70 leading-relaxed">{ritual.description}</p>
                      </div>

                      <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Flame className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Protective Mantra</span>
                        </div>
                        <p className="text-sm font-serif italic text-amber-900 leading-relaxed">&quot;{ritual.mantra}&quot;</p>
                      </div>
                    </div>

                    <div className="p-8 bg-[#1a1a1a] rounded-[2.5rem] text-white space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Visual Frequency Projection</span>
                      </div>
                      <p className="text-sm opacity-70 leading-relaxed italic">
                        {ritual.visuals}
                      </p>
                      <div className="pt-4 flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                          <Wifi className="w-3 h-3" /> Digital Cleansing Active
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                          <Lock className="w-3 h-3" /> Protection Sealed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={startScan}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl"
                  >
                    <RefreshCw className="w-5 h-5" /> Perform Another Cleansing
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[500px]">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm">
                  <Shield className="w-16 h-16 text-gray-200" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl opacity-40">Protection Hub</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Start the energy scanner to detect and remove negative influences using global ritualistic intelligence.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <Flame className="w-3 h-3" /> Agni Rituals
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <Droplets className="w-3 h-3" /> Jal Shuddhi
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
