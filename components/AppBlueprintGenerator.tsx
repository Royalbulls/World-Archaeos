'use client';

import React, { useState, useRef } from 'react';
import { 
  Loader2, 
  FileText, 
  TrendingUp, 
  Copy, 
  Check, 
  LayoutTemplate, 
  Cpu, 
  DollarSign, 
  Target, 
  Zap,
  ChevronRight,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { getGeminiClient, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function AppBlueprintGenerator() {
  const [appIdea, setAppIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const statusMessages = [
    "Analyzing market trends...",
    "Structuring architecture...",
    "Selecting tech stack...",
    "Defining monetization strategies...",
    "Generating detailed blueprint...",
    "Finalizing documentation..."
  ];

  const generateBlueprint = async () => {
    if (!appIdea.trim()) return;
    
    setLoading(true);
    setBlueprint(null);
    setStatusMessage(statusMessages[0]);

    const interval = setInterval(() => {
      setStatusMessage(prev => {
        const currentIndex = statusMessages.indexOf(prev);
        return statusMessages[(currentIndex + 1) % statusMessages.length];
      });
    }, 3000);

    try {
      const ai = getGeminiClient();
      const prompt = `
        You are a world-class Product Strategist, Technical Architect, and Market Analyst.
        Generate a comprehensive, production-ready App Blueprint for the following application idea:
        
        APP IDEA: "${appIdea}"
        
        The blueprint MUST be detailed and include the following sections:
        
        1. **Executive Summary**: A high-level overview of the app's value proposition.
        
        2. **Architecture**: 
           - System design (e.g., Microservices vs. Monolith).
           - Frontend/Backend separation.
           - Database schema overview.
           - Third-party integrations (APIs, Webhooks).
        
        3. **Technical Stack**: 
           - Recommended languages, frameworks, and libraries.
           - Infrastructure (Cloud provider, CI/CD, Hosting).
           - Security considerations (Auth, Encryption).
        
        4. **Market Analysis**: 
           - Target audience demographics and psychographics.
           - Competitive landscape (Top 3 competitors and your unique differentiator).
           - Market size and growth potential.
        
        5. **Monetization Strategies**: 
           - Primary and secondary revenue streams (e.g., Subscription, Ads, In-app purchases, B2B licensing).
           - Pricing model recommendations.
        
        6. **Roadmap & MVP**: 
           - Phase 1 (MVP) features.
           - Phase 2 & 3 expansion plans.
        
        Format the output in clean, professional, and highly readable Markdown. Use clear headings, bullet points, and bold text for emphasis.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a master product strategist and technical architect. Deliver high-value, actionable business and technical blueprints. Use professional tone and structured formatting."
        }
      }));

      setBlueprint(response.text || "Failed to generate blueprint.");
      
      // Scroll to result
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error("Blueprint Generation Error:", error);
      setBlueprint("An error occurred while generating the blueprint. Please try again.");
    } finally {
      clearInterval(interval);
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

  const downloadAsMarkdown = () => {
    if (!blueprint) return;
    const blob = new Blob([blueprint], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-blueprint-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Hero Section */}
      <section className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <LayoutTemplate className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            Turn your vision into a <span className="text-indigo-600">Production Blueprint</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Describe your app idea, and our AI architect will generate a comprehensive technical, business, and market strategy to help you build and scale.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <textarea
                value={appIdea}
                onChange={(e) => setAppIdea(e.target.value)}
                placeholder="Describe your app idea (e.g., A decentralized marketplace for local farmers...)"
                className="w-full h-32 md:h-40 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none shadow-inner"
              />
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={generateBlueprint}
              disabled={loading || !appIdea.trim()}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? 'Architecting...' : 'Generate Blueprint'}
            </button>
            <button 
              onClick={() => setAppIdea("A mobile app that uses AI to help users identify and care for indoor plants, including a community marketplace for cuttings.")}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-all text-sm"
            >
              Try Example
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {!blueprint && !loading && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Cpu, title: "Architecture", desc: "Scalable system design and database schemas.", color: "bg-blue-50 text-blue-600" },
            { icon: TrendingUp, title: "Market Analysis", desc: "Demographics, competitors, and trends.", color: "bg-emerald-50 text-emerald-600" },
            { icon: DollarSign, title: "Monetization", desc: "Revenue streams and pricing models.", color: "bg-amber-50 text-amber-600" },
            { icon: Target, title: "MVP Roadmap", desc: "Prioritized features for your first launch.", color: "bg-purple-50 text-purple-600" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <LayoutTemplate className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-gray-900">{statusMessage}</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Our AI is synthesizing complex data to build your custom application strategy.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Section */}
      <div ref={scrollRef}>
        <AnimatePresence>
          {blueprint && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Toolbar */}
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Application Blueprint</h2>
                    <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all text-sm font-medium"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadAsMarkdown}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all text-sm font-medium">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-12">
                <div className="prose prose-indigo max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:text-gray-600 prose-li:text-gray-600">
                  <Markdown>{blueprint}</Markdown>
                </div>
                
                <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-400 italic">
                    This blueprint is an AI-generated recommendation. Always validate technical choices with your engineering team.
                  </p>
                  <button 
                    onClick={() => {
                      setBlueprint(null);
                      setAppIdea('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Generate Another <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
