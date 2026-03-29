'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Sparkles, 
  Download, 
  Loader2, 
  Star, 
  Moon, 
  Sun, 
  Scroll, 
  Shield, 
  PenTool,
  Share2,
  DollarSign,
  CheckCircle2,
  FileText,
  History,
  User,
  Rocket,
  RefreshCw
} from 'lucide-react';
import { getGeminiModel, withRetry, Type } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { UserProfileData } from './UserProfile';
import { appDB } from '@/lib/db';

interface BookChapter {
  title: string;
  content: string;
  visualPrompt: string;
  imageUrl?: string;
}

interface SoulBook {
  id: string;
  title: string;
  author: string;
  authorProfile: string;
  summary: string;
  chapters: BookChapter[];
  astralSealUrl?: string;
  soulSignature?: string;
  salesStrategy: string;
  date: string;
  coverImageUrl?: string;
}

export default function SoulJourneyBook({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [book, setBook] = useState<SoulBook | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [history, setHistory] = useState<SoulBook[]>([]);
  const [businessMode, setBusinessMode] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Spiritual Guide');
  const [hasKundli, setHasKundli] = useState(false);
  const [isRefiningCover, setIsRefiningCover] = useState(false);
  const [isRefiningChapter, setIsRefiningChapter] = useState<number | null>(null);
  const [isRefiningSales, setIsRefiningSales] = useState(false);

  const GENRES = [
    { id: 'Spiritual Guide', label: 'Spiritual Guide', desc: 'Mystical, instructional, and soul-focused.' },
    { id: 'Historical Fiction', label: 'Historical Fiction', desc: 'Narrative-driven, dramatic, and immersive.' },
    { id: 'Academic Research', label: 'Academic Paper', desc: 'Formal, analytical, and data-driven.' },
    { id: 'Epic Poem', label: 'Epic Poem', desc: 'Rhythmic, grand, and legendary.' }
  ];

  useEffect(() => {
    const loadData = async () => {
      const saved = await appDB.get<SoulBook[]>('pulse_store', 'archaeos_soul_books');
      if (saved) setHistory(saved);
      
      const kundli = await appDB.get('kundli_store', 'latest_kundli');
      if (kundli) setHasKundli(true);
    };
    loadData();
  }, []);

  const generateBook = async () => {
    if (!profile.isSetup) {
      alert("Please complete your profile first to generate your soul's journey.");
      return;
    }

    setIsGenerating(true);
    setBook(null);

    try {
      const kundliData = await appDB.get('kundli_store', 'latest_kundli');
      const ai = getGeminiModel();
      
      // 1. Generate Book Structure and Content
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Create a comprehensive, sellable "Soul Journey Book" in the genre of "${selectedGenre}" based on this Kundli and Astral Coordinates:
        
        User: ${profile.name}
        Birth: ${profile.birthDate} at ${profile.birthTime} in ${profile.birthPlace}
        Profession: ${profile.profession}
        Interests: ${profile.interests.join(', ')}
        
        ${kundliData ? `Vedic Astrology Data (Kundli & Astral Coordinates): ${JSON.stringify(kundliData)}` : ''}
        
        Genre/Tone: ${selectedGenre}.
        
        The book should have 7 chapters:
        1. The Cosmic Blueprint (Astral Coordinates & Birth Alignment)
        2. The Ancient Echoes (Past Life Analysis)
        3. The Current Avatar (Personality, Strengths & Soul DNA)
        4. The Karmic Web (Challenges, Debts & Lessons)
        5. The Divine Mission (Your unique purpose in this epoch)
        6. The Manifestation Path (Practical steps to fulfill your destiny)
        7. The Infinite Horizon (Future spiritual evolution)
        
        Language: ${globalLanguage}.
        Style: Strictly adhere to the ${selectedGenre} style. 
        
        As a "Business Mode" feature, also generate:
        - A professional "Author Profile" that positions the user as a spiritual authority or a unique soul-traveler.
        - A "Sales & Marketing Strategy" for this specific book, identifying target audiences, potential price points, and promotional hooks based on the soul's unique journey.
        
        Format as JSON.
        
        Include a "soulSignature" field: a short, powerful, unique 1-sentence mantra in the ${globalLanguage} language.
        Include an "astralSealDescription" field: a detailed visual description of a mystical emblem.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              authorProfile: { type: Type.STRING },
              salesStrategy: { type: Type.STRING },
              soulSignature: { type: Type.STRING },
              astralSealDescription: { type: Type.STRING },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING }
                  },
                  required: ["title", "content", "visualPrompt"]
                }
              }
            },
            required: ["title", "summary", "authorProfile", "salesStrategy", "chapters", "soulSignature", "astralSealDescription"]
          }
        }
      }));

      const data = JSON.parse(response.text || '{}');

      // 2. Generate Astral Seal Image
      let astralSealUrl = "";
      try {
        const sealAi = getGeminiModel("gemini-2.5-flash-image");
        const sealResponse = await withRetry(() => sealAi.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: `A highly detailed, symmetrical, mystical Astral Seal/Emblem on a dark background. ${data.astralSealDescription}. Gold and silver lines, glowing sacred geometry.`,
          config: {
            imageConfig: { aspectRatio: "1:1" }
          }
        }));

        for (const part of sealResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            astralSealUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (e) {
        console.error("Seal generation failed", e);
        astralSealUrl = `https://picsum.photos/seed/astral-seal/400/400`;
      }
      
      // 3. Generate Visuals for each chapter (Parallel)
      const chaptersWithImages = await Promise.all(data.chapters.map(async (ch: any) => {
        try {
          const imageAi = getGeminiModel("gemini-2.5-flash-image");
          const imgResponse = await withRetry(() => imageAi.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `A mystical, cinematic, high-quality spiritual illustration for a book chapter titled "${ch.title}". Style: Ancient Vedic art meets modern digital realism. ${ch.visualPrompt}` }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
          }));
          
          let imageUrl = '';
          for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          return { ...ch, imageUrl };
        } catch {
          return { ...ch, imageUrl: `https://picsum.photos/seed/${ch.title}/800/450` };
        }
      }));

      const newBook: SoulBook = {
        id: Date.now().toString(),
        title: data.title,
        author: profile.name,
        authorProfile: data.authorProfile,
        summary: data.summary,
        chapters: chaptersWithImages,
        soulSignature: data.soulSignature,
        astralSealUrl: astralSealUrl,
        salesStrategy: data.salesStrategy,
        date: new Date().toLocaleDateString()
      };

      setBook(newBook);
      const updatedHistory = [newBook, ...history].slice(0, 10);
      setHistory(updatedHistory);
      await appDB.set('pulse_store', 'archaeos_soul_books', updatedHistory);

    } catch (error) {
      console.error(error);
      alert("The cosmic library is currently closed. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateHistory = async (updatedBook: SoulBook) => {
    const newHistory = history.map(b => b.id === updatedBook.id ? updatedBook : b);
    setHistory(newHistory);
    await appDB.set('pulse_store', 'archaeos_soul_books', newHistory);
  };

  const generateCoverArt = async () => {
    if (!book) return;
    setIsRefiningCover(true);
    try {
      const imageAi = getGeminiModel("gemini-2.5-flash-image");
      const imgResponse = await withRetry(() => imageAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A highly detailed, professional, cinematic book cover for a book titled "${book.title}". Summary: ${book.summary}. Style: Mystical, spiritual, high-end publishing.` }] },
        config: { imageConfig: { aspectRatio: "3:4" } }
      }));
      
      let coverUrl = '';
      for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          coverUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (coverUrl) {
        const updatedBook = { ...book, coverImageUrl: coverUrl };
        setBook(updatedBook);
        updateHistory(updatedBook);
      }
    } catch (error) {
      console.error("Cover generation failed", error);
      alert("Failed to generate cover art. Please try again.");
    } finally {
      setIsRefiningCover(false);
    }
  };

  const regenerateChapterImage = async (index: number) => {
    if (!book) return;
    setIsRefiningChapter(index);
    try {
      const ch = book.chapters[index];
      const imageAi = getGeminiModel("gemini-2.5-flash-image");
      const imgResponse = await withRetry(() => imageAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A mystical, cinematic, high-quality spiritual illustration for a book chapter titled "${ch.title}". Style: Ancient Vedic art meets modern digital realism. ${ch.visualPrompt}` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      }));
      
      let imageUrl = '';
      for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        const updatedChapters = [...book.chapters];
        updatedChapters[index] = { ...ch, imageUrl };
        const updatedBook = { ...book, chapters: updatedChapters };
        setBook(updatedBook);
        updateHistory(updatedBook);
      }
    } catch (error) {
      console.error("Chapter image generation failed", error);
      alert("Failed to regenerate chapter visual. Please try again.");
    } finally {
      setIsRefiningChapter(null);
    }
  };

  const optimizeSalesStrategy = async () => {
    if (!book) return;
    setIsRefiningSales(true);
    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an expert book marketer and publisher. Take the following book details and current sales strategy, and provide a highly optimized, expanded, and actionable sales and marketing strategy. 
        
        Book Title: ${book.title}
        Summary: ${book.summary}
        Current Strategy: ${book.salesStrategy}
        
        Provide a detailed, multi-phase marketing plan including target demographics, social media hooks, pricing psychology, and launch steps. Return ONLY the markdown text for the new strategy. Do not include JSON formatting or code blocks.`,
      }));
      
      const newStrategy = response.text || book.salesStrategy;
      const updatedBook = { ...book, salesStrategy: newStrategy };
      setBook(updatedBook);
      updateHistory(updatedBook);
    } catch (error) {
      console.error("Sales strategy optimization failed", error);
      alert("Failed to optimize sales strategy. Please try again.");
    } finally {
      setIsRefiningSales(false);
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Book className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <Scroll className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Soul Journey Publisher</h2>
            {hasKundli && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Kundli Data Integrated
              </div>
            )}
          </div>
          <p className="text-lg opacity-60 mb-8 max-w-2xl">
            Generate a complete, sellable book about your soul&apos;s journey across lifetimes based on your astral coordinates.
          </p>

          <div className="mb-8 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Select Genre & Tone</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(g.id)}
                  className={`p-4 rounded-2xl text-left transition-all border ${
                    selectedGenre === g.id 
                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <p className="font-bold text-sm mb-1">{g.label}</p>
                  <p className="text-[10px] opacity-60 leading-tight">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={generateBook}
              disabled={isGenerating}
              className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/20 flex items-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Manifest My Soul Book
            </button>
            <button 
              onClick={() => setBusinessMode(!businessMode)}
              className={`px-6 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                businessMode ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              {businessMode ? 'Business Mode Active' : 'Enable Business Mode'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Chapters & History */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {book ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
              <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                <Book className="w-5 h-5 text-amber-600" />
                Table of Contents
              </h3>
              <div className="space-y-2">
                {book.chapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChapter(i)}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 ${
                      activeChapter === i 
                        ? 'bg-amber-50 text-amber-900 font-bold' 
                        : 'hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="truncate">{ch.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
              <h3 className="font-serif text-xl mb-6 flex items-center gap-2 text-gray-400">
                <History className="w-5 h-5" />
                Recent Manifestations
              </h3>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-xs opacity-30 italic text-center py-8">No books generated yet.</p>
                ) : (
                  history.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setBook(b)}
                      className="w-full text-left p-4 bg-gray-50 rounded-2xl hover:bg-amber-50 transition-all group"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{b.date}</p>
                      <h4 className="font-serif text-md group-hover:text-amber-700 truncate">{b.title}</h4>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-[2.5rem] p-8 shadow-xl">
            <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Commercial Rights
            </h4>
            <p className="text-xs opacity-80 leading-relaxed">
              With Business Mode enabled, each book includes a digital certificate of authenticity, making it ready for sale as a personalized spiritual asset.
            </p>
          </div>
        </div>

        {/* Main Content: Book Viewer */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-white rounded-[3rem] border border-[#1a1a1a]/5 shadow-sm flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
                  <PenTool className="absolute inset-0 m-auto w-10 h-10 text-amber-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl">Consulting the Akashic Records</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto italic">
                    &quot;Writing the story of your soul across the fabric of time...&quot;
                  </p>
                </div>
              </motion.div>
            ) : book ? (
              <motion.div 
                key="book"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Cover Art Section */}
                <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-[#1a1a1a]/5 flex flex-col md:flex-row gap-8 items-center print:hidden">
                  <div className="w-48 h-64 bg-gray-100 rounded-2xl overflow-hidden relative flex-shrink-0 border border-gray-200 shadow-inner">
                    {book.coverImageUrl ? (
                      <Image src={book.coverImageUrl} alt="Cover Art" fill className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <Book className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Cover Art</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <h3 className="font-serif text-2xl text-[#1a1a1a]">Book Cover Art</h3>
                    <p className="text-sm text-gray-500 max-w-md">Generate a professional, AI-crafted cover for your manuscript based on its title and summary.</p>
                    <button 
                      onClick={generateCoverArt}
                      disabled={isRefiningCover}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 mx-auto md:mx-0 disabled:opacity-50"
                    >
                      {isRefiningCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {book.coverImageUrl ? 'Regenerate Cover Art' : 'Generate Cover Art'}
                    </button>
                  </div>
                </div>

                {/* Book Cover / Active Chapter */}
                <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-[#1a1a1a]/5 print:shadow-none print:border-none">
                  <div className="relative h-64 bg-[#1a1a1a] print:h-40 group">
                    {book.chapters[activeChapter].imageUrl && (
                      <Image 
                        src={book.chapters[activeChapter].imageUrl} 
                        alt={book.chapters[activeChapter].title}
                        fill
                        className="object-cover opacity-60"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                    <div className="absolute bottom-8 left-10 right-10">
                      <p className="text-amber-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Chapter {activeChapter + 1}</p>
                      <h3 className="font-serif text-4xl text-white">{book.chapters[activeChapter].title}</h3>
                    </div>
                    <button
                      onClick={() => regenerateChapterImage(activeChapter)}
                      disabled={isRefiningChapter === activeChapter}
                      className="absolute top-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-black/70 transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100 disabled:opacity-50 print:hidden"
                    >
                      {isRefiningChapter === activeChapter ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Regenerate Visual
                    </button>
                  </div>

                  <div className="p-12 space-y-8 print:p-0">
                    {/* Astral Seal Frontispiece */}
                    {book.astralSealUrl && (
                      <div className="flex flex-col items-center justify-center space-y-4 pb-8 border-b border-gray-100">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-amber-500/20 p-1 bg-white shadow-lg">
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            <Image 
                              src={book.astralSealUrl} 
                              alt="Astral Seal" 
                              fill 
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">Unique Soul Signature Seal</p>
                      </div>
                    )}

                    <div className="prose prose-lg max-w-none font-serif leading-relaxed text-[#1a1a1a]/80 first-letter:text-7xl first-letter:font-bold first-letter:text-amber-600 first-letter:mr-4 first-letter:float-left">
                      <Markdown>{book.chapters[activeChapter].content}</Markdown>
                    </div>

                    {/* Author Profile & Sales Strategy (Business Mode) */}
                    {businessMode && (
                      <div className="mt-16 space-y-8 border-t border-gray-100 pt-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-4 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Author Profile
                            </h4>
                            <div className="prose prose-sm font-serif italic text-gray-600">
                              <Markdown>{book.authorProfile}</Markdown>
                            </div>
                          </div>
                          <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 relative group">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                                <Rocket className="w-4 h-4" />
                                Sales Strategy
                              </h4>
                              <button
                                onClick={optimizeSalesStrategy}
                                disabled={isRefiningSales}
                                className="px-3 py-1.5 bg-indigo-600/10 text-indigo-700 rounded-lg font-bold uppercase tracking-widest text-[9px] hover:bg-indigo-600/20 transition-all flex items-center gap-1 disabled:opacity-50 print:hidden opacity-0 group-hover:opacity-100"
                              >
                                {isRefiningSales ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                Optimize
                              </button>
                            </div>
                            <div className="prose prose-sm font-serif text-indigo-900/70">
                              <Markdown>{book.salesStrategy}</Markdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {businessMode && (
                      <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-900">Commercial Ready</h4>
                            <p className="text-xs text-emerald-700/60">This manuscript is formatted for professional sale.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-900 opacity-40">Suggested Price</p>
                          <p className="text-2xl font-serif text-emerald-900">$49.00</p>
                        </div>
                      </div>
                    )}

                    {/* Unique Soul Signature */}
                    <div className="mt-20 pt-12 border-t border-gray-100 text-center space-y-6">
                      <div className="max-w-2xl mx-auto space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">Soul Signature</h4>
                        <p className="text-2xl font-serif italic text-amber-900 leading-relaxed px-8">
                          &ldquo;{book.soulSignature}&rdquo;
                        </p>
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-200 to-transparent mx-auto mt-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 print:hidden">
                  <button 
                    onClick={downloadPDF}
                    className="px-8 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Download Manuscript (PDF)
                  </button>
                  <button className="px-8 py-4 bg-white border border-[#1a1a1a]/10 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3">
                    <Share2 className="w-5 h-5" />
                    Share Preview
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[600px]">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm relative">
                  <Book className="w-16 h-16 text-gray-200" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white animate-bounce">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl opacity-40">Your Soul&apos;s Manuscript Awaits</h3>
                  <p className="text-sm opacity-40 max-w-sm mx-auto">
                    Click the button above to generate a multi-chapter book about your existence across the cosmic timeline.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Sun, label: 'Solar Origin' },
                    { icon: Moon, label: 'Lunar Path' },
                    { icon: Star, label: 'Karmic Debt' },
                    { icon: FileText, label: 'Sellable Asset' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest opacity-40">
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
