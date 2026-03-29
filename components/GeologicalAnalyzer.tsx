'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Pickaxe, 
  Search, 
  Globe, 
  History, 
  Zap, 
  Layers, 
  Mountain, 
  FlaskConical,
  Info,
  ChevronRight,
  Camera,
  Sparkles,
  Database,
  Map as MapIcon,
  Star
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface MineralData {
  name: string;
  type: 'Mineral' | 'Metal' | 'Formation';
  origin: string;
  properties: string[];
  historicalSignificance: string;
  chemicalFormula?: string;
  hardness?: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  image: string;
}

const SAMPLE_DATA: MineralData[] = [
  {
    name: 'Lapis Lazuli',
    type: 'Mineral',
    origin: 'Badakhshan, Afghanistan',
    properties: ['Deep blue color', 'Contains lazurite, calcite, and pyrite', 'Metamorphic rock'],
    historicalSignificance: 'Highly prized by ancient civilizations in Mesopotamia, Egypt, and the Indus Valley. Used for the funeral mask of Tutankhamun and as a pigment for ultramarine paint.',
    chemicalFormula: '(Na,Ca)8(AlSiO4)6(S,Cl,SO4,OH)2',
    hardness: '5 - 5.5',
    rarity: 'Rare',
    image: 'https://picsum.photos/seed/lapis/400/300'
  },
  {
    name: 'Wootz Steel',
    type: 'Metal',
    origin: 'Southern India (Tamil Nadu/Karnataka)',
    properties: ['High carbon content', 'Characteristic banding patterns', 'Exceptional toughness and sharpness'],
    historicalSignificance: 'The legendary "Damascus Steel" was made from Indian Wootz ingots. It revolutionized ancient warfare and was exported globally from the 6th century BCE.',
    chemicalFormula: 'Fe + C (1.5%)',
    hardness: '60+ HRC (when forged)',
    rarity: 'Legendary',
    image: 'https://picsum.photos/seed/steel/400/300'
  },
  {
    name: 'Deccan Traps Basalt',
    type: 'Formation',
    origin: 'Western Ghats, India',
    properties: ['Igneous volcanic rock', 'Fine-grained', 'Rich in iron and magnesium'],
    historicalSignificance: 'Formed by one of the largest volcanic eruptions in Earth history. The rock was used to carve the magnificent Ajanta and Ellora caves.',
    chemicalFormula: 'Complex Silicate',
    hardness: '6',
    rarity: 'Common',
    image: 'https://picsum.photos/seed/basalt/400/300'
  }
];

export default function GeologicalAnalyzer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MineralData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleAiAnalyze = async (query: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this geological find: "${query}". Provide its probable origin, physical properties, and historical significance in ancient civilizations (especially Indian context if applicable). Format as a professional geological report.`,
      });
      setAiAnalysis(response.text || "Analysis failed. Please try again.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAnalysis("Error connecting to the Akashic Geological Database.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredData = SAMPLE_DATA.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">
          <Mountain className="w-4 h-4" />
          Lithosphere Intelligence System
        </div>
        <h2 className="font-serif text-5xl">Geological & Mineral Lab</h2>
        <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto text-lg">
          Identify and analyze minerals, metals, and rock formations from ancient excavation sites.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Search & Catalog */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1a1a1a]/5 shadow-xl space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
              <input 
                type="text" 
                placeholder="Search minerals or metals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredData.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setSelectedItem(item);
                    setAiAnalysis(null);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                    selectedItem?.name === item.name 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                      : 'bg-gray-50 border-transparent hover:bg-white hover:border-emerald-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedItem?.name === item.name ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type === 'Mineral' ? <Sparkles className="w-5 h-5" /> : 
                     item.type === 'Metal' ? <Zap className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className={`text-[10px] uppercase tracking-widest ${selectedItem?.name === item.name ? 'opacity-60' : 'opacity-40'}`}>
                      {item.type} • {item.rarity}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedItem?.name === item.name ? 'rotate-90 opacity-100' : 'opacity-20'}`} />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleAiAnalyze(searchQuery || "Identify a mysterious blue mineral from Indus Valley")}
                className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                AI Deep Scan
              </button>
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Database className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Global Geo-Database</span>
            </div>
            <p className="text-xs text-blue-800/70 leading-relaxed">
              Connected to the Archaeos Lithosphere Network. Real-time updates from 1,200+ excavation sites worldwide.
            </p>
          </div>
        </div>

        {/* Right Panel: Analysis Display */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-white rounded-[3rem] border border-[#1a1a1a]/5 shadow-sm flex flex-col items-center justify-center p-12 text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <Pickaxe className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl">Analyzing Geological Signature...</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto">Cross-referencing chemical composition with ancient mining records.</p>
                </div>
              </motion.div>
            ) : aiAnalysis ? (
              <motion.div 
                key="ai-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] p-10 border border-emerald-100 shadow-xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-3xl">AI Geological Report</h3>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Generated by Gemini Geo-Core</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                <div className="prose prose-emerald max-w-none">
                  <div className="whitespace-pre-wrap text-[#1a1a1a]/80 leading-relaxed font-serif text-lg">
                    {aiAnalysis}
                  </div>
                </div>
              </motion.div>
            ) : selectedItem ? (
              <motion.div 
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Main Info Card */}
                <div className="bg-white rounded-[3rem] overflow-hidden border border-[#1a1a1a]/5 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="h-64 md:h-auto relative">
                      <Image 
                        src={selectedItem.image} 
                        alt={selectedItem.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                        <div>
                          <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1">{selectedItem.type}</p>
                          <h3 className="text-white font-serif text-4xl">{selectedItem.name}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-10 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Origin</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-emerald-600" />
                            {selectedItem.origin}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Hardness</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-amber-600" />
                            {selectedItem.hardness || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Chemical Formula</p>
                          <div className="flex items-center gap-2 text-sm font-mono">
                            <FlaskConical className="w-4 h-4 text-blue-600" />
                            {selectedItem.chemicalFormula || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Rarity</p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            selectedItem.rarity === 'Legendary' ? 'bg-amber-100 text-amber-700' :
                            selectedItem.rarity === 'Rare' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            <Star className="w-3 h-3" />
                            {selectedItem.rarity}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-serif text-xl flex items-center gap-2">
                          <Info className="w-5 h-5 text-indigo-600" />
                          Physical Properties
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.properties.map((prop, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-50 rounded-xl text-xs text-[#1a1a1a]/70 border border-gray-100">
                              {prop}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Significance Card */}
                <div className="bg-indigo-900 text-white rounded-[3rem] p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <History className="w-6 h-6 text-indigo-300" />
                      </div>
                      <h4 className="font-serif text-2xl">Historical Significance</h4>
                    </div>
                    <p className="text-lg text-indigo-100/80 leading-relaxed font-serif italic">
                      &quot;{selectedItem.historicalSignificance}&quot;
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm">
                  <MapIcon className="w-12 h-12 text-gray-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl opacity-40">Select a Sample for Analysis</h3>
                  <p className="text-sm opacity-40 max-w-xs mx-auto">
                    Choose a mineral or metal from the catalog or use the AI Deep Scan to identify a new discovery.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </button>
                  <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Import Logs
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Geological Map Preview */}
      <div className="bg-white rounded-[3rem] p-12 border border-[#1a1a1a]/5 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl">Active Excavation Sites</h3>
            <p className="text-sm opacity-40 uppercase tracking-widest">Global Geological Monitoring</p>
          </div>
          <button className="px-8 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
            <MapIcon className="w-5 h-5" />
            Open Full Map
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { site: 'Indus Valley (Harappa)', status: 'Active', finds: 124, color: 'emerald' },
            { site: 'Deccan Plateau', status: 'Surveying', finds: 45, color: 'blue' },
            { site: 'Himalayan Foothills', status: 'Paused', finds: 89, color: 'amber' }
          ].map((site, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 group hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl bg-${site.color}-50 text-${site.color}-600 flex items-center justify-center`}>
                  <Pickaxe className="w-5 h-5" />
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-${site.color}-100 text-${site.color}-700`}>
                  {site.status}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-lg">{site.site}</h4>
                <p className="text-xs opacity-40">{site.finds} Geological Samples Found</p>
              </div>
              <button className="w-full py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all">
                View Site Data
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
