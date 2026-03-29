'use client';

import React, { useState } from 'react';
import { Pickaxe, Search, Loader2, Zap, Globe } from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function ResourceMapper() {
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!region.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the geological and historical potential for minerals and metals (like gold, copper, tin) in the region of: ${region}. Focus on areas where ancient civilizations (like Mesopotamia, Indus Valley, or Egypt) might have mined. Use historical records of ancient mines and modern geological data. Provide an 'Archaeological Resource Map' description.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResult({
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (error) {
      console.error(error);
      setResult({ text: "Error mapping resources. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <h2 className="font-serif text-3xl mb-2">Resource Mapper</h2>
        <p className="text-sm text-[#1a1a1a]/60 mb-6">
          Locate ancient mining sites and potential mineral deposits (Gold, Copper, Tin) using historical and geological grounding.
        </p>

        <div className="relative mb-6">
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Enter a region (e.g., 'Nubian Desert' or 'Baluchistan mountains')..."
            className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1a1a1a] transition-all"
          />
          <Pickaxe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-[#f5f2ed] px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Map Resources'}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-mono">Geological & Historical Resource Analysis</span>
            </div>
            <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal">
              <Markdown>{result.text}</Markdown>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 h-fit">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Research Sources
            </h3>
            <div className="space-y-3">
              {result.sources.length > 0 ? (
                result.sources.map((source: any, i: number) => (
                  source.web && (
                    <a
                      key={i}
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-[#f5f2ed] hover:bg-[#1a1a1a]/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate pr-2">{source.web.title || 'Source Link'}</span>
                      </div>
                    </a>
                  )
                ))
              ) : (
                <p className="text-xs opacity-50 italic">No specific web sources cited.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
