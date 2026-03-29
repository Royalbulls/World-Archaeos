'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  Search, 
  Crosshair, 
  Database, 
  Pickaxe, 
  Gem, 
  Loader2, 
  ChevronRight, 
  X, 
  AlertTriangle,
  Compass,
  Eye,
  ScrollText
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';

// Fix for default marker icons in react-leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Site {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  probability: number;
  artifacts: string[];
  minerals: string[];
}

interface MissionData {
  narrative: string;
  region: string;
  sites: Site[];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function ArchaeosExplorer() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [researchingItem, setResearchingItem] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([29.9792, 31.1342]); // Default to Pyramids

  const startMission = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMission(null);
    setSelectedSite(null);
    setResearchResult(null);

    try {
      const ai = getGeminiModel();
      const prompt = `Develop a mystery-solving archaeological narrative based on the query: "${query}".
      Identify 3-5 potential sites of ancient cities or significant discoveries related to this query.
      
      The response MUST be a JSON object with the following structure:
      {
        "narrative": "A compelling, mystery-solving narrative (2-3 paragraphs) about discovering lost cities, deciphering ancient languages, or uncovering secrets related to the query.",
        "region": "The general region being explored",
        "sites": [
          {
            "id": "unique-string-id",
            "name": "Name of the potential site",
            "coordinates": [latitude, longitude],
            "description": "Why this site is significant based on satellite imagery and records.",
            "probability": 85, // Estimated probability of finding evidence (0-100)
            "artifacts": ["List of specific artifacts likely to be found"],
            "minerals": ["List of specific minerals, elements, or metals likely present"]
          }
        ]
      }
      
      Ensure coordinates are realistic for the region.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the Archaeos AI, an advanced archaeological analysis system that uses satellite imagery and historical records to identify potential excavation sites and generate engaging mystery narratives."
        }
      }));

      const rawText = response.text || '{}';
      const jsonText = rawText.match(/\{[\s\S]*\}/)?.[0] || rawText;
      const data = JSON.parse(jsonText) as MissionData;
      
      setMission(data);
      if (data.sites.length > 0) {
        setMapCenter(data.sites[0].coordinates);
      }
    } catch (error) {
      console.error("Failed to generate mission:", error);
      alert("Failed to initialize mission. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const researchItem = async (item: string, type: 'artifact' | 'mineral') => {
    setResearchingItem(item);
    setResearchResult(null);
    try {
      const ai = getGeminiModel();
      const prompt = `Research the archaeological and scientific significance of the ${type}: "${item}".
      Provide a concise but detailed analysis including:
      1. Historical context and usage in ancient civilizations.
      2. Scientific properties (if it's a mineral/metal).
      3. Why it might be found at the current site.
      
      Keep it under 3 paragraphs. Tone: Scientific and investigative.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      }));

      setResearchResult(response.text || "Research inconclusive.");
    } catch (error) {
      console.error("Research failed:", error);
      setResearchResult("Failed to access research databases.");
    } finally {
      setResearchingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Compass className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <MapIcon className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-3xl">Archaeos Explorer</h2>
          </div>
          <p className="text-sm opacity-70 max-w-2xl mb-6">
            Initiate satellite scans and analyze historical records to uncover lost cities and ancient mysteries.
          </p>

          <div className="flex gap-4 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Egyptian Pyramids, Lost City of Atlantis, Indus Valley"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-white/40"
              onKeyDown={(e) => e.key === 'Enter' && startMission()}
            />
            <button
              onClick={startMission}
              disabled={loading || !query.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Scan Region
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {mission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Narrative & Sites */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-emerald-600" />
                Mission Briefing
              </h3>
              <div className="prose prose-sm prose-emerald">
                <p className="text-sm text-gray-700 leading-relaxed">{mission.narrative}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-emerald-600" />
                Identified Sites
              </h3>
              <div className="space-y-3">
                {mission.sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setSelectedSite(site);
                      setMapCenter(site.coordinates);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all border ${
                      selectedSite?.id === site.id 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-[#f5f2ed] border-transparent hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-gray-900">{site.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        site.probability > 75 ? 'bg-green-100 text-green-700' : 
                        site.probability > 40 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {site.probability}% Match
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{site.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map & Site Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-[#1a1a1a]/5 h-[400px] relative overflow-hidden z-0">
              <MapContainer 
                center={mapCenter} 
                zoom={6} 
                className="w-full h-full rounded-[1.5rem]"
              >
                {/* Google Maps Satellite Imagery TileLayer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  maxZoom={20}
                />
                <MapUpdater center={mapCenter} />
                {mission.sites.map((site) => (
                  <Marker 
                    key={site.id} 
                    position={site.coordinates} 
                    icon={icon}
                    eventHandlers={{
                      click: () => setSelectedSite(site),
                    }}
                  >
                    <Popup>
                      <div className="font-sans">
                        <h3 className="font-bold text-sm">{site.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{site.probability}% Probability</p>
                        <div className="mt-2 flex flex-col gap-1">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${site.coordinates[0]},${site.coordinates[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <MapIcon className="w-3 h-3" /> View on Google Maps
                          </a>
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${site.coordinates[0]},${site.coordinates[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <Compass className="w-3 h-3" /> Get Directions
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              
              <div className="absolute top-4 right-4 z-[1000] bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Eye className="w-3 h-3 text-emerald-400" />
                Satellite Feed Active
              </div>
            </div>

            {/* Selected Site Details */}
            <AnimatePresence mode="wait">
              {selectedSite && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-serif text-2xl text-gray-900">{selectedSite.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{selectedSite.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Coordinates</div>
                      <div className="text-sm font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                        {selectedSite.coordinates[0].toFixed(4)}, {selectedSite.coordinates[1].toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Artifacts */}
                    <div className="bg-[#f5f2ed] rounded-xl p-5">
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-700 mb-4">
                        <Database className="w-4 h-4 text-emerald-600" />
                        Potential Artifacts
                      </h4>
                      <ul className="space-y-2">
                        {selectedSite.artifacts.map((artifact, idx) => (
                          <li key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm shadow-sm">
                            <span className="text-gray-800">{artifact}</span>
                            <button 
                              onClick={() => researchItem(artifact, 'artifact')}
                              className="text-emerald-600 hover:text-emerald-700 p-1"
                              title="Research Artifact"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Minerals */}
                    <div className="bg-[#f5f2ed] rounded-xl p-5">
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-700 mb-4">
                        <Pickaxe className="w-4 h-4 text-emerald-600" />
                        Geological Profile
                      </h4>
                      <ul className="space-y-2">
                        {selectedSite.minerals.map((mineral, idx) => (
                          <li key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm shadow-sm">
                            <span className="text-gray-800 flex items-center gap-2">
                              <Gem className="w-3 h-3 text-gray-400" />
                              {mineral}
                            </span>
                            <button 
                              onClick={() => researchItem(mineral, 'mineral')}
                              className="text-emerald-600 hover:text-emerald-700 p-1"
                              title="Research Mineral/Metal"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Research Modal */}
      <AnimatePresence>
        {(researchingItem || researchResult) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setResearchingItem(null); setResearchResult(null); }}
                className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">Deep Research</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Subject: {researchingItem}
                  </p>
                </div>
              </div>

              {researchResult ? (
                <div className="prose prose-sm prose-emerald max-w-none">
                  {researchResult.split('\n').map((para, idx) => (
                    <p key={idx} className="text-gray-700 leading-relaxed">{para}</p>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    Accessing Global Databases...
                  </p>
                  <p className="text-xs text-gray-400 mt-2 max-w-sm">
                    Cross-referencing historical records, geological surveys, and satellite telemetry for &quot;{researchingItem}&quot;.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
