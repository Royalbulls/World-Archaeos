'use client';

import React, { useState } from 'react';
import { Clock, Zap, Loader2, Sparkles, History, Eye } from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function TemporalReconstructor() {
  const [fragment, setFragment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleReconstruct = async () => {
    if (!fragment.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a Temporal Archaeologist. Given this 'old information' or fragment: "${fragment}", use your 'future sight' to reconstruct its complete history. Tell us what it was, how it was lost, and how it will be rediscovered in the future (e.g., in the year 2050 or 2100). Blend historical facts with speculative future archaeology.`,
      });

      setResult(response.text || "Reconstruction failed.");
    } catch (error) {
      console.error(error);
      setResult("Error in temporal reconstruction. The timeline is unstable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-purple-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-3xl">Temporal Reconstructor</h2>
            <p className="text-sm text-[#1a1a1a]/60">Bridge the gap between ancient fragments and future discoveries.</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <textarea
              value={fragment}
              onChange={(e) => setFragment(e.target.value)}
              placeholder="Enter a fragment of 'old information' (e.g., 'A broken bronze gear found in Antikythera' or 'A single line of Indus script')..."
              className="w-full h-32 bg-[#f5f2ed] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 transition-all resize-none"
            />
          </div>
          
          <button
            onClick={handleReconstruct}
            disabled={loading}
            className="w-full bg-purple-900 text-purple-50 py-4 rounded-2xl text-sm font-medium hover:bg-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Eye className="w-4 h-4" /> Reconstruct Timeline</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-24 h-24 text-purple-600" />
          </div>
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <History className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] uppercase tracking-widest font-mono">Temporal Reconstruction Report</span>
          </div>
          <div className="prose prose-sm max-w-none prose-purple prose-headings:font-serif prose-headings:font-normal">
            <Markdown>{result}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
