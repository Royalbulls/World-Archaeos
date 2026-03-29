'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Ruler, 
  Compass, 
  Video, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Download,
  Map as MapIcon,
  Camera,
  FileText,
  Navigation,
  Printer,
  Layers,
  Save,
  Trash2,
  ExternalLink,
  History as HistoryIcon,
  MessageSquare,
  Send,
  Check,
  ChevronLeft
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { UserProfileData } from './UserProfile';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function VastuArchitect({ globalLanguage, profile, addStructure }: { globalLanguage: string, profile: UserProfileData, addStructure?: (name: string, type: string, description: string) => void }) {
  const [area, setArea] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [materialReport, setMaterialReport] = useState<string | null>(null);
  
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ [key: string]: string | null }>({
    front: null,
    back: null,
    left: null,
    right: null
  });
  const [mapLoading, setMapLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState<{ [key: string]: boolean }>({
    front: false,
    back: false,
    left: false,
    right: false
  });
  const [materialLoading, setMaterialLoading] = useState(false);
  
  const [vastuChatInput, setVastuChatInput] = useState('');
  const [vastuChatHistory, setVastuChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [vastuChatLoading, setVastuChatLoading] = useState(false);
  
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [siteAnalysis, setSiteAnalysis] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  
  const [hasKey, setHasKey] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
    
    // Load saved projects
    const saved = localStorage.getItem('vastu_projects');
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse Vastu projects from localStorage:", e);
      }
    }
  }, []);

  const saveProject = () => {
    if (!plan) return;
    const newProject = {
      id: Date.now(),
      date: new Date().toISOString(),
      area,
      requirements,
      plan,
      materialReport,
      mapUrl,
      photos,
      videoUrl,
      location
    };
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('vastu_projects', JSON.stringify(updated));
    
    // Save to profile as well
    if (addStructure) {
      addStructure(`${area} sq ft Home`, "Residential", requirements.substring(0, 100) + "...");
    }
    
    alert("Project saved successfully!");
  };

  const deleteProject = (id: number) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('vastu_projects', JSON.stringify(updated));
  };

  const loadProject = (project: any) => {
    setArea(project.area);
    setRequirements(project.requirements);
    setPlan(project.plan);
    setMaterialReport(project.materialReport);
    setMapUrl(project.mapUrl);
    setPhotos(project.photos || { front: project.photoUrl, back: null, left: null, right: null });
    setVideoUrl(project.videoUrl);
    setLocation(project.location);
    setShowSaved(false);
  };

  const handleGeneratePlan = async () => {
    if (!area.trim()) return;

    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a world-class Vastu Architect and Home Engineer. 
        Area: ${area} sq ft. 
        Requirements: ${requirements}.
        ${location ? `Site Location: Lat ${location.lat}, Lng ${location.lng}` : ''}
        
        Provide a detailed architectural floor plan based on Vastu Shastra principles. 
        Include:
        1. Room placements (Kitchen in SE, Master Bedroom in SW, etc.)
        2. Entrance direction.
        3. Ventilation and light optimization.
        4. A descriptive walkthrough of the house.`,
      }));

      setPlan(response.text || "Failed to generate plan.");
    } catch (error) {
      console.error(error);
      setPlan("Error generating plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateImage = async (type: 'map' | 'photo', side: string = 'front') => {
    if (!plan) {
      alert("Please generate the Vastu Plan first to ensure accuracy.");
      return;
    }

    if (type === 'map') {
      setMapLoading(true);
    } else {
      setPhotoLoading(prev => ({ ...prev, [side]: true }));
    }

    try {
      const ai = getGeminiModel("gemini-2.5-flash-image");
      
      // Create a specific prompt based on the generated plan
      const contextPrompt = type === 'map' 
        ? `Create a professional 2D architectural floor plan based on this Vastu plan: ${plan.substring(0, 500)}. The drawing should be a clean technical blueprint, black and white, with clearly labeled rooms (Kitchen in SE, Master Bedroom in SW, etc.) as described in the text. High resolution, professional architectural style.`
        : `Create a photorealistic 3D exterior visualization of the ${side} view of the house described in this Vastu plan: ${plan.substring(0, 500)}. Show the entrance facing the direction specified in the plan. Modern architecture, high-end materials, cinematic lighting, 8k resolution, beautiful landscaping.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: contextPrompt }] },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      }));

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const url = `data:image/png;base64,${part.inlineData.data}`;
          if (type === 'map') {
            setMapUrl(url);
          } else {
            setPhotos(prev => ({ ...prev, [side]: url }));
          }
          break;
        }
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to generate ${type}. Please try again.`);
    } finally {
      if (type === 'map') {
        setMapLoading(false);
      } else {
        setPhotoLoading(prev => ({ ...prev, [side]: false }));
      }
    }
  };

  const handleGenerateMaterialReport = async () => {
    if (!plan) return;
    setMaterialLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this house plan: ${plan}, generate a comprehensive construction material report. 
        
        Project Context:
        - Area: ${area} sq ft
        - Requirements: ${requirements}
        ${location ? `- Location: Latitude ${location.lat}, Longitude ${location.lng}` : ''}
        ${siteAnalysis ? `- Site Analysis: ${siteAnalysis}` : ''}

        Please provide the report with the following sections:
        1. **Core Construction Materials**: Estimated quantities of Cement, Steel, Sand, and Bricks/Blocks.
        2. **Finishing & Interior**: Flooring materials, wall finishes, and ceiling types.
        3. **Systems & Utilities**: Electrical, Plumbing, and HVAC requirements.
        4. **Sustainable & High-Tech Innovations**: 
           - Suggest eco-friendly alternatives tailored to the local climate (e.g., fly ash bricks, solar-reflective paints, or recycled aggregates).
           - High-tech material integrations (e.g., smart glass, self-healing concrete, or IoT-integrated wiring).
           - Explain how these choices benefit the specific project requirements: ${requirements}.
        5. **Execution Timeline**: Estimated phases and duration for construction.`,
      }));
      setMaterialReport(response.text || "Failed to generate report.");
    } catch (error) {
      console.error(error);
    } finally {
      setMaterialLoading(false);
    }
  };

  const detectLocation = () => {
    if (isTracking && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      return;
    }

    setLocationLoading(true);
    if ("geolocation" in navigator) {
      const onUpdate = async (position: GeolocationPosition) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setLocationLoading(false);
        setIsTracking(true);
        
        // Only analyze once or when significantly moved
        if (!siteAnalysis) {
          try {
            const ai = getGeminiModel("gemini-2.5-flash");
            const response = await withRetry(() => ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `Analyze this specific plot location for a new home construction: Latitude ${lat}, Longitude ${lng}. 
              Check for:
              1. Surrounding environment (roads, water bodies, parks).
              2. Vastu implications of the plot's orientation.
              3. Soil type and construction feasibility based on regional data.
              4. Local climate considerations for design.`,
              config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                  retrievalConfig: { latLng: { latitude: lat, longitude: lng } }
                }
              }
            }));
            setSiteAnalysis(response.text || "Site analysis complete.");
          } catch (e) {
            console.error(e);
            setSiteAnalysis("Location detected, but detailed site analysis failed. Proceeding with coordinates.");
          }
        }
      };

      const onError = (error: GeolocationPositionError) => {
        console.error(error);
        setLocationLoading(false);
        let msg = "Location access denied.";
        if (error.code === error.PERMISSION_DENIED) msg = "Please enable location permissions in your browser settings.";
        alert(msg);
      };

      const id = navigator.geolocation.watchPosition(onUpdate, onError, { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0 
      });
      setWatchId(id);
    } else {
      setLocationLoading(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleVastuChat = async () => {
    if (!vastuChatInput.trim() || !plan) return;

    const userMsg = { role: 'user' as const, text: vastuChatInput };
    setVastuChatHistory(prev => [...prev, userMsg]);
    setVastuChatInput('');
    setVastuChatLoading(true);

    try {
      const ai = getGeminiModel();
      const historyText = vastuChatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n');
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a Vastu Shastra expert. You have previously generated the following architectural plan:
        
        ${plan}
        
        ${materialReport ? `You also generated the following material report:\n\n${materialReport}\n\n` : ''}
        
        Previous conversation:
        ${historyText}
        
        The user is asking a specific question about the Vastu principles applied in this plan or the materials used. 
        Answer concisely and professionally, referencing the plan and material report where appropriate.
        
        User Question: ${vastuChatInput}`,
      }));

      const assistantMsg = { role: 'assistant' as const, text: response.text || "I am unable to consult the stars at this moment." };
      setVastuChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setVastuChatLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!plan) return;
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      return;
    }

    setVideoLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A cinematic 3D architectural walkthrough of the house described in this plan: ${plan.substring(0, 500)}. Interior view showing a spacious living room with natural light, a modern kitchen, and elegant bedrooms. High-tech smart home features visible. Architectural visualization style.`,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error(error);
      alert("Video generation failed.");
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Input Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-3xl">Vastu Architect Pro</h2>
              <p className="text-sm text-[#1a1a1a]/60">High-tech engineering for Vastu-compliant dream homes.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium bg-[#f5f2ed] text-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-all"
            >
              <HistoryIcon className="w-4 h-4" />
              {showSaved ? 'Back to Editor' : `Saved Projects (${savedProjects.length})`}
            </button>
            <button
              onClick={detectLocation}
              disabled={locationLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                isTracking ? 'bg-green-600 text-white' : 'bg-[#f5f2ed] text-[#1a1a1a] hover:bg-[#1a1a1a]/5'
              }`}
            >
              {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />}
              {isTracking ? `Live Tracking: ${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}` : 'Start Live Site Tracking'}
            </button>
          </div>
        </div>

        {showSaved ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProjects.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4" />
                <p>No saved projects yet.</p>
              </div>
            ) : (
              savedProjects.map((project) => (
                <div key={project.id} className="bg-[#f5f2ed] rounded-3xl p-6 border border-[#1a1a1a]/5 space-y-4 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif text-lg">{project.area} sq ft Home</h4>
                      <p className="text-[10px] opacity-50">{new Date(project.date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => deleteProject(project.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs opacity-60 line-clamp-2">{project.requirements}</p>
                  <button
                    onClick={() => loadProject(project)}
                    className="w-full py-3 bg-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all"
                  >
                    Load Project
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-mono opacity-50 ml-1">Total Area (sq ft)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g., 1500"
                    className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-mono opacity-50 ml-1">Requirements & Innovations</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g., 3 BHK, Smart home features, Solar integration, North entrance..."
                  className="w-full h-32 bg-[#f5f2ed] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-4 rounded-2xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate Full Project</>}
              </button>
            </div>

            <div className="space-y-4">
              {location && (
                <div className="bg-[#f5f2ed] rounded-3xl overflow-hidden border border-[#1a1a1a]/5 aspect-video relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Satellite View
                  </div>
                </div>
              )}
              {siteAnalysis && (
                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                  <h3 className="font-serif text-lg mb-2 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-amber-600" />
                    Site Intelligence
                  </h3>
                  <div className="prose prose-sm max-w-none text-amber-900/70">
                    <Markdown>{siteAnalysis}</Markdown>
                  </div>
                </div>
              )}
              {!location && (
                <div className="h-full bg-[#f5f2ed] rounded-3xl flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#1a1a1a]/10">
                  <Layers className="w-12 h-12 opacity-20 mb-4" />
                  <p className="text-xs opacity-40 italic">Detect your live location to enable site-specific Vastu analysis using satellite data.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {plan && !showSaved && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan & Reports */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-600" />
                  Architectural Plan
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPlan(null);
                      setMaterialReport(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f5f2ed] text-[#1a1a1a] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={saveProject}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Project
                  </button>
                  <button 
                    onClick={() => {
                      const printContent = document.getElementById('printable-vastu-plan');
                      if (printContent) {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Vastu Project Plan</title>
                                <style>
                                  body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
                                  h1, h2, h3 { color: #78350f; }
                                  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #78350f; padding-bottom: 20px; }
                                  pre { white-space: pre-wrap; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>WORLD ARCHAEOS VASTU PROJECT</h1>
                                  <p>Generated on ${new Date().toLocaleDateString()}</p>
                                </div>
                                ${printContent.innerHTML}
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }
                    }} 
                    className="p-2 hover:bg-[#f5f2ed] rounded-xl transition-all"
                    title="Print Plan"
                  >
                    <Printer className="w-5 h-5 opacity-50" />
                  </button>
                  <button
                    onClick={() => downloadText(plan, 'vastu_plan.md')}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                    title="Download Plan"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none" id="printable-vastu-plan">
                <Markdown>{plan}</Markdown>
              </div>

              {/* Vastu Assistant Chat */}
              <div className="mt-10 pt-8 border-t border-[#1a1a1a]/5">
                <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  Consult Vastu Expert
                </h4>
                <div className="bg-[#f5f2ed] rounded-2xl p-4 mb-4 max-h-60 overflow-y-auto space-y-4">
                  {vastuChatHistory.length === 0 ? (
                    <p className="text-xs opacity-40 italic text-center py-4">Ask me anything about your new home&apos;s Vastu alignment.</p>
                  ) : (
                    vastuChatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-xs ${
                          msg.role === 'user' 
                            ? 'bg-amber-600 text-white rounded-tr-none' 
                            : 'bg-white border border-[#1a1a1a]/5 text-[#1a1a1a] rounded-tl-none shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  {vastuChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#1a1a1a]/5 p-3 rounded-xl rounded-tl-none shadow-sm">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={vastuChatInput}
                    onChange={(e) => setVastuChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVastuChat()}
                    placeholder="Why is the kitchen in the SE?"
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-4 pr-12 text-xs focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <button 
                    onClick={handleVastuChat}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  Material & Construction Report
                </h3>
                <div className="flex items-center gap-2">
                  {materialReport && (
                    <button
                      onClick={() => downloadText(materialReport, 'material_report.md')}
                      className="p-2 hover:bg-blue-50 rounded-xl transition-all text-blue-600"
                      title="Download Report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  {!materialReport && (
                    <button
                      onClick={handleGenerateMaterialReport}
                      disabled={materialLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {materialLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate Report'}
                    </button>
                  )}
                </div>
              </div>
              {materialReport ? (
                <div className="prose prose-sm max-w-none">
                  <Markdown>{materialReport}</Markdown>
                </div>
              ) : (
                <p className="text-sm opacity-40 italic">Generate the material report to see construction requirements and high-tech material suggestions.</p>
              )}
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="lg:col-span-5 space-y-8">
            {/* Map Generation */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-green-600" />
                  2D Floor Map
                </h3>
                <div className="flex items-center gap-2">
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      download="floor_map.png"
                      className="p-2 hover:bg-green-50 rounded-xl transition-all text-green-600"
                      title="Download Map"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => generateImage('map')}
                    disabled={mapLoading}
                    className="p-2 hover:bg-green-50 rounded-xl transition-all text-green-600"
                  >
                    {mapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="aspect-video bg-[#f5f2ed] rounded-2xl overflow-hidden border border-[#1a1a1a]/5 relative group">
                {mapUrl ? (
                  <>
                    <Image 
                      src={mapUrl} 
                      alt="Floor Map" 
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <a href={mapUrl} download="floor_map.png" className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10">
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <MapIcon className="w-10 h-10 mb-2" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Generate Technical Map</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Generation */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  Exterior Visualization
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['front', 'back', 'left', 'right'].map((side) => (
                  <button
                    key={side}
                    onClick={() => generateImage('photo', side)}
                    disabled={photoLoading[side]}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between ${
                      photos[side] 
                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                        : 'bg-[#f5f2ed] text-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5'
                    }`}
                  >
                    {side}
                    {photoLoading[side] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : photos[side] ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {['front', 'back', 'left', 'right'].map((side) => photos[side] && (
                  <div key={side} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{side} View</span>
                      <a
                        href={photos[side]!}
                        download={`house_photo_${side}.png`}
                        className="p-1.5 hover:bg-purple-50 rounded-lg transition-all text-purple-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="aspect-video bg-[#f5f2ed] rounded-2xl overflow-hidden border border-[#1a1a1a]/5 relative group">
                      <Image 
                        src={photos[side]!} 
                        alt={`${side} View`} 
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <a href={photos[side]!} download={`house_photo_${side}.png`} className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
                
                {!Object.values(photos).some(v => v !== null) && (
                  <div className="aspect-video bg-[#f5f2ed] rounded-2xl overflow-hidden border border-[#1a1a1a]/5 flex flex-col items-center justify-center opacity-30">
                    <Camera className="w-10 h-10 mb-2" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Generate Exterior Views</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Generation */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-600" />
                  3D Walkthrough
                </h3>
                <button
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                >
                  {videoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              <div className="aspect-video bg-[#f5f2ed] rounded-2xl overflow-hidden border border-[#1a1a1a]/5 relative">
                {videoUrl ? (
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-4">
                    <Video className="w-10 h-10 mb-2" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Generate Cinematic Video</p>
                    {videoLoading && <p className="text-[8px] mt-2 animate-pulse">Processing 3D Geometry...</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
