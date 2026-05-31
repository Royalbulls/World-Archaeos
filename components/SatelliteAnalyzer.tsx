'use client';

import React, { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap, 
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { 
  Satellite, 
  Navigation, 
  Info, 
  Loader2,
  MapPin,
  Compass,
  Mountain,
  Trees,
  Route,
  CheckCircle2,
  Layers,
  Scan,
  Pickaxe,
  Star,
  History,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { extractJson } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface Detection {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  accessibility: 'Easy' | 'Moderate' | 'Difficult';
  confidence: number;
  description: string;
  features: string[];
  userId?: string;
  timestamp?: any;
}

const SplashScreen = () => (
  <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-3xl border border-[#1a1a1a]/5 p-8 text-center">
    <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#f5f2ed] mb-6">
      <Satellite className="w-8 h-8" />
    </div>
    <h2 className="font-serif text-2xl font-bold mb-4">Satellite Analysis Required</h2>
    <p className="text-sm text-[#1a1a1a]/60 max-w-md mb-8">
      To use the archaeological detection suite, you must provide a Google Maps Platform API key.
    </p>
    <div className="bg-[#1a1a1a]/5 p-6 rounded-2xl text-left w-full max-w-md">
      <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3">Setup Instructions</p>
      <ol className="text-xs space-y-3 list-decimal list-inside opacity-70">
        <li>Get an API key from the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="underline font-bold">Google Cloud Console</a>.</li>
        <li>Open <strong>Settings</strong> (⚙️ gear icon) in AI Studio.</li>
        <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as a secret.</li>
        <li>The app will rebuild automatically.</li>
      </ol>
    </div>
  </div>
);

const AuthRequiredScreen = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-3xl border border-[#1a1a1a]/5 p-8 text-center">
    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white mb-6">
      <Lock className="w-8 h-8" />
    </div>
    <h2 className="font-serif text-2xl font-bold mb-4">Authentication Required</h2>
    <p className="text-sm text-[#1a1a1a]/60 max-w-md mb-8">
      Please sign in with Google to save your archaeological discoveries and access advanced satellite analysis.
    </p>
    <button 
      onClick={onSignIn}
      className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
    >
      Sign In with Google
    </button>
  </div>
);

const AnalysisOverlay = ({ isAnalyzing, progress }: { isAnalyzing: boolean; progress: string }) => (
  <AnimatePresence>
    {isAnalyzing && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-3xl"
      >
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-[#1a1a1a] animate-spin" />
            <Scan className="w-6 h-6 text-[#1a1a1a] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold">Scanning Terrain</h3>
            <p className="text-xs opacity-60 mt-1">{progress}</p>
          </div>
          <div className="w-full bg-[#1a1a1a]/5 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 10, ease: "linear" }}
              className="h-full bg-[#1a1a1a]"
            />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const DetectionMarker = ({ detection, onClick }: { detection: Detection; onClick: (d: Detection) => void }) => {
  const [markerRef] = useAdvancedMarkerRef();
  
  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: detection.lat, lng: detection.lng }}
      onClick={() => onClick(detection)}
    >
      <div className="relative group">
        <div className="absolute -inset-2 bg-yellow-400/20 rounded-full animate-ping" />
        <div className="relative bg-[#1a1a1a] text-white p-2 rounded-full border-2 border-yellow-400 shadow-lg transition-transform group-hover:scale-110">
          <Pickaxe className="w-4 h-4" />
        </div>
      </div>
    </AdvancedMarker>
  );
};

const MapControls = ({ onAnalyze }: { onAnalyze: () => void }) => {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <button 
        onClick={onAnalyze}
        className="bg-[#1a1a1a] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95"
      >
        <Scan className="w-5 h-5" />
        <span className="font-bold text-sm">Analyze View</span>
      </button>
      <div className="bg-white p-2 rounded-2xl shadow-lg flex flex-col gap-1 border border-[#1a1a1a]/5">
        <button 
          onClick={() => map?.setMapTypeId('satellite')}
          className="p-2 hover:bg-[#1a1a1a]/5 rounded-xl transition-all"
          title="Satellite View"
        >
          <Satellite className="w-5 h-5" />
        </button>
        <button 
          onClick={() => map?.setMapTypeId('roadmap')}
          className="p-2 hover:bg-[#1a1a1a]/5 rounded-xl transition-all"
          title="Map View"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function SatelliteAnalyzer() {
  const { user, signIn } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  // Load discoveries from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'discoveries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Detection[];
      setDetections(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'discoveries');
    });

    return () => unsubscribe();
  }, [user]);
  
  const handleAnalyze = async (map: google.maps.Map | null) => {
    if (!map || !user) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress('Capturing satellite imagery...');
    
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom() || 15;
    
    if (!currentCenter) return;
    
    const lat = currentCenter.lat();
    const lng = currentCenter.lng();
    
    try {
      // 1. Fetch static map image
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${currentZoom}&size=640x640&maptype=satellite&key=${API_KEY}`;
      
      setAnalysisProgress('Processing imagery with Gemini AI...');
      
      const response = await fetch(staticMapUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const base64Image = base64Data.split(',')[1];
      
      // 2. Analyze with Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const prompt = `Analyze this satellite image (centered at lat: ${lat}, lng: ${lng}, zoom: ${currentZoom}) for potential hidden archaeological sites, ancient cities, or structures. 
      Look for crop marks (differences in vegetation), soil marks (differences in soil color), geometric patterns, or unusual terrain features that suggest human-made structures.
      
      Provide the results in a JSON array of objects with the following fields:
      - name: A descriptive name for the find.
      - type: Type of structure (e.g., foundation, wall, mound, enclosure).
      - lat: Estimated latitude (calculate based on image center and zoom).
      - lng: Estimated longitude (calculate based on image center and zoom).
      - accessibility: One of 'Easy', 'Moderate', 'Difficult'.
      - confidence: 0-1 score.
      - description: A brief explanation of why this is a potential site.
      - features: Array of specific features seen (e.g., "rectangular outline", "circular depression").`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/)?.[1] || "image/png", data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                accessibility: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Difficult'] },
                confidence: { type: Type.NUMBER },
                description: { type: Type.STRING },
                features: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['name', 'type', 'lat', 'lng', 'accessibility', 'confidence', 'description', 'features']
            }
          }
        }
      });

      const text = result.text;
      if (!text) throw new Error('No text returned from Gemini');
      
      const jsonText = extractJson(text);
      const newDetectionsData = JSON.parse(jsonText);
      
      setAnalysisProgress('Saving discoveries to vault...');
      
      // Save to Firestore
      for (const d of newDetectionsData) {
        try {
          await addDoc(collection(db, 'discoveries'), {
            ...d,
            userId: user.uid,
            timestamp: Timestamp.now(),
            id: Math.random().toString(36).substr(2, 9) // Local ID for UI
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'discoveries');
        }
      }
      
      setAnalysisProgress('Analysis complete!');
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisProgress('Analysis failed. Please try again.');
    } finally {
      setTimeout(() => setIsAnalyzing(false), 2000);
    }
  };

  if (!hasValidKey) return <SplashScreen />;
  if (!user) return <AuthRequiredScreen onSignIn={signIn} />;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Satellite Archaeos</h2>
          <p className="text-sm opacity-60">Detect hidden ancient structures using multispectral satellite analysis.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/20">
            <CheckCircle2 className="w-4 h-4" />
            Live Analysis Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Map Area */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#1a1a1a]/5 bg-[#f5f2ed] shadow-inner">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: 31.1342, lng: 30.9413 }}
              defaultZoom={15}
              mapId="SATELLITE_ARCHAEOS_MAP"
              mapTypeId="satellite"
              {...({ internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'] } as any)}
              style={{ width: '100%', height: '100%' }}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              <MapContent 
                onAnalyze={handleAnalyze} 
              />
              
              {detections.map(d => (
                <DetectionMarker 
                  key={d.id} 
                  detection={d} 
                  onClick={setSelectedDetection} 
                />
              ))}

              {selectedDetection && (
                <InfoWindow
                  position={{ lat: selectedDetection.lat, lng: selectedDetection.lng }}
                  onCloseClick={() => setSelectedDetection(null)}
                >
                  <div className="p-2 max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-yellow-400 rounded-lg">
                        <Pickaxe className="w-4 h-4 text-[#1a1a1a]" />
                      </div>
                      <h3 className="font-bold text-sm">{selectedDetection.name}</h3>
                    </div>
                    <p className="text-xs opacity-70 mb-3">{selectedDetection.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        selectedDetection.accessibility === 'Easy' ? 'bg-green-100 text-green-700' :
                        selectedDetection.accessibility === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedDetection.accessibility} Access
                      </span>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDetection?.lat},${selectedDetection?.lng}`, '_blank')}
                        className="flex items-center gap-1 text-xs font-bold text-[#1a1a1a] hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
            <AnalysisOverlay isAnalyzing={isAnalyzing} progress={analysisProgress} />
          </APIProvider>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="bg-white rounded-3xl p-6 border border-[#1a1a1a]/5 shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Detections
            </h3>
            
            {detections.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#1a1a1a]/5 rounded-2xl">
                <Compass className="w-8 h-8 opacity-10 mx-auto mb-3" />
                <p className="text-xs opacity-40">No sites detected yet.<br/>Scan an area to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detections.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDetection(d)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedDetection?.id === d.id 
                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg' 
                        : 'bg-white border-[#1a1a1a]/5 hover:border-[#1a1a1a]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{d.type}</span>
                      <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${d.confidence > 0.8 ? 'text-yellow-400 fill-yellow-400' : 'opacity-20'}`} />
                        <span className="text-[10px] font-bold">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{d.name}</h4>
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="flex items-center gap-1 text-[10px]">
                        <MapPin className="w-3 h-3" />
                        {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        {d.accessibility === 'Easy' ? <Route className="w-3 h-3" /> : 
                         d.accessibility === 'Moderate' ? <Trees className="w-3 h-3" /> : 
                         <Mountain className="w-3 h-3" />}
                        {d.accessibility}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#1a1a1a] text-white rounded-3xl p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-400" />
              Analysis Guide
            </h3>
            <ul className="text-xs space-y-3 opacity-80">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1 shrink-0" />
                <span><strong>Crop Marks:</strong> Look for patterns in vegetation that reveal buried walls or ditches.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1 shrink-0" />
                <span><strong>Soil Marks:</strong> Color variations in ploughed fields often indicate ancient foundations.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1 shrink-0" />
                <span><strong>Shadow Marks:</strong> Low-sun angle imagery highlights subtle mounds and depressions.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapContent({ onAnalyze }: { 
  onAnalyze: (map: google.maps.Map | null) => void;
}) {
  const map = useMap();
  return <MapControls onAnalyze={() => onAnalyze(map)} />;
}

