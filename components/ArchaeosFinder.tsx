'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  Target, 
  TrendingUp, 
  Mountain, 
  Activity, 
  Zap, 
  MapPin, 
  ChevronRight,
  Info,
  Loader2,
  Scan,
  Database,
  Search,
  Compass,
  ArrowUpRight,
  Shield,
  Gem,
  Pickaxe,
  Star,
  X
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import { extractJson } from '@/lib/utils';
import { UserProfileData } from './UserProfile';

interface SitePrediction {
  id: string;
  name: string;
  type: 'Ancient City' | 'Mineral Deposit' | 'Hidden Treasure' | 'Structural Anomaly';
  coordinates: { lat: number, lng: number };
  location: string;
  probability: number;
  depth: string;
  geology: string[];
  description: string;
  intel: string;
  priority: 'High' | 'Medium' | 'Low';
}

export default function ArchaeosFinder({ profile }: { profile: UserProfileData }) {
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<'Optical' | 'Thermal' | 'Gravity' | 'Vedic'>('Optical');
  const [region, setRegion] = useState('Indus Valley');
  const [predictions, setPredictions] = useState<SitePrediction[]>([]);
  const [selectedSite, setSelectedSite] = useState<SitePrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const regions = [
    'Indus Valley',
    'Mesopotamia',
    'Andes Mountains',
    'Sahara Desert',
    'Mekong Delta',
    'Gobi Steppe'
  ];

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setPredictions([]);
    setSelectedSite(null);

    try {
      const ai = getGeminiModel();
      const prompt = `As an expert Archaeos AI using satellite and geological data, predict 3 potential undiscovered sites in the ${region} region using ${scanType} scanning. 
      Sites can be Ancient Cities, Mineral Deposits (like gold or rare earth), or Hidden Treasures.
      
      For each site, provide:
      - A descriptive name.
      - Site type (Village, Temple, Mine, Cache).
      - Success probability (percentage).
      - Estimated depth (e.g., 5m, 20m).
      - Geological information (soil type, rock density).
      - A compelling archaeological description.
      - Tactical intel for excavation.

      Return the data in a clean JSON array of objects.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      }));

      const rawText = response.text || '[]';
      const jsonText = extractJson(rawText);
      const data = JSON.parse(jsonText);
      
      const processed: SitePrediction[] = data.map((item: any, index: number) => ({
        id: `site-${Date.now()}-${index}`,
        name: item.name,
        type: item.type,
        location: region,
        coordinates: { 
          lat: 0, // In a real app we'd get a center point for the region
          lng: 0 
        },
        probability: item.probability || Math.floor(Math.random() * 40) + 60,
        depth: item.depth || 'Unknown',
        geology: item.geology || ['Sandstone', 'Clay'],
        description: item.description,
        intel: item.intel,
        priority: (item.probability > 85) ? 'High' : (item.probability > 70 ? 'Medium' : 'Low')
      }));

      setPredictions(processed);
    } catch (err) {
      console.error("Scan failed:", err);
      setError("The tactical sweep was interrupted by solar interference.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1a1a1a]/10 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-[#1a1a1a] rounded text-[#f5f2ed]">
              <Radar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Tactical Finder Site</span>
          </div>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-[#1a1a1a]">Archaeos Finder</h2>
          <p className="text-sm text-[#1a1a1a]/60 mt-2 max-w-lg">
            Predictive AI suite for deep-terrain scanning. Analyzing satellite anomalies and geological resonance to locate humanity&apos;s lost heritage.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                region === r 
                  ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg shadow-[#1a1a1a]/20' 
                  : 'bg-white border border-[#1a1a1a]/5 text-[#1a1a1a]/40 hover:border-[#1a1a1a]/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Scan Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-[#1a1a1a]/5 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-serif text-xl border-b border-[#1a1a1a]/5 pb-4 mb-6">Scan Parameters</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(['Optical', 'Thermal', 'Gravity', 'Vedic'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setScanType(type)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        scanType === type 
                          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' 
                          : 'border-[#1a1a1a]/5 hover:border-[#1a1a1a]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {type === 'Optical' && <Scan className="w-4 h-4" />}
                        {type === 'Thermal' && <Activity className="w-4 h-4" />}
                        {type === 'Gravity' && <Mountain className="w-4 h-4" />}
                        {type === 'Vedic' && <Zap className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{type}</span>
                      </div>
                      <p className="text-[9px] opacity-60 leading-tight">
                        {type === 'Optical' && 'High-res visual analysis'}
                        {type === 'Thermal' && 'Heat signature mapping'}
                        {type === 'Gravity' && 'Density & mass detection'}
                        {type === 'Vedic' && 'Akashic resonance locators'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Initializing Sweep...
                      </>
                    ) : (
                      <>
                        <Radar className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                        Begin Tactical Scan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Background Radar Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] border-2 border-[#1a1a1a] rounded-full animate-[pulse_4s_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[100%] border border-[#1a1a1a] rounded-full animate-[pulse_3s_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[60%] border border-[#1a1a1a] rounded-full animate-[pulse_2s_infinite]" />
            </div>
          </div>

          {/* Stats Widget */}
          <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-3xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="font-serif text-lg">Global Archive Stats</h3>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Terabytes Scanned</p>
                  <p className="text-3xl font-serif">14.2<span className="text-sm opacity-40 italic ml-1">PB</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cities Found</p>
                  <p className="text-3xl font-serif">842</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Active Excs</p>
                  <p className="text-3xl font-serif">24</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Vedic Markers</p>
                  <p className="text-3xl font-serif">1.2<span className="text-sm opacity-40 italic ml-1">M</span></p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-8">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 text-red-600 flex items-center gap-4">
              <Shield className="w-6 h-6" />
              <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          {scanning ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white/30 backdrop-blur-sm rounded-3xl border border-dashed border-[#1a1a1a]/10">
              <div className="relative mb-8">
                <div className="w-32 h-32 border-4 border-indigo-600/20 rounded-full animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-12 h-12 text-indigo-600 animate-[spin_3s_linear_infinite]" />
                </div>
              </div>
              <h4 className="font-serif text-2xl mb-2">Analyzing Akashic Layers...</h4>
              <p className="text-sm opacity-50 max-w-md uppercase tracking-widest font-bold">
                Deploying multispectral drones to {region}.<br/>Cross-referencing geological densities with {scanType} data.
              </p>
            </div>
          ) : predictions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="font-serif text-2xl">Prediction Report {region}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.map(site => (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`text-left p-6 rounded-3xl border transition-all relative overflow-hidden group ${
                      selectedSite?.id === site.id 
                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-2xl' 
                        : 'bg-white border-[#1a1a1a]/5 hover:border-[#1a1a1a]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        {site.type === 'Ancient City' && <Compass className="w-4 h-4" />}
                        {site.type === 'Mineral Deposit' && <Gem className="w-4 h-4" />}
                        {site.type === 'Hidden Treasure' && <Star className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{site.type}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        site.priority === 'High' ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400' : 'opacity-40'
                      }`}>
                        {site.priority} Priority
                      </div>
                    </div>

                    <h4 className="font-serif text-xl mb-2 relative z-10">{site.name}</h4>
                    
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-tighter opacity-40">Probability</p>
                          <p className={`text-xl font-mono ${site.probability > 80 ? 'text-indigo-400' : ''}`}>{site.probability}%</p>
                       </div>
                       <div className="h-8 w-px bg-white/10" />
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-tighter opacity-40">Target Depth</p>
                          <p className="text-xl font-mono">{site.depth}</p>
                       </div>
                    </div>

                    <p className={`text-sm line-clamp-2 leading-relaxed relative z-10 ${selectedSite?.id === site.id ? 'text-white/70' : 'text-[#1a1a1a]/60'}`}>
                      {site.description}
                    </p>

                    <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowUpRight className="w-5 h-5 translate-y-1 group-active:translate-y-0 transition-transform" />
                    </div>

                    {/* Background Visual Hint */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  </button>
                ))}
              </div>

              {/* Site Details Overlay */}
              <AnimatePresence>
                {selectedSite && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-[#1a1a1a] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                  >
                     <button 
                      onClick={() => setSelectedSite(null)}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>

                     <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-12">
                           <div className="flex items-center gap-3 mb-2">
                              <Target className="w-5 h-5 text-indigo-400" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Site Intelligence Profile</span>
                           </div>
                           <h3 className="font-serif text-4xl mb-6">{selectedSite.name}</h3>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Geological Makeup</p>
                                 <div className="flex flex-wrap gap-2">
                                    {selectedSite.geology.map(g => (
                                      <span key={g} className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">{g}</span>
                                    ))}
                                 </div>
                              </div>
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Coordinates</p>
                                 <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-mono">LAT: {selectedSite.coordinates.lat.toFixed(4)} | LNG: {selectedSite.coordinates.lng.toFixed(4)}</span>
                                 </div>
                              </div>
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Confidence Score</p>
                                 <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <span className="text-lg font-mono">{selectedSite.probability}% Accuracy</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div className="prose prose-invert max-w-none">
                                 <p className="text-lg leading-relaxed text-white/80">{selectedSite.description}</p>
                              </div>
                              
                              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
                                 <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Archaeos Tactical Intel</span>
                                 </div>
                                 <p className="text-sm opacity-80 leading-relaxed italic">{selectedSite.intel}</p>
                              </div>

                              <div className="flex flex-wrap gap-4 pt-4">
                                 <button className="px-8 py-4 bg-white text-[#1a1a1a] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-90 transition-all flex items-center gap-2">
                                    <Pickaxe className="w-4 h-4" />
                                    Launch Excavation Guide
                                 </button>
                                 <button 
                                  onClick={() => window.open(`https://www.google.com/maps/@${selectedSite.coordinates.lat+0.01},${selectedSite.coordinates.lng+0.01},15z/data=!3m1!1e3`, '_blank')}
                                  className="px-8 py-4 border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all flex items-center gap-2"
                                 >
                                    <MapPin className="w-4 h-4" />
                                    View on Satellite
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-[#1a1a1a]/5">
              <div className="w-20 h-20 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center text-[#1a1a1a]/20 mb-6">
                <Search className="w-10 h-10" />
              </div>
              <h4 className="font-serif text-2xl mb-2">No Active Scanning</h4>
              <p className="text-sm opacity-40 max-w-xs mx-auto">
                Select a target region and scan type on the left to begin your search for lost civilizations.
              </p>
              
              <div className="mt-12 w-full max-w-md grid grid-cols-3 gap-4 opacity-20">
                 {[1,2,3].map(i => (
                   <div key={i} className="space-y-2">
                      <div className="h-2 w-full bg-[#1a1a1a] rounded" />
                      <div className="h-2 w-2/3 bg-[#1a1a1a] rounded" />
                      <div className="h-12 w-full bg-[#1a1a1a] rounded-xl" />
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Removed duplicate X component */
