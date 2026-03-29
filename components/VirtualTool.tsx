'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles, Send, Copy, Check } from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

export interface VirtualToolConfig {
  id: string;
  name: string;
  description: string;
  iconName: string;
  fields: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    placeholder?: string;
    options?: string[];
  }[];
  systemPrompt: string;
}

interface VirtualToolProps {
  config: VirtualToolConfig;
  globalLanguage: string;
}

export default function VirtualTool({ config, globalLanguage }: VirtualToolProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const ai = getGeminiModel();
      
      // Construct the user prompt from the form fields
      let userPrompt = `Language: ${globalLanguage}\n\n`;
      (config.fields || []).forEach(field => {
        userPrompt += `**${field.label}:**\n${formData[field.id] || 'Not provided'}\n\n`;
      });

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: {
          systemInstruction: config.systemPrompt
        }
      }));

      setResult(response.text || "No output generated.");
    } catch (error) {
      console.error("Virtual Tool Error:", error);
      setResult("An error occurred while generating the response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-3xl">{config.name}</h2>
          </div>
          <p className="text-sm opacity-70 max-w-2xl">
            {config.description}
          </p>
          <div className="mt-4 inline-block px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
            Auto-Evolved Tool
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-6">Input Parameters</h3>
            
            <div className="space-y-5">
              {(config.fields || []).map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    {field.label}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-32 bg-[#f5f2ed] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select an option</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Process Request
              </button>
            </div>
          </div>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-[#1a1a1a]/5 pb-4">
              <h3 className="font-serif text-xl">Generated Output</h3>
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Processing...</p>
                </div>
              ) : result ? (
                <div className="prose prose-sm prose-indigo max-w-none">
                  <Markdown>{result}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-12">
                  <Sparkles className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">Awaiting Input</p>
                  <p className="text-xs mt-2">Fill out the parameters and process the request to see the output.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
