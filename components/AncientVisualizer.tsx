'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Box, 
  Castle, 
  Ghost, 
  Loader2, 
  Download, 
  Share2, 
  Info,
  ChevronRight,
  Maximize2,
  History,
  Trash2
} from 'lucide-react';
import { getGeminiClient, withRetry } from '@/lib/gemini';
import Image from 'next/image';

interface Visualization {
  id: string;
  type: 'artifact' | 'structure' | 'creature';
  prompt: string;
  imageUrl: string;
  description: string;
  date: string;
}

export default function AncientVisualizer({ logActivity }: { logActivity?: (action: string, tool: string) => void }) {
  const [type, setType] = useState<'artifact' | 'structure' | 'creature'>('artifact');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentViz, setCurrentViz] = useState<Visualization | null>(null);
  const [history, setHistory] = useState<Visualization[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const generateVisualization = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = getGeminiClient();
      
      const categoryPrompts = {
        artifact: `A hyper-realistic, museum-quality 3D visualization of an ancient artifact: ${prompt}. Cinematic lighting, macro photography style, showcasing intricate details, textures, and historical weathering. Neutral background.`,
        structure: `A majestic, realistic 3D architectural visualization of an ancient structure: ${prompt}. Golden hour lighting, wide-angle cinematic shot, showing the scale, materials (stone, gold, marble), and surrounding environment as it would have looked in its prime.`,
        creature: `A realistic, biologically plausible visualization of a mythical creature from ancient lore: ${prompt}. Photorealistic style, natural environment, detailed anatomy, scales/fur/feathers, as if captured by a National Geographic photographer in the ancient world.`
      };

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: categoryPrompts[type] }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      }));

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Generate a brief description/context for the visualization
        const descResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Provide a 2-sentence historical and archaeological context for this ${type}: ${prompt}. Focus on its significance in ancient civilizations.`
        }));

        const newViz: Visualization = {
          id: Date.now().toString(),
          type,
          prompt,
          imageUrl,
          description: descResponse.text || "A reconstructed visualization based on historical evidence.",
          date: new Date().toLocaleString()
        };

        setCurrentViz(newViz);
        setHistory([newViz, ...history]);
        
        if (logActivity) {
          logActivity(`Generated ${type} visualization: ${prompt}`, 'Ancient Visualizer');
        }
      }
    } catch (error) {
      console.error("Visualization Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!currentViz) return;
    const link = document.createElement('a');
    link.href = currentViz.imageUrl;
    link.download = `archaeos-${currentViz.type}-${currentViz.id}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-[#f5f2ed]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight">Ancient Visualizer</h1>
            </div>
            <p className="text-[#1a1a1a]/60 font-medium">Reconstruct the lost wonders of the ancient world in high definition.</p>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#1a1a1a]/5 shadow-sm text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <History className="w-4 h-4" />
            Archive ({history.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#1a1a1a]/5 shadow-sm">
              <h3 className="font-serif text-xl font-bold mb-6">Visualization Parameters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setType('artifact')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === 'artifact' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}
                    >
                      <Box className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Artifact</span>
                    </button>
                    <button
                      onClick={() => setType('structure')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === 'structure' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}
                    >
                      <Castle className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Structure</span>
                    </button>
                    <button
                      onClick={() => setType('creature')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === 'creature' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}
                    >
                      <Ghost className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Creature</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Subject Details</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      type === 'artifact' ? "e.g., 'A golden crown from the Mauryan Empire with emerald inlays'" :
                      type === 'structure' ? "e.g., 'The Great Pyramid of Giza as it looked with white limestone casing'" :
                      "e.g., 'The mythical Eka-Shringa (Unicorn) of ancient India as described in Vedic texts'"
                    }
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-[#1a1a1a] transition-all resize-none"
                  />
                </div>

                <button
                  disabled={isGenerating || !prompt.trim()}
                  onClick={generateVisualization}
                  className="w-full py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reconstructing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Vision
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] text-white">
              <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                Expert Tip
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                For the most accurate results, mention specific materials (e.g., &quot;Lapis Lazuli&quot;, &quot;Terracotta&quot;) and historical periods (e.g., &quot;Gupta Dynasty&quot;, &quot;Old Kingdom Egypt&quot;).
              </p>
            </div>
          </div>

          {/* Result Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {currentViz ? (
                <motion.div
                  key={currentViz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative aspect-square bg-white rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                    <Image
                      src={currentViz.imageUrl}
                      alt={currentViz.prompt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute top-6 right-6 flex gap-2">
                      <button 
                        onClick={downloadImage}
                        className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all text-[#1a1a1a]"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all text-[#1a1a1a]">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-amber-500 rounded-full text-[8px] font-bold uppercase tracking-widest">
                          {currentViz.type}
                        </span>
                        <span className="text-[10px] font-mono opacity-60">{currentViz.date}</span>
                      </div>
                      <h2 className="font-serif text-3xl font-bold mb-2">{currentViz.prompt}</h2>
                      <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
                        {currentViz.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#1a1a1a]/5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resolution</p>
                        <p className="text-sm font-bold">1024 x 1024 (1K HD)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <Box className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Model</p>
                        <p className="text-sm font-bold">Gemini 3.1 Vision</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white/50 border-4 border-dashed border-[#1a1a1a]/5 rounded-[3rem] p-12 text-center">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8">
                    <Sparkles className="w-12 h-12 text-amber-500 animate-pulse" />
                  </div>
                  <h2 className="font-serif text-3xl font-bold mb-4">Awaiting Your Vision</h2>
                  <p className="text-[#1a1a1a]/40 max-w-md leading-relaxed">
                    Select a category and describe an ancient wonder to bring it back to life with hyper-realistic AI reconstruction.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl font-bold">Visualization Archive</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {history.length > 0 ? (
                <div className="space-y-6">
                  {history.map((viz) => (
                    <div 
                      key={viz.id}
                      onClick={() => {
                        setCurrentViz(viz);
                        setShowHistory(false);
                      }}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-[#1a1a1a] transition-all">
                        <Image
                          src={viz.imageUrl}
                          alt={viz.prompt}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600">{viz.type}</span>
                          <span className="text-[8px] font-mono text-gray-400">{viz.date}</span>
                        </div>
                        <p className="text-sm font-bold line-clamp-1">{viz.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-30">
                  <History className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No history yet</p>
                </div>
              )}

              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    setShowHistory(false);
                  }}
                  className="w-full mt-12 py-4 border-2 border-red-50/50 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Archive
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
