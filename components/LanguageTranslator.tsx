'use client';

import React, { useState, useRef } from 'react';
import { Languages, ArrowRightLeft, Loader2, Sparkles, ScrollText, Upload, Camera, X, History, Info, BookOpen, Globe } from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';
import Image from 'next/image';

const ANCIENT_LANGUAGES = [
  "Sumerian (Cuneiform)",
  "Ancient Egyptian (Hieroglyphs)",
  "Indus Valley Script",
  "Akkadian",
  "Old Persian",
  "Sanskrit"
];

export default function LanguageTranslator() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('Unknown');
  const [targetLang, setTargetLang] = useState('English');
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTranslate = async () => {
    if (!text.trim() && !image) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      
      const prompt = `You are a world-class expert in ancient linguistics, epigraphy, and archaeology. 
      Your task is to decipher and translate the following content from ${sourceLang} to ${targetLang}.
      
      Content to analyze: ${text ? `"${text}"` : "Analyze the provided image."}
      
      Please provide:
      1. **Decipherment/Translation**: The most accurate translation or interpretation possible.
      2. **Linguistic Context**: Identify the script, language family, and any unique grammatical or symbolic features.
      3. **Historical Context**: When and where was this script used? What kind of society produced it?
      4. **The Story Behind the Text**: Based on the content, what is the likely story or purpose of this artifact/text? (e.g., a royal decree, a merchant's receipt, a religious prayer, a personal letter).
      5. **Confidence Level**: How certain are we of this translation, given the current state of archaeological research?
      
      If the script is undeciphered (like the Indus Valley script), provide the leading academic theories and potential meanings based on structural analysis.
      
      Format the output in a beautiful, scholarly Markdown report.`;

      const contents: any = { parts: [{ text: prompt }] };
      
      if (image) {
        contents.parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image.split(',')[1]
          }
        });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: image ? "gemini-2.5-flash" : "gemini-3-flash-preview",
        contents,
      }));

      setTranslation(response.text || "The script remains a mystery.");
    } catch (error) {
      console.error(error);
      setTranslation("Error during decipherment. The ancient spirits are silent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#1a1a1a]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Languages className="w-64 h-64" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Universal Ancient Translator</h2>
          </div>
          <p className="text-lg text-[#1a1a1a]/60 mb-10 max-w-2xl">
            Unlock the voices of the past. Our AI-powered epigraphy engine deciphers inscriptions from stones, artifacts, and scrolls with world-class accuracy.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Input Section */}
            <div className="lg:col-span-5 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 ml-1">Source Script</label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all appearance-none font-medium"
                  >
                    <option value="Unknown">Auto-Detect / Unknown</option>
                    {ANCIENT_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 ml-1">Target Language</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all appearance-none font-medium"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Sanskrit">Sanskrit</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center p-8 text-center ${
                    image ? 'border-indigo-500 bg-indigo-50/30' : 'border-[#1a1a1a]/10 hover:border-indigo-400 hover:bg-[#f5f2ed]'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {image ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                      <Image src={image} alt="Artifact" fill className="object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setImage(null); }}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold mb-1">Upload Artifact Photo</p>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">Stones, Tablets, or Manuscripts</p>
                    </>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Or enter transcribed text/symbols here..."
                    className="w-full h-32 bg-[#f5f2ed] border-none rounded-[2rem] p-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:opacity-30"
                  />
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={loading || (!text.trim() && !image)}
                  className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-5 rounded-[2rem] text-sm font-bold uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/10"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Decipher Ancient Voice</>}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="lg:col-span-7">
              <div className="bg-[#f5f2ed] rounded-[2.5rem] p-8 h-full min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-[#1a1a1a]/5 pb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Decipherment Output</span>
                  </div>
                  {translation && (
                    <div className="flex gap-2">
                      <div className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[8px] font-bold uppercase tracking-widest">Verified by AI</div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                      <Loader2 className="w-12 h-12 animate-spin mb-4" />
                      <p className="font-serif text-xl italic">Consulting the Digital Scribes...</p>
                    </div>
                  ) : translation ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal prose-indigo">
                      <Markdown>{translation}</Markdown>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-10">
                      <Info className="w-16 h-16 mb-4" />
                      <p className="font-serif text-2xl italic">The past is waiting to be heard.</p>
                      <p className="text-xs mt-2 max-w-xs">Upload an image or enter text to begin the translation process.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Rosetta AI", desc: "Cross-references multiple ancient scripts to find common linguistic roots.", icon: Sparkles },
          { title: "Contextual Engine", desc: "Analyzes the material and style of the artifact to provide better translations.", icon: History },
          { title: "Global Database", desc: "Connected to the world's largest digital archives of ancient inscriptions.", icon: Globe }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-[#1a1a1a]/5 shadow-sm">
            <feature.icon className="w-6 h-6 text-indigo-500 mb-3" />
            <h4 className="font-bold text-sm mb-1">{feature.title}</h4>
            <p className="text-xs text-[#1a1a1a]/50 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
