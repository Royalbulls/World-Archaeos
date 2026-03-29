'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  History, 
  Gem, 
  Scroll, 
  PenTool, 
  Copy, 
  Check, 
  Download, 
  Share2,
  Loader2,
  ChevronRight,
  Globe,
  Compass,
  Box
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

type ContentType = 'article' | 'story' | 'info';

interface ArchaeosContentGeneratorProps {
  globalLanguage?: string;
}

export default function ArchaeosContentGenerator({ globalLanguage = 'hi-sa' }: ArchaeosContentGeneratorProps) {
  const [contentType, setContentType] = useState<ContentType>('article');
  const [topic, setTopic] = useState('Indus Valley Civilization');
  const [elements, setElements] = useState('Indus seals, Steatite, Copper, Unicorn motifs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generateContent = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const languageInstruction = globalLanguage === 'hi-sa' 
        ? "Write in a mix of Hindi and Sanskrit (Hinglish/Sanskritized Hindi) to maintain a traditional yet accessible feel."
        : globalLanguage === 'hi' ? "Write in pure Hindi."
        : globalLanguage === 'sa' ? "Write in Sanskrit."
        : "Write in English.";

      const prompt = `
        You are an expert Archaeologist, Historian, and Storyteller. 
        Generate a high-quality ${contentType} about "${topic}".
        
        Incorporate the following specific elements: ${elements}.
        
        Focus on:
        - Historical accuracy blended with intriguing mysteries.
        - Details about minerals, metals, and potential treasures.
        - Unique historical concepts (e.g., biological or mythological interpretations of artifacts like the 'unicorn' on Indus seals).
        - Enigmatic features of ancient civilizations (Mesopotamia, Indus Valley, Egypt, etc.).
        
        ${languageInstruction}
        
        Structure the content with a catchy title, engaging introduction, detailed body sections, and a thought-provoking conclusion.
        Use Markdown for formatting.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      setGeneratedContent(result.text || '');
    } catch (error) {
      console.error("Error generating content:", error);
      setGeneratedContent("An error occurred while generating content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topics = [
    "Indus Valley Civilization",
    "Mesopotamian Ziggurats",
    "Egyptian Pyramids & Hidden Chambers",
    "Mayan Astronomy & Temples",
    "Ancient Indian Metallurgy",
    "Mysterious Nazca Lines",
    "The Lost City of Atlantis",
    "Vedic Science & Vimanas"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl text-[#1a1a1a]">Archaeos Content Architect</h2>
          <p className="text-sm text-[#1a1a1a]/50 mt-1">Synthesize history, artifacts, and enigmas into compelling narratives</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
          <History className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Historical Engine v2.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1a1a1a]/5 space-y-6">
            {/* Content Type */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 mb-3 block">Content Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['article', 'story', 'info'] as ContentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      contentType === type 
                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' 
                        : 'bg-gray-50 text-[#1a1a1a]/40 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {type === 'info' ? 'Info Piece' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 mb-3 block">Primary Topic</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                      topic === t 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-gray-50 text-[#1a1a1a]/60 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <div className="pt-2">
                  <input 
                    type="text"
                    placeholder="Custom Topic..."
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border border-transparent focus:border-amber-200 focus:outline-none"
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Specific Elements */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 mb-3 block">Key Elements (Minerals, Artifacts, Treasures)</label>
              <textarea
                value={elements}
                onChange={(e) => setElements(e.target.value)}
                placeholder="e.g., Lapis Lazuli, Gold, Strange Carvings, Unicorn Seals..."
                className="w-full h-24 bg-gray-50 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent transition-all resize-none"
              />
            </div>

            <button
              onClick={generateContent}
              disabled={isGenerating || !topic}
              className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-black/10"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? 'Synthesizing Data...' : 'Generate Masterpiece'}
            </button>
          </div>

          {/* Quick Tips */}
          <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-2">
              <Compass className="w-3 h-3" />
              Pro Tip
            </h4>
            <p className="text-[11px] text-amber-900/60 leading-relaxed">
              Include specific minerals like <strong>Steatite</strong> or <strong>Carnelian</strong> to get more detailed insights into ancient trade and craftsmanship.
            </p>
          </div>
        </div>

        {/* Content Display */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-[#1a1a1a]/5 min-h-[600px] flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-8 py-6 border-b border-[#1a1a1a]/5 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Scroll className="w-4 h-4 text-[#1a1a1a]/40" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/40">Generated Manuscript</span>
              </div>
              
              {generatedContent && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white rounded-xl transition-all text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="p-2 hover:bg-white rounded-xl transition-all text-[#1a1a1a]/60 hover:text-[#1a1a1a]" title="Download PDF">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-xl transition-all text-[#1a1a1a]/60 hover:text-[#1a1a1a]" title="Share">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-6 text-center"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-amber-100 rounded-full animate-pulse" />
                      <Loader2 className="w-10 h-10 text-amber-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-[#1a1a1a]">Consulting the Akashic Records...</h3>
                      <p className="text-sm text-[#1a1a1a]/40 mt-2">Decoding ancient scripts and synthesizing historical data.</p>
                    </div>
                  </motion.div>
                ) : generatedContent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-amber max-w-none"
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                    <PenTool className="w-24 h-24" />
                    <div className="max-w-xs">
                      <h3 className="font-serif text-2xl">Awaiting Inspiration</h3>
                      <p className="text-sm">Configure your parameters and click generate to create a historical masterpiece.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
