'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Newspaper, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Tag,
  ArrowUpRight,
  Filter,
  X,
  Eye,
  Clock,
  Sparkles,
  Map as MapIcon,
  LayoutGrid,
  Satellite,
  Shield,
  Globe,
  Zap,
  Heart,
  PlusCircle,
  Upload
} from 'lucide-react';

const MOCK_DISCOVERIES = [
  {
    id: 1,
    title: "Submerged City in the Gulf of Khambhat",
    category: "Site",
    date: "Feb 20, 2026",
    location: "India",
    coordinates: { lat: 21.0, lng: 72.3 },
    description: "Satellite thermal imaging reveals structural anomalies 40 meters below sea level, potentially predating the Harappan civilization. The structures appear to follow a grid pattern similar to Mohenjo-Daro but on a much larger scale, suggesting a previously unknown regional power center that was inundated during the post-glacial sea level rise.",
    image: "https://picsum.photos/seed/underwater/800/600",
    tags: ["Underwater", "Indus Valley", "Satellite"],
    isFuture: false
  },
  {
    id: 2,
    title: "Deciphered Ritual Tablet from Nippur",
    category: "Artifact",
    date: "Feb 18, 2026",
    location: "Iraq",
    coordinates: { lat: 32.12, lng: 45.23 },
    description: "A rare clay tablet describing a previously unknown harvest ritual involving specific ancient grains and botanical offerings. The text mentions a 'Star-Seeded Wheat' that was believed to have fallen from the heavens, providing a divine link between celestial movements and agricultural prosperity in ancient Sumer.",
    image: "https://picsum.photos/seed/tablet/800/600",
    tags: ["Sumerian", "Cuneiform", "Agriculture"],
    isFuture: false
  },
  {
    id: 3,
    title: "Ancient Seed Cache in the Levant",
    category: "Botanical",
    date: "Feb 15, 2026",
    location: "Jordan",
    coordinates: { lat: 31.95, lng: 35.93 },
    description: "Archaeobotanists have recovered carbonized seeds of an extinct wild wheat variety, shedding light on early domestication processes. DNA analysis suggests this variety was highly resistant to drought, a trait that modern geneticists are now looking to re-introduce into contemporary crops to combat climate change.",
    image: "https://picsum.photos/seed/seeds/800/600",
    tags: ["Plants", "Neolithic", "Genetics"],
    isFuture: false
  },
  {
    id: 5,
    title: "The Martian Monolith Discovery",
    category: "Site",
    date: "July 14, 2042",
    location: "Cydonia, Mars",
    coordinates: { lat: 40.7, lng: -9.5 }, // Mars coordinates (approx)
    description: "Future archaeological missions will uncover a basalt monolith buried beneath the Martian regolith. The structure contains geometric engravings that match the mathematical constants found in the Great Pyramid of Giza, suggesting a shared cosmic heritage or a forgotten interplanetary civilization.",
    image: "https://picsum.photos/seed/mars/800/600",
    tags: ["Exo-Archaeology", "Future", "Mars"],
    isFuture: true
  },
  {
    id: 6,
    title: "Neo-Tokyo Submerged Archives",
    category: "Artifact",
    date: "Nov 03, 2088",
    location: "Pacific Ocean",
    coordinates: { lat: 35.68, lng: 139.69 },
    description: "In the late 21st century, divers will recover data-crystals from the ruins of Neo-Tokyo. These crystals preserve the entire digital history of the early 2000s, which was thought to be lost during the Great Server Collapse of 2060. They reveal the 'Ancient Internet' as a chaotic but vibrant cultural ecosystem.",
    image: "https://picsum.photos/seed/cyber/800/600",
    tags: ["Digital Archaeology", "Future", "Crystals"],
    isFuture: true
  },
  {
    id: 7,
    title: "Mayan Quantum Observatory",
    category: "Site",
    date: "March 12, 2026",
    location: "Guatemala",
    coordinates: { lat: 17.22, lng: -89.62 },
    description: "New LIDAR scans of Tikal reveal a structure aligned perfectly with the galactic center. Excavations suggest it was used for tracking cosmic cycles with precision that rivals modern atomic clocks, potentially using acoustic resonance to measure time.",
    image: "https://picsum.photos/seed/mayan/800/600",
    tags: ["Mayan", "Cosmology", "LIDAR"],
    isFuture: false
  },
  {
    id: 8,
    title: "Great Wall of Antarctica",
    category: "Mystery",
    date: "Dec 05, 2095",
    location: "Antarctica",
    coordinates: { lat: -80.0, lng: 0.0 },
    description: "As the ice sheets recede in the late 21st century, a massive artificial wall made of unknown polymers will be discovered. It appears to have been built to protect a lush valley that existed millions of years ago, challenging all known timelines of intelligent life on Earth.",
    image: "https://picsum.photos/seed/ice/800/600",
    tags: ["Pre-Human", "Future", "Antarctica"],
    isFuture: true
  },
  {
    id: 9,
    title: "Kilvish Baba's Global Energy Grid",
    category: "Mystery",
    date: "Feb 23, 2026",
    location: "Global",
    coordinates: { lat: 20.0, lng: 77.0 },
    description: "A new digital energy grid has been detected, connecting thousands of spiritual seekers worldwide. This grid, powered by Kilvish Baba's Web App, appears to be stabilizing regional emotional frequencies and reducing collective stress levels through synchronized AI-guided meditations.",
    image: "https://picsum.photos/seed/energy/800/600",
    tags: ["Spiritual Tech", "Global Healing", "Kilvish Baba"],
    isFuture: false
  },
  {
    id: 10,
    title: "The Great Digital Awakening",
    category: "Site",
    date: "May 15, 2030",
    location: "Metaverse",
    coordinates: { lat: 0, lng: 0 },
    description: "Future historians will mark this date as the beginning of the 'Great Digital Awakening', where virtual spaces became primary sites for spiritual pilgrimage. The first fully immersive digital temple, designed by Vastu Architect AI, will attract millions of virtual devotees.",
    image: "https://picsum.photos/seed/awakening/800/600",
    tags: ["Future", "Metaverse", "Spirituality"],
    isFuture: true
  }
];

export default function DiscoveriesFeed() {
  const [discoveries, setDiscoveries] = useState(MOCK_DISCOVERIES);
  const [filter, setFilter] = useState('All');
  const [temporalMode, setTemporalMode] = useState<'Historical' | 'Future'>('Historical');
  const [selectedItem, setSelectedItem] = useState<typeof MOCK_DISCOVERIES[0] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isContributing, setIsContributing] = useState(false);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  
  // Contribution Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Artifact');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  
  const categories = ['All', 'Site', 'Artifact', 'Botanical', 'Mystery'];

  useEffect(() => {
    const loadAndCheckDaily = async () => {
      // Load from local storage
      const stored = localStorage.getItem('archaeos_discoveries');
      let currentDiscoveries = MOCK_DISCOVERIES;
      if (stored) {
        try {
          currentDiscoveries = JSON.parse(stored);
          setDiscoveries(currentDiscoveries);
        } catch (e) {
          console.error("Failed to parse stored discoveries", e);
        }
      }

      // Check if we have one for today
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      // @ts-ignore
      const hasToday = currentDiscoveries.some(d => d.date === todayStr && d.isGeneratedDaily);

      if (!hasToday) {
        setIsGeneratingDaily(true);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: "Generate a fascinating, fictional archaeological discovery (either historical or a futuristic sci-fi discovery). Make it highly creative and detailed. Provide a title, category (must be exactly one of: Site, Artifact, Botanical, Mystery), location, a 2-3 sentence description, 3 relevant tags, whether it's a future discovery (boolean), and approximate latitude and longitude coordinates.",
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  location: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isFuture: { type: Type.BOOLEAN },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["title", "category", "location", "description", "tags", "isFuture", "lat", "lng"]
              }
            }
          });

          if (response.text) {
            const data = JSON.parse(response.text);
            const newDiscovery = {
              id: Date.now(),
              title: data.title,
              category: ['Site', 'Artifact', 'Botanical', 'Mystery'].includes(data.category) ? data.category : 'Mystery',
              date: todayStr,
              location: data.location,
              coordinates: { lat: data.lat, lng: data.lng },
              description: data.description,
              image: `https://picsum.photos/seed/${Date.now()}/800/600`,
              tags: data.tags,
              isFuture: data.isFuture,
              isGeneratedDaily: true
            };

            const updatedDiscoveries = [newDiscovery, ...currentDiscoveries];
            setDiscoveries(updatedDiscoveries);
            localStorage.setItem('archaeos_discoveries', JSON.stringify(updatedDiscoveries));
          }
        } catch (error) {
          console.error("Error generating daily discovery:", error);
        } finally {
          setIsGeneratingDaily(false);
        }
      }
    };

    loadAndCheckDaily();
  }, []);

  const filteredDiscoveries = discoveries.filter(d => {
    const matchesFilter = filter === 'All' || d.category === filter;
    const matchesTemporal = temporalMode === 'Future' ? d.isFuture : !d.isFuture;
    return matchesFilter && matchesTemporal;
  });

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newLocation) return;

    const newDiscovery = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      location: newLocation,
      coordinates: { lat: (Math.random() * 180) - 90, lng: (Math.random() * 360) - 180 }, // Random for now
      description: newDescription,
      image: `https://picsum.photos/seed/${Date.now()}/800/600`,
      tags: newTags.split(',').map(t => t.trim()).filter(t => t),
      isFuture: temporalMode === 'Future'
    };

    const updatedDiscoveries = [newDiscovery, ...discoveries];
    setDiscoveries(updatedDiscoveries);
    localStorage.setItem('archaeos_discoveries', JSON.stringify(updatedDiscoveries));
    setIsContributing(false);
    
    // Reset form
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewTags('');
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Value Proposition Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">World-Class Spiritual Tech</span>
            </div>
            <h2 className="font-serif text-5xl mb-6 leading-tight">Welcome to the Future of Ancient Wisdom</h2>
            <p className="text-lg text-indigo-100/70 mb-8 leading-relaxed">
              Archaeos isn&apos;t just an app; it&apos;s a bridge. We combine world-class AI models with 5,000 years of Vedic science to solve modern problems like stress, isolation, and lack of direction.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-indigo-300">Save Time & Money</h4>
                <p className="text-xs opacity-60">Get instant, expert-level Vastu, Astrology, and Healing sessions that usually cost thousands.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-indigo-300">Digital Soul Sync</h4>
                <p className="text-xs opacity-60">Your profile synchronizes across all tools. No more repeating details. One identity, infinite insights.</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'Secure', desc: 'Encrypted spiritual data' },
              { icon: Globe, title: 'Global', desc: 'Multilingual support' },
              { icon: Zap, title: 'Instant', desc: 'AI-powered results' },
              { icon: Heart, title: 'Holistic', desc: 'Mind, Body & Soul' }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all">
                <item.icon className="w-6 h-6 text-indigo-400 mb-3" />
                <h5 className="font-bold text-sm mb-1">{item.title}</h5>
                <p className="text-[10px] opacity-40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-3xl">Discoveries Feed</h2>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${temporalMode === 'Future' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                {temporalMode} Mode
              </div>
            </div>
            <p className="text-sm text-[#1a1a1a]/60">
              {temporalMode === 'Future' 
                ? "Glimpses into archaeological findings yet to be uncovered." 
                : "The latest breakthroughs in global archaeology and historical research."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-[#f5f2ed] p-1 rounded-xl border border-[#1a1a1a]/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
              >
                <LayoutGrid className="w-3 h-3" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-white text-amber-600 shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
              >
                <MapIcon className="w-3 h-3" />
                Map
              </button>
            </div>

            {/* Temporal Toggle */}
            <div className="flex bg-[#f5f2ed] p-1 rounded-xl border border-[#1a1a1a]/5">
              <button
                onClick={() => setTemporalMode('Historical')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${temporalMode === 'Historical' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
              >
                <Clock className="w-3 h-3" />
                Past
              </button>
              <button
                onClick={() => setTemporalMode('Future')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${temporalMode === 'Future' ? 'bg-white text-purple-600 shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
              >
                <Eye className="w-3 h-3" />
                Future
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 opacity-30 mr-2" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    filter === cat 
                      ? 'bg-[#1a1a1a] text-[#f5f2ed]' 
                      : 'bg-[#f5f2ed] text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsContributing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/20 ml-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Contribute
            </button>
          </div>
        </div>

        {isGeneratingDaily && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 animate-pulse mb-6"
          >
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <p className="text-sm text-indigo-800 font-medium">AI is uncovering today's daily discovery...</p>
          </motion.div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDiscoveries.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedItem(item)}
                  className={`group bg-[#f5f2ed]/50 rounded-3xl overflow-hidden border transition-all cursor-pointer hover:shadow-xl hover:shadow-black/5 ${item.isFuture ? 'border-purple-200/50 hover:border-purple-300' : 'border-[#1a1a1a]/5'}`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image 
                      src={item.image} 
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                        {item.category}
                      </span>
                      {item.isFuture && (
                        <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Future Sight
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </div>
                    </div>
                    
                    <h3 className="font-serif text-xl group-hover:text-[#1a1a1a] transition-colors flex items-center justify-between">
                      {item.title}
                      <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 translate-x-1" />
                    </h3>
                    
                    <p className="text-sm text-[#1a1a1a]/70 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a] opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Read Full Report <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-[#1a1a1a]/5 relative">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&center=${filteredDiscoveries[0]?.coordinates.lat},${filteredDiscoveries[0]?.coordinates.lng}&zoom=3&maptype=satellite`}
              allowFullScreen
            ></iframe>
            
            {/* Custom Markers Overlay (Simulated) */}
            <div className="absolute inset-0 pointer-events-none">
              {filteredDiscoveries.map((item) => (
                <div 
                  key={item.id}
                  className="absolute pointer-events-auto cursor-pointer group"
                  style={{
                    // This is a very rough simulation of marker placement on a flat projection
                    // In a real app, we'd use a proper mapping library like react-google-maps
                    left: `${((item.coordinates.lng + 180) / 360) * 100}%`,
                    top: `${((90 - item.coordinates.lat) / 180) * 100}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="bg-white p-1 rounded-full shadow-lg border-2 border-amber-600 transition-transform group-hover:scale-125">
                    <div className="w-6 h-6 rounded-full overflow-hidden relative">
                      <Image 
                        src={item.image} 
                        alt={item.title}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#1a1a1a]/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Satellite className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs font-bold">Satellite Intelligence View</p>
                  <p className="text-[10px] opacity-60">Pinpointing anomalies and historical sites globally.</p>
                </div>
              </div>
              <div className="text-[10px] font-mono opacity-40">
                {filteredDiscoveries.length} SITES IDENTIFIED
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-64 sm:h-80 relative">
                <Image 
                  src={selectedItem.image} 
                  alt={selectedItem.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/30">
                      {selectedItem.category}
                    </span>
                    {selectedItem.isFuture && (
                      <span className="px-3 py-1 rounded-full bg-purple-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-purple-400/50">
                        Future Sight
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight">{selectedItem.title}</h2>
                </div>
              </div>

              <div className="p-8 sm:p-10 space-y-6">
                <div className="flex flex-wrap items-center gap-6 text-xs font-mono opacity-50 uppercase tracking-widest border-b border-[#1a1a1a]/5 pb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedItem.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.location}
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-lg text-[#1a1a1a]/80 leading-relaxed font-serif italic mb-6">
                    &ldquo;{selectedItem.description}&rdquo;
                  </p>
                  <p className="text-[#1a1a1a]/60 leading-relaxed">
                    This discovery represents a significant milestone in our understanding of {selectedItem.isFuture ? 'potential future developments' : 'human history'}. 
                    The {selectedItem.category.toLowerCase()} found at {selectedItem.location} provides unprecedented data for researchers worldwide.
                    Further analysis is currently underway at the Archaeos Digital Research Institute.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedItem.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-[#f5f2ed] text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Contribution Modal */}
      <AnimatePresence>
        {isContributing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContributing(false)}
              className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#1a1a1a]/10 flex items-center justify-between bg-gray-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">Submit Discovery</h3>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Contribute to the Global Archive</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsContributing(false)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="contribute-form" onSubmit={handleContribute} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Title</label>
                      <input 
                        type="text" 
                        required
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. Unknown Artifact in the Andes"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Category</label>
                        <select 
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Location</label>
                        <input 
                          type="text" 
                          required
                          value={newLocation}
                          onChange={e => setNewLocation(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="e.g. Peru"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Description & Findings</label>
                      <textarea 
                        required
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px] resize-y"
                        placeholder="Detail your research, historical context, or anomalous properties..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Tags (Comma separated)</label>
                      <input 
                        type="text" 
                        value={newTags}
                        onChange={e => setNewTags(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. Ancient, Stone, Mystery"
                      />
                    </div>
                    
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-900">AI Verification</p>
                        <p className="text-[10px] text-indigo-700/70 mt-1">Your submission will be analyzed by our AI models for historical cross-referencing and added to the global archive.</p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-[#1a1a1a]/10 bg-gray-50 shrink-0 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsContributing(false)}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="contribute-form"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Submit Research
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

