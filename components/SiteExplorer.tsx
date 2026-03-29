'use client';

import React, { useState } from 'react';
import { Search, MapPin, Satellite, Loader2, ExternalLink, Globe } from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function SiteExplorer({ addResearch }: { addResearch?: (topic: string, tool: string, status: 'started' | 'in-progress' | 'completed') => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel("gemini-2.5-flash"); // Maps grounding supported in 2.5
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find potential archaeological sites or ancient ruins related to: ${query}. Focus on locations that might have been detected via satellite or are historically significant but less explored. Provide specific coordinates if possible and describe the significance.`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      }));

      setResult({
        text: response.text,
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });

      // Save to profile
      if (addResearch) {
        addResearch(query, "Site Explorer", "completed");
      }

    } catch (error) {
      console.error(error);
      setResult({ text: "Error searching for sites. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getMapUrl = () => {
    if (!result || result.grounding.length === 0) {
      return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&center=20,0&zoom=2&maptype=${mapType}`;
    }
    
    const firstPlace = result.grounding.find((c: any) => c.maps);
    if (firstPlace) {
      // If we have a specific place, we can try to center on it
      // However, embed API works better with place ID or coordinates
      // For now, we'll use the search view centered on the first result's title if available
      return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&q=${encodeURIComponent(firstPlace.maps.title)}&maptype=${mapType}&zoom=12`;
    }

    return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&center=20,0&zoom=2&maptype=${mapType}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-3xl mb-2">Site Explorer</h2>
            <p className="text-sm text-[#1a1a1a]/60">
              Locate ancient cities, ruins, and satellite anomalies using Google Maps grounding.
            </p>
          </div>
          
          <div className="flex bg-[#f5f2ed] p-1 rounded-xl border border-[#1a1a1a]/5">
            <button
              onClick={() => setMapType('roadmap')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mapType === 'roadmap' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
            >
              <Globe className="w-3 h-3" />
              Map
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mapType === 'satellite' ? 'bg-white text-amber-600 shadow-sm' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}
            >
              <Satellite className="w-3 h-3" />
              Satellite
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Lost cities in Mesopotamia' or 'Indus Valley satellite anomalies'"
            className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1a1a1a] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <button
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-[#f5f2ed] px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Explore'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#1a1a1a]/5 h-[500px] relative">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={getMapUrl()}
              allowFullScreen
            ></iframe>
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
              </div>
            )}
          </div>

          {result && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center gap-2 mb-4 opacity-50">
                <Satellite className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest font-mono">Satellite Intelligence Report</span>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal">
                <Markdown>{result.text}</Markdown>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              Locations Found
            </h3>
            <div className="space-y-3">
              {result && result.grounding && result.grounding.length > 0 ? (
                result.grounding.map((chunk: any, i: number) => (
                  chunk.maps && (
                    <a
                      key={i}
                      href={chunk.maps.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-[#f5f2ed] hover:bg-[#1a1a1a]/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate pr-2">{chunk.maps.title || 'View on Maps'}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </a>
                  )
                ))
              ) : (
                <div className="py-12 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-2xl">
                  <Globe className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] uppercase tracking-widest font-mono">No sites explored yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-3xl p-6 shadow-xl">
            <h3 className="font-serif text-lg mb-3">Expedition Planning</h3>
            <p className="text-xs opacity-70 leading-relaxed mb-4">
              Use the satellite view to identify structural anomalies, ancient road networks, or vegetation patterns that might indicate buried ruins.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Thermal Anomalies
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Subsurface Moisture
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Crop Marks
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
