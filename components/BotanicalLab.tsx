'use client';

import React, { useState } from 'react';
import { Leaf, Sprout, Search, Loader2, Sparkles, Microscope } from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function BotanicalLab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following ancient plant or agricultural query: ${query}. Focus on archaeobotany, ancient farming techniques, extinct plant species, or the role of flora in ancient civilizations (e.g., medicinal uses, ritual offerings, or diet in Mesopotamia, Egypt, or the Indus Valley). Describe the significance of specific seeds or pollen if mentioned.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || "Analysis failed.");
    } catch (error) {
      console.error(error);
      setResult("Error analyzing botanical data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-3xl">Botanical Lab</h2>
            <p className="text-sm text-[#1a1a1a]/60">Explore ancient flora, agricultural history, and archaeobotany.</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a plant name, ancient crop, or agricultural mystery (e.g., 'Ancient wild wheat in the Levant' or 'Medicinal plants in Sumerian texts')..."
              className="w-full h-32 bg-[#f5f2ed] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-emerald-900 text-emerald-50 py-4 rounded-2xl text-sm font-medium hover:bg-emerald-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Microscope className="w-4 h-4" /> Analyze Flora</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] uppercase tracking-widest font-mono">Archaeobotanical Report</span>
          </div>
          <div className="prose prose-sm max-none prose-emerald prose-headings:font-serif prose-headings:font-normal">
            <Markdown>{result}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
