'use client';

import React, { useState } from 'react';
import { Loader2, FileText, TrendingUp, Users, Lightbulb, Copy, Check, LayoutTemplate } from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function AppBlueprintGenerator() {
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateBlueprint = async () => {
    setLoading(true);
    setBlueprint(null);

    try {
      const ai = getGeminiModel();
      const prompt = `
        You are an expert App Architect, Product Manager, and Market Analyst.
        Generate a comprehensive App Blueprint and Market Analysis for the "World Archaeos Ancient Civilization Suite".
        
        ${focusArea ? `Specific Focus / Target Audience requested by user: ${focusArea}` : 'Provide a general, holistic overview.'}
        
        The blueprint MUST include the following detailed sections:
        
        1. **Full App Blueprint**: 
           - Core architecture and vision.
           - Key modules (e.g., Evolution Core, Site Explorer, Artifact Lab, Mystic Oracle, etc.).
           - Technical stack recommendations (Next.js, Tailwind, Google AI Studio / Gemini API, Leaflet Maps).
        
        2. **How the App Works**: 
           - Step-by-step user journey (from onboarding to daily use).
           - Data flow and AI integration mechanics.
           - How the "Self-Growth" (Tool Forge) and continuous evolution mechanics operate.
        
        3. **Market Analysis**: 
           - Target demographics (Historians, Students, Spiritual Seekers, Gamers, General Public).
           - Competitor analysis (What exists vs. Why Archaeos is unique).
           - Market trends in EdTech, AI, and Cultural Heritage.
           - Potential monetization strategies (Freemium, B2B Education licensing, Premium API access).
        
        4. **Problems Solved for People**: 
           - Explicitly detail how the "World Archaeos Ancient Civilization Suite" solves real-world problems.
           - Examples: Making history accessible and interactive, preserving cultural heritage digitally, providing personalized spiritual/historical guidance, overcoming language barriers in ancient texts, and offering a unified platform for disparate historical tools.
        
        Format the output in clean, professional, and highly readable Markdown. Use headings, bullet points, and bold text for emphasis.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a master product strategist and technical architect. Deliver high-value, actionable business and technical blueprints."
        }
      }));

      setBlueprint(response.text || "Failed to generate blueprint.");
    } catch (error) {
      console.error("Blueprint Generation Error:", error);
      setBlueprint("An error occurred while generating the blueprint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (blueprint) {
      navigator.clipboard.writeText(blueprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <LayoutTemplate className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-3xl">App Blueprint Generator</h2>
          </div>
          <p className="text-sm opacity-70 max-w-2xl">
            Generate a comprehensive architectural blueprint, market analysis, and problem-solving strategy for the World Archaeos Suite using Google AI Studio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Generator Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Specific Focus (Optional)
                </label>
                <textarea
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g., Focus heavily on the educational market and student engagement..."
                  className="w-full h-32 bg-[#f5f2ed] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={generateBlueprint}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Full Blueprint
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#1a1a1a]/5 flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Market Analysis</h4>
                <p className="text-xs text-gray-500">Identifies target demographics, competitors, and monetization strategies.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#1a1a1a]/5 flex items-start gap-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Problem Solving</h4>
                <p className="text-xs text-gray-500">Articulates exactly how Archaeos improves lives and solves real-world issues.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Output Document */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-[#1a1a1a]/5 pb-4">
              <h3 className="font-serif text-2xl">World Archaeos Blueprint</h3>
              {blueprint && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f5f2ed] hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Document'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin mb-6 text-emerald-600" />
                  <p className="font-serif text-2xl italic">Architecting Blueprint...</p>
                  <p className="text-sm mt-2 max-w-md">Analyzing market trends, structuring app modules, and defining problem-solving strategies via Google AI Studio.</p>
                </div>
              ) : blueprint ? (
                <div className="prose prose-emerald max-w-none">
                  <Markdown>{blueprint}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                  <LayoutTemplate className="w-20 h-20 mb-6" />
                  <p className="font-serif text-3xl italic">Ready to Generate</p>
                  <p className="text-sm mt-4 max-w-md">Click the generate button to create a comprehensive business and technical blueprint for the World Archaeos Suite.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
