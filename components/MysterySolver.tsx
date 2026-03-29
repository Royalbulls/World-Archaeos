'use client';

import React, { useState } from 'react';
import { History, Search, Loader2, Globe, ExternalLink } from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import Markdown from 'react-markdown';

const SUGGESTIONS = [
  "Why did nobody escape the destruction of Pompeii?",
  "Evidence of unicorns in ancient Indian seals",
  "The mystery of the Great Flood in ancient civilizations",
  "Why was nobody buried in certain ancient cities?",
  "The world's oldest mystery: Göbekli Tepe",
  "Mesopotamian civilization's sudden decline"
];

export default function MysterySolver() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSolve = async (text: string) => {
    const searchQuery = text || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Investigate this historical mystery: ${searchQuery}. Use available historical records and archaeological findings. Discuss the 'why' and 'how', focusing on specific details like lack of burials, sudden abandonment, or unique artifacts like the Indus Valley seals.`,
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
      setResult({ text: "Error investigating mystery. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <h2 className="font-serif text-3xl mb-2">Historical Mysteries</h2>
        <p className="text-sm text-[#1a1a1a]/60 mb-6">
          Deep dive into the world&apos;s most enduring archaeological enigmas with grounded AI research.
        </p>

        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a mystery (e.g., 'The Indus Valley script mystery')..."
            className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1a1a1a] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <button
            onClick={() => handleSolve(query)}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-[#f5f2ed] px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Investigate'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(s);
                handleSolve(s);
              }}
              className="px-3 py-1.5 rounded-full bg-[#f5f2ed] text-[10px] font-medium opacity-60 hover:opacity-100 hover:bg-[#1a1a1a]/5 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <History className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-mono">Historical Investigation Report</span>
            </div>
            <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal">
              <Markdown>{result.text}</Markdown>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 h-fit">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Grounded Sources
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
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </a>
                  )
                ))
              ) : (
                <p className="text-xs opacity-50 italic">No specific web sources cited in this response.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
