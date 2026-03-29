'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Code, 
  Play, 
  Sparkles, 
  Loader2, 
  Layout, 
  Download,
  Copy,
  CheckCircle2,
  Save,
  History,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SavedProject {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

export default function WebsiteBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'saved'>('preview');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchSavedProjects = () => {
    setIsLoadingSaved(true);
    try {
      const saved = localStorage.getItem('archaeos_websites');
      if (saved) {
        setSavedProjects(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchSavedProjects();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an expert web developer. Create a complete, single-file HTML website based on the following request: "${prompt}". 
        
        Requirements:
        1. Use modern HTML5, CSS3, and JavaScript.
        2. Include all CSS in a <style> tag and all JS in a <script> tag.
        3. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for styling.
        4. Make it fully responsive.
        5. Add nice animations and hover effects.
        6. Return ONLY the raw HTML code. Do not include markdown formatting like \`\`\`html or \`\`\`. Start exactly with <!DOCTYPE html>.`,
      });

      let code = response.text || '';
      code = code.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/```$/, '');
      
      setGeneratedCode(code);
      setActiveTab('preview');
    } catch (error) {
      console.error("Error generating website:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedCode || !prompt) return;
    setIsSaving(true);
    try {
      const newProject: SavedProject = {
        id: Date.now().toString(),
        prompt: prompt,
        code: generatedCode,
        createdAt: new Date().toISOString(),
      };
      
      const updatedProjects = [newProject, ...savedProjects];
      setSavedProjects(updatedProjects);
      localStorage.setItem('archaeos_websites', JSON.stringify(updatedProjects));
      alert('Project saved successfully!');
    } catch (error) {
      console.error("Error saving project:", error);
      alert('Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const updatedProjects = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updatedProjects);
      localStorage.setItem('archaeos_websites', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const loadProject = (project: SavedProject) => {
    setPrompt(project.prompt);
    setGeneratedCode(project.code);
    setActiveTab('preview');
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'website.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#1a1a1a] flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-600" />
            Universal Website Builder
          </h2>
          <p className="text-[#1a1a1a]/60 mt-2 max-w-2xl">
            Describe any website you want to build, and our AI will generate a complete, responsive, single-file HTML application using Tailwind CSS.
          </p>
        </div>
        {savedProjects.length > 0 && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-[#1a1a1a]/60 hover:text-[#1a1a1a] border border-[#1a1a1a]/10'
            }`}
          >
            <History className="w-4 h-4" />
            Saved Projects ({savedProjects.length})
          </button>
        )}
      </div>

      {activeTab === 'saved' ? (
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/10 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif font-bold">Your Saved Websites</h3>
            <button 
              onClick={() => setActiveTab('preview')}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              Back to Builder
            </button>
          </div>

          {isLoadingSaved ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : savedProjects.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No saved projects yet. Start building!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProjects.map((project) => (
                <div key={project.id} className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Layout className="w-5 h-5 text-indigo-600" />
                    </div>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 font-medium line-clamp-3 mb-4 h-15">
                    {project.prompt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => loadProject(project)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Input Area */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/10">
            <div className="flex flex-col gap-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the website you want to build... (e.g., 'A modern portfolio for a 3D artist with a dark theme, a hero section with a glowing button, and a masonry gallery')"
                className="w-full h-32 p-4 rounded-2xl border border-[#1a1a1a]/20 bg-[#f5f2ed] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 py-3 bg-[#1a1a1a] text-[#f5f2ed] rounded-full font-medium hover:bg-[#1a1a1a]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Website
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Area */}
          {generatedCode && (
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-[#1a1a1a]/10 overflow-hidden min-h-[500px]">
              <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]/10 bg-[#f5f2ed]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'preview'
                        ? 'bg-white shadow-sm text-indigo-600'
                        : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'code'
                        ? 'bg-white shadow-sm text-indigo-600'
                        : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    Code
                  </button>
                </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Project
                    </button>
                    <button
                      onClick={handleCopy}
                    className="p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-white rounded-full transition-all"
                    title="Copy Code"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-white rounded-full transition-all"
                    title="Download HTML"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 relative bg-gray-50">
                {activeTab === 'preview' ? (
                  <iframe
                    srcDoc={generatedCode}
                    className="w-full h-full border-0 bg-white"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="absolute inset-0 overflow-auto p-6 bg-[#1e1e1e] text-gray-300 font-mono text-sm">
                    <pre>
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
