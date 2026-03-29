import React, { useState, useEffect } from 'react';
import { 
  Search, Satellite, Scan, Pickaxe, History, Compass, 
  Star, MapPin, Route, Trees, Mountain, Info, Loader2,
  Lock, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore';

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
  imageUrl?: string;
}

interface NasaImage {
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  thumb_url: string;
  image_url: string;
}

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

export default function SatelliteAnalyzer() {
  const { user, signIn } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('Nazca Lines');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NasaImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<NasaImage | null>(null);

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

  const searchNasaImages = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(searchQuery)}&media_type=image`);
      const data = await response.json();
      
      const items = data.collection.items.slice(0, 12).map((item: any) => {
        const links = item.links || [];
        const thumb = links.find((l: any) => l.rel === 'preview')?.href;
        const small = links.find((l: any) => l.href?.includes('~small'))?.href;
        const orig = links.find((l: any) => l.href?.includes('~orig'))?.href;
        
        // Try to get small or orig image, fallback to thumb
        const image = small || orig || thumb;
        
        return {
          nasa_id: item.data[0].nasa_id,
          title: item.data[0].title,
          description: item.data[0].description,
          date_created: item.data[0].date_created,
          thumb_url: thumb,
          image_url: image
        };
      }).filter((item: NasaImage) => item.thumb_url);
      
      setSearchResults(items);
      if (items.length > 0) {
        setSelectedImage(items[0]);
      } else {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error fetching NASA images:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Initial search
  useEffect(() => {
    searchNasaImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleAnalyze = async () => {
    if (!selectedImage || !user) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress('Fetching high-res imagery from NASA...');
    
    try {
      // 1. Fetch the image and convert to base64
      let response = await fetch(selectedImage.image_url);
      let blob = await response.blob();
      
      // If NASA returns XML (like AccessDenied for missing resolutions), fallback to thumbnail
      if (blob.type.includes('xml') || blob.type === 'text/html') {
        response = await fetch(selectedImage.thumb_url);
        blob = await response.blob();
      }
      
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const base64Image = base64Data.split(',')[1];
      
      setAnalysisProgress('Processing imagery with Gemini AI...');
      
      // 2. Analyze with Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const prompt = `Analyze this satellite/aerial image from NASA (Title: "${selectedImage.title}") for potential hidden archaeological sites, ancient cities, or structures. 
      Look for crop marks (differences in vegetation), soil marks (differences in soil color), geometric patterns, or unusual terrain features that suggest human-made structures.
      
      Provide the results in a JSON array of objects with the following fields:
      - name: A descriptive name for the find.
      - type: Type of structure (e.g., foundation, wall, mound, enclosure, geoglyph).
      - lat: Estimated latitude (use 0 if unknown).
      - lng: Estimated longitude (use 0 if unknown).
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
              { inlineData: { mimeType: blob.type || "image/jpeg", data: base64Image } }
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
      
      const newDetectionsData = JSON.parse(text);
      
      setAnalysisProgress('Saving discoveries to vault...');
      
      // Save to Firestore
      for (const d of newDetectionsData) {
        try {
          await addDoc(collection(db, 'discoveries'), {
            ...d,
            userId: user.uid,
            timestamp: Timestamp.now(),
            imageUrl: selectedImage.image_url,
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

  if (!user) return <AuthRequiredScreen onSignIn={signIn} />;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">NASA Satellite Archaeos</h2>
          <p className="text-sm opacity-60">Detect hidden ancient structures using free NASA satellite imagery.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500/20">
            <Satellite className="w-4 h-4" />
            NASA API Connected
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Main Area */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Search Bar */}
          <form onSubmit={searchNasaImages} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NASA archives (e.g., 'Giza', 'Nazca', 'Stonehenge')"
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#1a1a1a]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Image Viewer */}
          <div className="flex-1 relative rounded-3xl overflow-hidden border border-[#1a1a1a]/5 bg-[#1a1a1a] shadow-inner flex flex-col">
            {selectedImage ? (
              <>
                <div className="flex-1 relative">
                  <img 
                    src={selectedImage.image_url} 
                    alt={selectedImage.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="font-serif text-2xl font-bold mb-2">{selectedImage.title}</h3>
                    <p className="text-sm opacity-80 line-clamp-2 max-w-2xl">{selectedImage.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-white text-[#1a1a1a] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                      >
                        <Scan className="w-5 h-5" />
                        Analyze with AI
                      </button>
                      <a 
                        href={`https://images.nasa.gov/details-${selectedImage.nasa_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on NASA
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Search for a location to view NASA satellite imagery.</p>
              </div>
            )}
            <AnalysisOverlay isAnalyzing={isAnalyzing} progress={analysisProgress} />
          </div>

          {/* Thumbnails */}
          <div className="h-24 flex gap-2 overflow-x-auto pb-2 shrink-0">
            {searchResults.map((img) => (
              <button
                key={img.nasa_id}
                onClick={() => setSelectedImage(img)}
                className={`relative h-full aspect-video rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  selectedImage?.nasa_id === img.nasa_id ? 'border-[#1a1a1a] scale-95' : 'border-transparent hover:border-[#1a1a1a]/20'
                }`}
              >
                <img src={img.thumb_url} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
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
                <p className="text-xs opacity-40">No sites detected yet.<br/>Analyze an image to begin.</p>
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
                      {d.lat !== 0 && d.lng !== 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <MapPin className="w-3 h-3" />
                          {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                        </div>
                      )}
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

          {selectedDetection && (
            <div className="bg-[#1a1a1a] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Pickaxe className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-yellow-400 rounded-xl">
                    <Pickaxe className="w-5 h-5 text-[#1a1a1a]" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">{selectedDetection.name}</h3>
                </div>
                <p className="text-sm opacity-80 mb-4">{selectedDetection.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Features Detected</h4>
                    <ul className="text-sm space-y-1">
                      {selectedDetection.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedDetection.imageUrl && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Source Image</h4>
                      <img src={selectedDetection.imageUrl} alt="Source" className="w-full h-24 object-cover rounded-xl border border-white/10" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
