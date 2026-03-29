'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Box, 
  MapPin, 
  History, 
  Sparkles, 
  Shield, 
  Compass, 
  ChevronRight,
  Lock,
  Globe,
  Trophy
} from 'lucide-react';

interface Artifact {
  id: string;
  name: string;
  period: string;
  location: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  image: string;
  coordinates: { x: number; y: number };
  discovered: boolean;
}

const ARTIFACTS: Artifact[] = [
  {
    id: '1',
    name: 'Vedic Sun Dial',
    period: '1500 BCE',
    location: 'Kurukshetra Plains',
    description: 'A precise astronomical instrument used to track celestial movements with divine accuracy.',
    rarity: 'Rare',
    image: 'https://picsum.photos/seed/sundial/800/600',
    coordinates: { x: 25, y: 40 },
    discovered: false
  },
  {
    id: '2',
    name: 'Indus Seal of Pashupati',
    period: '2500 BCE',
    location: 'Mohenjo-daro Ruins',
    description: 'A steatite seal depicting a three-faced deity surrounded by animals, representing early spiritual mastery.',
    rarity: 'Legendary',
    image: 'https://picsum.photos/seed/seal/800/600',
    coordinates: { x: 60, y: 75 },
    discovered: false
  },
  {
    id: '3',
    name: 'Golden Chariot Wheel',
    period: 'Dvapara Yuga',
    location: 'Submerged Dwaraka',
    description: 'A fragment of a celestial vehicle, forged with alloys unknown to modern metallurgy.',
    rarity: 'Epic',
    image: 'https://picsum.photos/seed/wheel/800/600',
    coordinates: { x: 15, y: 85 },
    discovered: false
  },
  {
    id: '4',
    name: 'Saraswati Manuscript',
    period: 'Unknown',
    location: 'Himalayan Caves',
    description: 'Ancient birch bark scrolls containing lost hymns of the Saraswati river civilization.',
    rarity: 'Legendary',
    image: 'https://picsum.photos/seed/scroll/800/600',
    coordinates: { x: 80, y: 20 },
    discovered: false
  }
];

export default function ArtifactDiscovery() {
  const [scanning, setScanning] = useState(false);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discovered_artifacts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse artifacts", e);
        }
      }
    }
    return [];
  });
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [view, setView] = useState<'map' | 'collection'>('map');
  const [scanProgress, setScanProgress] = useState(0);

  const handleScan = () => {
    setScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          // Check for discovery
          const undiscovered = ARTIFACTS.filter(a => !discoveredIds.includes(a.id));
          if (undiscovered.length > 0 && Math.random() > 0.4) {
            const found = undiscovered[Math.floor(Math.random() * undiscovered.length)];
            discoverArtifact(found.id);
          }
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const discoverArtifact = (id: string) => {
    const newDiscovered = [...discoveredIds, id];
    setDiscoveredIds(newDiscovered);
    localStorage.setItem('discovered_artifacts', JSON.stringify(newDiscovered));
    setSelectedArtifact(ARTIFACTS.find(a => a.id === id) || null);
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#f5f2ed]">
                <Compass className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight">The Vault</h1>
            </div>
            <p className="text-[#1a1a1a]/60 font-medium">Discover and preserve the lost treasures of antiquity.</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-[#1a1a1a]/5 shadow-sm">
            <button 
              onClick={() => setView('map')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'map' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60'}`}
            >
              <Globe className="w-4 h-4" />
              Discovery Map
            </button>
            <button 
              onClick={() => setView('collection')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'collection' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60'}`}
            >
              <Box className="w-4 h-4" />
              My Collection ({discoveredIds.length})
            </button>
          </div>
        </div>

        {view === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Area */}
            <div className="lg:col-span-2 relative aspect-square md:aspect-video bg-[#1a1a1a] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
              {/* Grid Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
              />
              
              {/* Scanning Effect */}
              <AnimatePresence>
                {scanning && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <div className="relative w-48 h-48 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="4"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="#fff"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={552}
                            animate={{ strokeDashoffset: 552 - (552 * scanProgress) / 100 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Search className="w-12 h-12 text-white animate-pulse" />
                        </div>
                      </div>
                      <p className="text-white font-mono text-xs uppercase tracking-[0.3em]">Scanning Quantum Frequencies...</p>
                      <p className="text-white/40 font-mono text-[10px] mt-2">{scanProgress}% COMPLETE</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artifact Markers */}
              {ARTIFACTS.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => discoveredIds.includes(artifact.id) && setSelectedArtifact(artifact)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110"
                  style={{ left: `${artifact.coordinates.x}%`, top: `${artifact.coordinates.y}%` }}
                >
                  {discoveredIds.includes(artifact.id) ? (
                    <div className="relative">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1a1a]">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-xl border border-gray-100 whitespace-nowrap">
                        <p className="text-[8px] font-bold uppercase tracking-widest">{artifact.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-white/10 rounded-full border border-white/20 animate-ping" />
                  )}
                </button>
              ))}

              {/* Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <button
                  disabled={scanning}
                  onClick={handleScan}
                  className="px-8 py-4 bg-white text-[#1a1a1a] rounded-full font-bold uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  <Search className="w-5 h-5" />
                  Initiate Scan
                </button>
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-[#1a1a1a]/5 shadow-sm">
                <h3 className="font-serif text-2xl font-bold mb-4">Discovery Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Total Found</span>
                    </div>
                    <span className="text-2xl font-serif font-bold">{discoveredIds.length} / {ARTIFACTS.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Regions Explored</span>
                    </div>
                    <span className="text-2xl font-serif font-bold">4</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] p-8 rounded-[2rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <History className="w-24 h-24" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-2">Historical Log</h3>
                <p className="text-white/60 text-sm mb-6">Recent discoveries across the global network.</p>
                <div className="space-y-3">
                  {discoveredIds.slice(-3).reverse().map(id => {
                    const art = ARTIFACTS.find(a => a.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{art?.name}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-widest">{art?.location}</p>
                        </div>
                      </div>
                    );
                  })}
                  {discoveredIds.length === 0 && (
                    <p className="text-center py-4 text-white/30 text-xs italic">No artifacts discovered yet...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ARTIFACTS.map((artifact) => {
              const isDiscovered = discoveredIds.includes(artifact.id);
              return (
                <motion.div
                  key={artifact.id}
                  layoutId={artifact.id}
                  onClick={() => isDiscovered && setSelectedArtifact(artifact)}
                  className={`group relative aspect-[3/4] rounded-[2rem] overflow-hidden border-4 transition-all cursor-pointer ${
                    isDiscovered 
                      ? 'border-white shadow-xl hover:-translate-y-2' 
                      : 'border-dashed border-[#1a1a1a]/10 bg-gray-100/50'
                  }`}
                >
                  {isDiscovered ? (
                    <>
                      <img 
                        src={artifact.image} 
                        alt={artifact.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                            artifact.rarity === 'Legendary' ? 'bg-amber-500' :
                            artifact.rarity === 'Epic' ? 'bg-purple-500' :
                            artifact.rarity === 'Rare' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {artifact.rarity}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl font-bold leading-tight mb-1">{artifact.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest opacity-60">{artifact.period}</p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <Lock className="w-12 h-12 text-[#1a1a1a]/10 mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/30">Unknown Artifact</p>
                      <p className="text-[8px] uppercase tracking-widest text-[#1a1a1a]/20 mt-2">Scan the map to discover</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Artifact Detail Modal */}
        <AnimatePresence>
          {selectedArtifact && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedArtifact(null)}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                >
                  <div className="md:w-1/2 relative aspect-square md:aspect-auto">
                    <img 
                      src={selectedArtifact.image} 
                      alt={selectedArtifact.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg ${
                        selectedArtifact.rarity === 'Legendary' ? 'bg-amber-500' :
                        selectedArtifact.rarity === 'Epic' ? 'bg-purple-500' :
                        selectedArtifact.rarity === 'Rare' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {selectedArtifact.rarity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">{selectedArtifact.period}</span>
                      </div>
                      <h2 className="font-serif text-4xl font-bold mb-6 leading-tight">{selectedArtifact.name}</h2>
                      
                      <div className="space-y-6 mb-8">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Discovery Location</p>
                            <p className="text-sm font-medium">{selectedArtifact.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Historical Context</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{selectedArtifact.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedArtifact(null)}
                      className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      Close Archive
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
