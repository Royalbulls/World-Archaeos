'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sprout, 
  Factory, 
  Loader2, 
  Lightbulb, 
  Package, 
  Target 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ProductIdea {
  category: string;
  items: {
    name: string;
    description: string;
    investment: string;
    profitMargin: string;
  }[];
}

interface BusinessPlan {
  material: string;
  traditionalProducts: ProductIdea;
  innovativeProducts: ProductIdea;
  b2bOpportunities: ProductIdea;
  marketingStrategy: string;
  sustainability: string;
}

export default function ProductInnovator() {
  const [material, setMaterial] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<BusinessPlan | null>(null);

  const generateIdeas = async () => {
    if (!material.trim()) return;
    setIsGenerating(true);
    setPlan(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const prompt = `
        You are an expert Business Strategist and Product Innovator.
        The user wants to start a business using the raw material: "${material}".
        Generate a comprehensive list of products that can be made from this material, ranging from traditional to highly innovative/futuristic.
        Also provide B2B opportunities, marketing strategy, and sustainability aspects.

        Return the response strictly in this JSON format:
        {
          "material": "Name of the material",
          "traditionalProducts": {
            "category": "Traditional & Common Products",
            "items": [
              { "name": "Product Name", "description": "Brief description", "investment": "Low/Medium/High", "profitMargin": "Low/Medium/High" }
            ]
          },
          "innovativeProducts": {
            "category": "Innovative & Value-Added Products",
            "items": [
              { "name": "Product Name", "description": "Brief description", "investment": "Low/Medium/High", "profitMargin": "Low/Medium/High" }
            ]
          },
          "b2bOpportunities": {
            "category": "B2B & Industrial Applications",
            "items": [
              { "name": "Product Name", "description": "Brief description", "investment": "Low/Medium/High", "profitMargin": "Low/Medium/High" }
            ]
          },
          "marketingStrategy": "A short paragraph on how to market these products.",
          "sustainability": "A short paragraph on eco-friendly practices and zero-waste approach for this material."
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(result.text || '{}');
      setPlan(data);
    } catch (error) {
      console.error("Error generating business ideas:", error);
      alert("Failed to generate ideas. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCategory = (data: ProductIdea, icon: React.ReactNode, colorClass: string) => (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#1a1a1a]/5">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <h3 className="font-serif text-xl text-[#1a1a1a]">{data.category}</h3>
      </div>
      <div className="space-y-4">
        {data.items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-[#1a1a1a] text-sm">{item.name}</h4>
              <div className="flex gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                  Inv: {item.investment}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-700 rounded-md">
                  Margin: {item.profitMargin}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#1a1a1a]/60 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl text-[#1a1a1a]">Product Innovator</h2>
          <p className="text-sm text-[#1a1a1a]/50 mt-1">Transform raw materials into profitable business empires</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <Factory className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Business Engine v1.0</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1a1a1a]/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sprout className="w-5 h-5 text-[#1a1a1a]/40" />
            </div>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Enter a raw material (e.g., Milk, Banana, Bamboo, Clay)..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent transition-all"
              onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
            />
          </div>
          <button
            onClick={generateIdeas}
            disabled={isGenerating || !material.trim()}
            className="px-8 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-black/10 whitespace-nowrap"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
            {isGenerating ? 'Brainstorming...' : 'Generate Ideas'}
          </button>
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="text-xs text-[#1a1a1a]/40 font-medium">Try:</span>
          {['Milk', 'Banana', 'Bamboo', 'Coconut', 'Aloe Vera'].map(m => (
            <button 
              key={m} 
              onClick={() => setMaterial(m)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[#1a1a1a]/60 transition-colors"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {renderCategory(plan.traditionalProducts, <Package className="w-5 h-5 text-amber-600" />, "bg-amber-100")}
              {renderCategory(plan.innovativeProducts, <Lightbulb className="w-5 h-5 text-emerald-600" />, "bg-emerald-100")}
              {renderCategory(plan.b2bOpportunities, <Briefcase className="w-5 h-5 text-blue-600" />, "bg-blue-100")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] text-white rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-serif text-xl">Marketing Strategy</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{plan.marketingStrategy}</p>
              </div>
              <div className="bg-emerald-900 text-white rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Sprout className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-serif text-xl">Sustainability & Zero-Waste</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{plan.sustainability}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
