'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Baby, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Wand2, 
  Heart,
  Info,
  ArrowRight,
  Save,
  Star,
  Globe,
  AtSign,
  Palette,
  Camera,
  MessageCircle,
  Video,
  Volume2,
  Loader2
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import { Modality } from "@google/genai";

export default function Namkaran() {
  const [birthDetails, setBirthDetails] = useState({
    date: '',
    time: '',
    place: '',
    gender: 'male',
    fatherName: '',
    motherName: '',
    photo: '',
    mode: 'vedic' // 'vedic' or 'universal'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isPronouncing, setIsPronouncing] = useState<string | null>(null);

  const playPronunciation = async (name: string) => {
    setIsPronouncing(name);
    try {
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Pronounce the name: ${name}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("Pronunciation error:", error);
    } finally {
      setIsPronouncing(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBirthDetails({ ...birthDetails, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const ai = getGeminiModel();
      const prompt = `Act as a Global Branding Expert and Naming Specialist. 
      Context: We are creating a "Future Identity" for a child. The name must be unique, meaningful, and optimized for the digital age (social media handles, domains).
      
      Birth Details:
      Date: ${birthDetails.date}
      Time: ${birthDetails.time}
      Place: ${birthDetails.place}
      Gender: ${birthDetails.gender}
      Mode: ${birthDetails.mode} (If 'vedic', focus on Rashi/Nakshatra. If 'universal', focus on global appeal across all religions/cultures).
      
      Requirements:
      1. Suggest 10 unique, trending, and meaningful names.
      2. For each name, provide:
         - Meaning and Origin.
         - "Digital Identity Score" (1-10) based on likelihood of handle availability (@name).
         - Suggested Social Media Handle (e.g., @iam[Name], @[Name]Official).
      3. If mode is 'vedic', include Rashi and Nakshatra.
      4. Suggest a "Brand Color Palette" for the child's future personal brand.
      5. Provide a "Global Appeal" rating (1-10).
      
      Return the response in JSON format:
      {
        "rashi": "string (optional)",
        "nakshatra": "string (optional)",
        "syllables": ["string"],
        "names": [
          { 
            "name": "string", 
            "meaning": "string", 
            "digitalScore": number, 
            "suggestedHandle": "string",
            "origin": "string"
          }
        ],
        "brandColors": ["string"],
        "personality": "string",
        "muhurats": ["string"]
      }`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rashi: { type: Type.STRING },
              nakshatra: { type: Type.STRING },
              syllables: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              names: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    digitalScore: { type: Type.NUMBER },
                    suggestedHandle: { type: Type.STRING },
                    origin: { type: Type.STRING }
                  },
                  required: ["name", "meaning", "digitalScore", "suggestedHandle", "origin"]
                }
              },
              brandColors: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              personality: { type: Type.STRING },
              muhurats: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["names", "brandColors", "personality", "muhurats"]
          }
        }
      }));

      let data = { names: [], brandColors: [], personality: '', muhurats: [] };
      try {
        data = JSON.parse(response.text || '{}');
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Failed to parse name suggestions");
      }
      setSuggestions(data);
    } catch (error) {
      console.error("Naming error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:m-0 print:p-0">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#1a1a1a]/5 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-100 rounded-2xl text-pink-700">
              <Baby className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Namkaran Ceremony</h2>
          </div>
          <p className="text-lg text-[#1a1a1a]/60 max-w-2xl leading-relaxed">
            Welcome a new soul with a name that resonates with the cosmos. 
            Archaeos calculates the Rashi and suggests names based on Vedic traditions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-6">
            <h3 className="font-serif text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Birth Details
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Father&apos;s Name</label>
                  <input 
                    type="text" 
                    value={birthDetails.fatherName}
                    onChange={(e) => setBirthDetails({...birthDetails, fatherName: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="Father Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mother&apos;s Name</label>
                  <input 
                    type="text" 
                    value={birthDetails.motherName}
                    onChange={(e) => setBirthDetails({...birthDetails, motherName: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="Mother Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="date" 
                    value={birthDetails.date}
                    onChange={(e) => setBirthDetails({...birthDetails, date: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input 
                      type="time" 
                      value={birthDetails.time}
                      onChange={(e) => setBirthDetails({...birthDetails, time: e.target.value})}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Naming Mode</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setBirthDetails({ ...birthDetails, mode: 'vedic' })}
                      className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                        birthDetails.mode === 'vedic' 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : 'bg-white border-[#1a1a1a]/5 text-[#1a1a1a]/40'
                      }`}
                    >
                      Vedic
                    </button>
                    <button
                      onClick={() => setBirthDetails({ ...birthDetails, mode: 'universal' })}
                      className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                        birthDetails.mode === 'universal' 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-[#1a1a1a]/5 text-[#1a1a1a]/40'
                      }`}
                    >
                      Global
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gender</label>
                  <select 
                    value={birthDetails.gender}
                    onChange={(e) => setBirthDetails({...birthDetails, gender: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Place</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input 
                      type="text" 
                      value={birthDetails.place}
                      onChange={(e) => setBirthDetails({...birthDetails, place: e.target.value})}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pink-500 transition-all"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Baby&apos;s Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !birthDetails.date || !birthDetails.place}
              className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Consulting Stars...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Suggest Names
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-7 print:w-full">
          <AnimatePresence mode="wait">
            {suggestions ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Astro/Brand Summary */}
                <div className="bg-indigo-900 text-indigo-50 rounded-[2rem] p-8 shadow-xl flex items-center justify-between print:bg-white print:text-black print:border print:shadow-none">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1 print:opacity-100">
                      {birthDetails.mode === 'vedic' ? 'Rashi / Nakshatra' : 'Identity Profile'}
                    </p>
                    <h4 className="font-serif text-2xl">
                      {birthDetails.mode === 'vedic' 
                        ? `${suggestions.rashi} • ${suggestions.nakshatra}`
                        : 'Global Digital Native'}
                    </h4>
                    <div className="flex gap-2 mt-2">
                      {(suggestions.syllables || []).map((s: string) => (
                        <span key={s} className="px-2 py-1 bg-white/10 rounded text-xs font-mono print:bg-gray-100">{s}</span>
                      ))}
                      {birthDetails.mode === 'universal' && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono uppercase tracking-widest">Universal</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1 print:opacity-100">
                      {birthDetails.mode === 'vedic' ? 'Lucky Color/No' : 'Global Appeal'}
                    </p>
                    <p className="text-lg font-bold">
                      {birthDetails.mode === 'vedic' 
                        ? `${suggestions.luckyColor} / ${suggestions.luckyNumber}`
                        : 'High (9.5/10)'}
                    </p>
                  </div>
                </div>

                {/* Name Suggestions */}
                <div className="grid grid-cols-1 gap-4 print:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-xl">Suggested Names</h3>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowCertificate(true)}
                        className="text-xs font-bold uppercase tracking-widest text-pink-600 hover:underline flex items-center gap-1"
                      >
                        Generate Janmapatri <ArrowRight className="w-3 h-3" />
                      </button>
                      <button 
                        className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Get Special Birth Certificate <Star className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {(suggestions.names || []).map((n: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-2xl border border-[#1a1a1a]/5 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-serif text-xl text-indigo-600 mb-1">{n.name}</h5>
                          <button 
                            onClick={() => playPronunciation(n.name)}
                            disabled={isPronouncing === n.name}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                            title="Hear Pronunciation"
                          >
                            {isPronouncing === n.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#1a1a1a]/60">{n.meaning}</p>
                        <div className="flex gap-2 pt-1">
                          <span className="px-1.5 py-0.5 bg-gray-50 text-[8px] font-bold uppercase tracking-widest rounded border border-gray-100">
                            {n.origin || 'Global'}
                          </span>
                        </div>
                      </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2 justify-end">
                            <AtSign className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-mono font-bold text-emerald-600">{n.suggestedHandle}</span>
                            <div className="flex gap-1 ml-2">
                              <a 
                                href={`https://www.instagram.com/${(n.suggestedHandle || '').replace('@', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded transition-all"
                                title="Check Camera"
                              >
                                <Camera className="w-3 h-3" />
                              </a>
                              <a 
                                href={`https://x.com/${(n.suggestedHandle || '').replace('@', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-400 rounded transition-all"
                                title="Check X (MessageCircle)"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                              <a 
                                href={`https://www.youtube.com/@${(n.suggestedHandle || '').replace('@', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all"
                                title="Check YouTube"
                              >
                                <Video className="w-3 h-3" />
                              </a>
                              <a 
                                href={`https://www.godaddy.com/en-in/domainsearch/find?domainToCheck=${(n.name || '').toLowerCase()}.com`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded transition-all"
                                title="Check Domain (.com)"
                              >
                                <Globe className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Digital Score</span>
                          <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${(n.digitalScore || 5) * 10}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Brand Palette */}
                  {(suggestions.brandColors && suggestions.brandColors.length > 0) && (
                    <div className="p-6 bg-white rounded-[2rem] border border-[#1a1a1a]/5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Future Brand Palette</h4>
                      </div>
                      <div className="flex gap-3">
                        {suggestions.brandColors.map((color: string, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div 
                              className="w-10 h-10 rounded-xl shadow-inner border border-black/5" 
                              style={{ backgroundColor: color }} 
                            />
                            <span className="text-[8px] font-mono opacity-40">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Printable Certificate / Janmapatri */}
                {showCertificate && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-8 border-double border-pink-100 p-12 rounded-[3rem] shadow-2xl relative print:border-pink-500 print:shadow-none print:rounded-none print:m-0"
                  >
                    <div className="absolute top-4 right-4 print:hidden">
                      <button 
                        onClick={handlePrint}
                        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-center space-y-6">
                      <div className="flex justify-center mb-4">
                        {birthDetails.photo ? (
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-100 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={birthDetails.photo} alt="Baby" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <Baby className="w-16 h-16 text-pink-500" />
                        )}
                      </div>
                      <h2 className="font-serif text-5xl text-pink-600">Janmapatri</h2>
                      <p className="text-xs uppercase tracking-[0.4em] opacity-40">Namkaran Sanskar</p>
                      
                      <div className="grid grid-cols-2 gap-8 py-8 border-y border-pink-100 text-left">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Father&apos;s Name</p>
                            <p className="font-bold">{birthDetails.fatherName || 'Not Specified'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Mother&apos;s Name</p>
                            <p className="font-bold">{birthDetails.motherName || 'Not Specified'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Birth Date & Time</p>
                            <p className="font-bold">{birthDetails.date} • {birthDetails.time}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Rashi (Zodiac)</p>
                            <p className="font-bold">{suggestions.rashi}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Nakshatra</p>
                            <p className="font-bold">{suggestions.nakshatra}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Auspicious Syllables</p>
                            <p className="font-bold">{(suggestions.syllables || []).join(', ')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-6 text-left bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                        <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Personality Forecast (Swabhav)</p>
                        <p className="text-sm italic leading-relaxed text-indigo-900">{suggestions.personality}</p>
                      </div>

                      <div className="py-4">
                        <h3 className="font-serif text-2xl mb-4">Recommended Names</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {(suggestions.names || []).slice(0, 6).map((n: any, i: number) => (
                            <div key={i} className="p-4 bg-pink-50 rounded-2xl">
                              <p className="font-bold text-pink-600">{n.name}</p>
                              <p className="text-[10px] opacity-60">{n.meaning}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 flex justify-between items-end">
                        <div className="text-left space-y-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Lucky Stone</p>
                            <p className="font-bold text-indigo-600">{suggestions.luckyStone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Auspicious Muhurats</p>
                            <p className="text-xs font-medium">{(suggestions.muhurats || []).join(' • ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest opacity-40">Archaeos Institute</p>
                          <p className="text-[8px] opacity-30">By Royal Bulls Advisory Private Limited</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#f5f2ed]/50 rounded-[3rem] border-2 border-dashed border-[#1a1a1a]/10">
                <Baby className="w-16 h-16 opacity-10 mb-4" />
                <h4 className="font-serif text-xl opacity-40">Awaiting Birth Details</h4>
                <p className="text-xs opacity-30 max-w-xs mt-2">
                  Enter the child&apos;s birth information to receive cosmic name suggestions and astrological insights.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
