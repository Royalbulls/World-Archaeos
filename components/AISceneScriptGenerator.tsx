'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Clapperboard, 
  Camera, 
  Layers, 
  Type,
  Loader2,
  Download,
  Share2,
  Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Scene {
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  atmosphere: string;
  cameraMovement: string;
  duration: string;
}

interface Script {
  title: string;
  overallMood: string;
  scenes: Scene[];
}

export default function AISceneScriptGenerator() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacterPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateScript = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

      const prompt = `
        You are an expert AI Video Scriptwriter and Prompt Engineer. 
        The user wants to create a video based on this idea: "${input}"
        ${characterPhoto ? "The user has provided a character reference photo. Ensure the visual prompts mention a consistent character based on this context." : ""}

        Generate a detailed scene-by-scene script (3-5 scenes) optimized for AI Video Generation tools like Sora, Runway Gen-2, or Pika.
        
        For each scene, provide:
        1. Scene Description: What happens in the scene.
        2. Visual Prompt: A highly detailed, cinematic prompt for an AI video generator. Include lighting, texture, style (e.g., hyper-realistic, cinematic, 8k), and specific character actions.
        3. Atmosphere: The emotional tone and environmental feel.
        4. Camera Movement: Specific instructions (e.g., slow zoom-in, tracking shot, low angle).
        5. Duration: Estimated seconds for this shot.

        Return the response in JSON format:
        {
          "title": "A catchy title for the video",
          "overallMood": "Description of the overall vibe",
          "scenes": [
            {
              "sceneNumber": 1,
              "description": "...",
              "visualPrompt": "...",
              "atmosphere": "...",
              "cameraMovement": "...",
              "duration": "..."
            }
          ]
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(result.text || '{}');
      setScript(data);
    } catch (error) {
      console.error("Error generating script:", error);
      alert("Failed to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl text-[#1a1a1a]">AI Video Script Architect</h2>
          <p className="text-sm text-[#1a1a1a]/50 mt-1">Transform your ideas into cinematic AI video prompts</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
          <Video className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Video Engine v1.0</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1a1a1a]/5">
        <div className="space-y-6">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your scene idea... (e.g., 'I am walking towards a mysterious ancient palace and knocking on its golden doors')"
              className="w-full h-32 bg-gray-50 rounded-3xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent transition-all resize-none"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <label className="cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors group">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <Camera className={`w-4 h-4 ${characterPhoto ? 'text-emerald-500' : 'text-gray-400'} group-hover:text-indigo-600`} />
              </label>
              <button
                onClick={generateScript}
                disabled={isGenerating || !input.trim()}
                className="px-6 py-2 bg-[#1a1a1a] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Generating...' : 'Architect Script'}
              </button>
            </div>
          </div>

          {characterPhoto && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                <img src={characterPhoto} alt="Character Ref" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Character Reference Active</p>
                <p className="text-xs text-indigo-900/60">AI will maintain visual consistency with this photo.</p>
              </div>
              <button onClick={() => setCharacterPhoto(null)} className="p-2 hover:bg-white rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {script && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Script Overview */}
            <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Clapperboard className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="font-serif text-4xl mb-2">{script.title}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">Mood: {script.overallMood}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">{script.scenes.length} Scenes</span>
                </div>
              </div>
            </div>

            {/* Scene List */}
            <div className="grid grid-cols-1 gap-6">
              {script.scenes.map((scene, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[2rem] border border-[#1a1a1a]/5 shadow-lg overflow-hidden group"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Scene Meta */}
                    <div className="w-full md:w-48 bg-gray-50 p-8 flex flex-col justify-between border-r border-gray-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Scene</p>
                        <p className="text-4xl font-serif font-bold text-[#1a1a1a]">{scene.sceneNumber.toString().padStart(2, '0')}</p>
                      </div>
                      <div className="space-y-4 mt-8">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">Duration</p>
                          <p className="text-xs font-mono">{scene.duration}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">Camera</p>
                          <p className="text-xs font-medium leading-tight">{scene.cameraMovement}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scene Content */}
                    <div className="flex-1 p-8 space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 mb-3 flex items-center gap-2">
                          <Layers className="w-3 h-3" />
                          Action Description
                        </h4>
                        <p className="text-sm text-[#1a1a1a] leading-relaxed">{scene.description}</p>
                      </div>

                      <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 relative group/prompt">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          AI Video Prompt
                        </h4>
                        <p className="text-xs text-indigo-900/80 font-mono leading-relaxed pr-10">
                          {scene.visualPrompt}
                        </p>
                        <button 
                          onClick={() => copyToClipboard(scene.visualPrompt, idx)}
                          className="absolute top-6 right-6 p-2 bg-white rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                          <Type className="w-3 h-3 opacity-40" />
                          <span className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase tracking-widest">{scene.atmosphere}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <button className="px-8 py-3 bg-[#1a1a1a] text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-600 transition-all">
                <Download className="w-4 h-4" />
                Export Full Script
              </button>
              <button className="px-8 py-3 bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all">
                <Share2 className="w-4 h-4" />
                Share Storyboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!script && !isGenerating && (
        <div className="py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-[#1a1a1a]/5 flex items-center justify-center mx-auto text-indigo-600">
            <Clapperboard className="w-10 h-10" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-2xl mb-2">Ready to Direct?</h3>
            <p className="text-sm text-[#1a1a1a]/50 leading-relaxed">
              Enter a simple scene idea above. Our engine will expand it into a professional storyboard with optimized prompts for AI video generation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
