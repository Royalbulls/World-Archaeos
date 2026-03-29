'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Pickaxe, Sparkles, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { getGeminiModel } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function ArtifactAnalyzer({ addArtifact }: { addArtifact?: (name: string, type: string, findings: string) => void }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !image) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      
      let contents: any;
      if (image) {
        const base64Data = image.split(',')[1];
        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/png" } },
            { text: `Analyze this artifact. ${description ? `Context: ${description}` : "Identify its origin, era, and significance. Look for specific symbols, animals, or scripts (like Indus Valley seals or Mesopotamian tokens)."}` }
          ]
        };
      } else {
        contents = `Analyze the following artifact description: ${description}. Provide historical context, possible civilization of origin (e.g., Indus Valley, Mesopotamia, Egypt), and the meaning of any symbols or figures mentioned (like unicorns, strange animals, or seals).`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
      });

      const resultText = response.text || "Analysis failed.";
      setAnalysis(resultText);

      // Save to profile
      const artifactName = description.split('\n')[0].substring(0, 30) || (image ? "Visual Artifact" : "Unknown Artifact");
      if (addArtifact) {
        addArtifact(artifactName, "Ancient Artifact", resultText.substring(0, 100) + "...");
      }

    } catch (error) {
      console.error(error);
      setAnalysis("Error analyzing artifact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <h2 className="font-serif text-3xl mb-2">Artifact Lab</h2>
        <p className="text-sm text-[#1a1a1a]/60 mb-6">
          Analyze stones, seals, and artifacts. Decipher ancient symbols and identify origins.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the artifact, symbols, or animals found on it (e.g., 'A square seal with a one-horned animal and strange script')..."
                className="w-full h-40 bg-[#f5f2ed] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#1a1a1a] transition-all resize-none"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 bg-[#f5f2ed] hover:bg-[#1a1a1a]/5 py-3 rounded-xl cursor-pointer transition-all border-2 border-dashed border-[#1a1a1a]/10">
                <Upload className="w-4 h-4 opacity-50" />
                <span className="text-xs font-medium opacity-70">Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-[#1a1a1a] text-[#f5f2ed] py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Analyze</>}
              </button>
            </div>
          </div>

          <div className="bg-[#f5f2ed] rounded-2xl flex items-center justify-center overflow-hidden border border-[#1a1a1a]/5 min-h-[200px] relative">
            {image ? (
              <Image 
                src={image} 
                alt="Artifact" 
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center opacity-30">
                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-[10px] uppercase tracking-widest font-mono">No Image Preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Pickaxe className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest font-mono">Archaeological Analysis Report</span>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal">
            <Markdown>{analysis}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
