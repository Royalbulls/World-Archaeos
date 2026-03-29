'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  Pickaxe, 
  Gem, 
  Loader2, 
  ChevronRight, 
  X, 
  Compass,
  Eye,
  ScrollText,
  Send,
  Bot,
  Camera,
  Database
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';
import Image from 'next/image';

// Fix for default marker icons in react-leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Site {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  probability: number;
  artifacts: string[];
  minerals: string[];
  historicalContext: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'site_discovery' | 'translation' | 'analysis';
  data?: any;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function VirtualArchaeologist() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Greetings, Seeker of the Past. I am your Virtual Archaeologist Assistant. I can help you identify potential sites using satellite data, translate ancient scripts, and analyze artifacts. Where shall we begin our expedition? Perhaps the Indus Valley or the sands of Mesopotamia?",
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([29.9792, 31.1342]); // Default to Pyramids
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const userMessage: Message = {
      role: 'user',
      content: input || "Analyze this artifact image.",
      data: image ? { image } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setLoading(true);

    try {
      const ai = getGeminiModel();
      
      const prompt = `You are the "Virtual Archaeologist Assistant", a world-class AI expert in archaeology, linguistics, and geology. 
      Your goal is to assist the user in discovering lost civilizations, identifying sites, translating ancient languages, and analyzing artifacts.
      
      User Input: "${input}"
      ${image ? "An image of an artifact/site has been provided for analysis." : ""}
      
      Current Context:
      - You have access to satellite imagery and historical records.
      - You can identify potential archaeological sites with coordinates.
      - You can translate ancient scripts (Sumerian, Egyptian, Indus Valley, etc.).
      - You can identify rare artifacts and minerals.
      
      Your response should be helpful, scholarly, and engaging.
      
      If the user is looking for sites:
      Identify 1-3 potential sites related to their query. 
      Provide coordinates [lat, lng], a description, probability of finding items (0-100), likely artifacts, and historical context.
      
      If the user provides an image or text to translate:
      Perform a deep decipherment and provide historical context.
      
      Response Format:
      You MUST respond with a JSON object if you are identifying sites or performing a specific analysis that requires structured data.
      Otherwise, respond with a text message.
      
      JSON Structure for Site Discovery:
      {
        "type": "site_discovery",
        "message": "Assistant's textual response explaining the discovery.",
        "sites": [
          {
            "id": "unique-id",
            "name": "Site Name",
            "coordinates": [lat, lng],
            "description": "...",
            "probability": 85,
            "artifacts": ["...", "..."],
            "minerals": ["...", "..."],
            "historicalContext": "..."
          }
        ]
      }
      
      JSON Structure for Translation/Analysis:
      {
        "type": "analysis",
        "message": "Assistant's textual response/report in Markdown.",
        "analysisData": { ... }
      }
      
      If it's just a conversation, just return the text.
      
      Always prioritize accuracy and scientific tone. Mention specific civilizations like Mesopotamia or Indus Valley if relevant.`;

      const contents: any = { parts: [{ text: prompt }] };
      if (image) {
        contents.parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image.split(',')[1]
          }
        });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: image ? "gemini-2.5-flash" : "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: "You are the Virtual Archaeologist Assistant. You help users explore the past through satellite analysis, linguistics, and artifact identification."
        }
      }));

      const rawText = response.text || '';
      let assistantMessage: Message;

      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          assistantMessage = {
            role: 'assistant',
            content: data.message,
            type: data.type,
            data: data
          };

          if (data.type === 'site_discovery' && data.sites) {
            setSites(prev => [...prev, ...data.sites]);
            if (data.sites.length > 0) {
              setMapCenter(data.sites[0].coordinates);
            }
          }
        } else {
          assistantMessage = {
            role: 'assistant',
            content: rawText,
            type: 'text'
          };
        }
      } catch {
        assistantMessage = {
          role: 'assistant',
          content: rawText,
          type: 'text'
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but my connection to the global archives has been interrupted. Please try again.", type: 'text' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left: Chat Assistant */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-[2.5rem] shadow-xl border border-[#1a1a1a]/5 overflow-hidden">
        {/* Chat Header */}
        <div className="p-6 bg-[#1a1a1a] text-[#f5f2ed] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl">Virtual Archaeologist</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-50">AI Mission Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Online</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcfaf7] custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-5 rounded-[1.5rem] text-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-500/10' 
                  : 'bg-white border border-[#1a1a1a]/5 text-[#1a1a1a] rounded-tl-none shadow-sm'
              }`}>
                {msg.data?.image && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20">
                    <Image src={msg.data.image} alt="User Upload" width={300} height={200} className="w-full h-auto" />
                  </div>
                )}
                <div className="prose prose-sm max-w-none prose-emerald">
                  <Markdown>{msg.content}</Markdown>
                </div>
                
                {msg.type === 'site_discovery' && msg.data?.sites && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sites Identified:</p>
                    {msg.data.sites.map((site: Site) => (
                      <button 
                        key={site.id}
                        onClick={() => {
                          setSelectedSite(site);
                          setMapCenter(site.coordinates);
                        }}
                        className="w-full text-left p-3 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-bold text-xs text-emerald-900">{site.name}</p>
                          <p className="text-[10px] text-emerald-600">{site.probability}% Probability</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-[#1a1a1a]/5">
          {image && (
            <div className="mb-4 relative inline-block">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                <Image src={image} alt="Preview" width={80} height={80} className="object-cover w-full h-full" />
              </div>
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-[#f5f2ed] text-[#1a1a1a]/60 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
              title="Upload Artifact Photo"
            >
              <Camera className="w-5 h-5" />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about a site, script, or artifact..."
                className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={loading || (!input.trim() && !image)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Map & Lab */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] p-2 shadow-xl border border-[#1a1a1a]/5 relative overflow-hidden z-0 min-h-[400px]">
          <MapContainer 
            center={mapCenter} 
            zoom={6} 
            className="w-full h-full rounded-[2rem]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
            <MapUpdater center={mapCenter} />
            {sites.map((site) => (
              <Marker 
                key={site.id} 
                position={site.coordinates} 
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedSite(site),
                }}
              >
                <Popup>
                  <div className="font-sans">
                    <h3 className="font-bold text-sm">{site.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{site.probability}% Match</p>
                    <button 
                      onClick={() => setSelectedSite(site)}
                      className="mt-2 text-[10px] text-emerald-600 font-bold uppercase tracking-widest hover:underline"
                    >
                      View Lab Data
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="absolute top-6 right-6 z-[1000] bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
            <Eye className="w-3 h-3 text-emerald-400" />
            Satellite Telemetry Active
          </div>
        </div>

        {/* Site/Artifact Lab */}
        <div className="h-[300px] bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/5">
          <AnimatePresence mode="wait">
            {selectedSite ? (
              <motion.div
                key={selectedSite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-emerald-400">{selectedSite.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-[10px] font-mono opacity-50">
                        <MapIcon className="w-3 h-3" />
                        {selectedSite.coordinates[0].toFixed(4)}, {selectedSite.coordinates[1].toFixed(4)}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                        selectedSite.probability > 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {selectedSite.probability}% Probability
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSite(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                      <ScrollText className="w-3 h-3" />
                      Historical Context
                    </h4>
                    <p className="text-xs leading-relaxed opacity-70">{selectedSite.historicalContext}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      Artifact Profile
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSite.artifacts.map((art, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] border border-white/10">
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                      <Pickaxe className="w-3 h-3" />
                      Geological Data
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSite.minerals.map((min, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] border border-white/10 flex items-center gap-1">
                          <Gem className="w-2 h-2 text-emerald-400" />
                          {min}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <Compass className="w-16 h-16 mb-4 animate-pulse" />
                <h3 className="font-serif text-2xl italic">Lab Offline</h3>
                <p className="text-xs mt-2 max-w-xs uppercase tracking-widest">Select a site on the map or ask the assistant to begin analysis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
