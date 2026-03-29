'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, 
  Layout, 
  Calendar, 
  Heart, 
  Flame, 
  Loader2, 
  Sparkles, 
  Upload, 
  Camera,
  History,
  Globe,
  Languages,
  Info,
  ChevronRight,
  Download,
  Clock,
  Printer,
  User,
  ShieldAlert,
  Zap as TantraIcon,
  BookOpen,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Image from 'next/image';
import Markdown from 'react-markdown';

import { UserProfileData } from './UserProfile';

type ReadingType = 'palmistry' | 'tarot' | 'astrology' | 'compatibility' | 'rituals' | 'panchang' | 'face' | 'tantra';

function KundaliChart({ data }: { data: any }) {
  // A simple representation of a North Indian style Kundali chart
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto border-2 border-amber-900/20 bg-amber-50/30 rounded-xl overflow-hidden p-4">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className="border-r border-b border-amber-900/10" />
        <div className="border-b border-amber-900/10" />
        <div className="border-r border-amber-900/10" />
        <div className="" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-amber-900/20 rotate-45" />
        <div className="w-full h-px bg-amber-900/20 -rotate-45" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] h-[70%] border border-amber-900/20 rotate-45 flex items-center justify-center">
          <div className="rotate-[-45deg] text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900/40">Lagna</p>
            <p className="text-sm font-serif text-amber-900">{data?.lagna || 'Asc'}</p>
          </div>
        </div>
      </div>
      {/* Simulated Houses */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-900/60">1</div>
      <div className="absolute top-1/4 left-1/4 text-[10px] font-bold text-amber-900/60">2</div>
      <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[10px] font-bold text-amber-900/60">4</div>
      <div className="absolute bottom-1/4 left-1/4 text-[10px] font-bold text-amber-900/60">5</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-900/60">7</div>
      <div className="absolute bottom-1/4 right-1/4 text-[10px] font-bold text-amber-900/60">8</div>
      <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[10px] font-bold text-amber-900/60">10</div>
      <div className="absolute top-1/4 right-1/4 text-[10px] font-bold text-amber-900/60">11</div>
    </div>
  );
}

export default function MysticOracle({ globalLanguage, profile }: { globalLanguage: string, profile: UserProfileData }) {
  const [activeTab, setActiveTab] = useState<ReadingType>('astrology');
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [birthData, setBirthData] = useState({
    name: profile.name || '',
    date: profile.birthDate || '',
    time: profile.birthTime || '',
    place: profile.birthPlace || '',
    gender: profile.gender || 'male',
    partnerName: '',
    partnerDate: '',
    partnerPlace: '',
    partnerGender: 'female'
  });

  useEffect(() => {
    if (profile.isSetup) {
      setBirthData(prev => ({
        ...prev,
        name: profile.name,
        date: profile.birthDate,
        time: profile.birthTime,
        place: profile.birthPlace,
        gender: profile.gender
      }));
    }
  }, [profile]);

  const [focus, setFocus] = useState<string>('');

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

  const generateReading = async () => {
    setLoading(true);
    try {
      const ai = getGeminiModel();
      let prompt = '';

      switch (activeTab) {
        case 'palmistry':
          prompt = `Analyze this hand image for palmistry (Hast Rekha). 
          Identify major lines (Life, Heart, Head, Fate) and their implications. 
          Provide insights into personality, career, and health based on ancient Indian (Samudrika Shastra) and global palmistry traditions. 
          Include historical context of palmistry in different cultures.`;
          break;
        case 'face':
          prompt = `Perform a detailed Face Reading (Mukh Samudrika Shastra / Physiognomy) based on this image. 
          Analyze facial features (eyes, forehead, nose, chin, shape) to reveal personality traits, destiny, and health indicators. 
          Incorporate ancient Indian, Chinese (Mien Shiang), and Western traditions. 
          Explain the historical significance of face reading in royal courts and spiritual lineages.`;
          break;
        case 'tarot':
          prompt = `Perform a 3-card Tarot reading (Past, Present, Future). 
          Explain the symbolism of each card and how they relate to the user's current life path. 
          Incorporate global tarot traditions and the history of the cards.`;
          break;
        case 'astrology':
          prompt = `Generate a detailed Vedic Birth Chart (Kundali) analysis for:
          Name: ${birthData.name}
          Birth Date: ${birthData.date}
          Time: ${birthData.time}
          Place: ${birthData.place}
          
          Please provide:
          1. **Lagna (Ascendant)** and its significance.
          2. **Nakshatra** (Birth Star) and its characteristics.
          3. **Rashi** (Moon Sign) and its influence.
          4. **Planetary Positions** in houses.
          5. **Doshas** (like Mangal Dosha, Kaal Sarp) if any.
          6. **Life Predictions** (Career, Health, Relationships).
          7. **Remedies** (Upayas) according to Sanatana Dharma.
          
          Also, return a JSON block at the end with the key "chart_data" containing:
          { "lagna": "Sign Name", "houses": { "1": ["Planet1", "Planet2"], ... } }`;
          break;
        case 'compatibility':
          prompt = `Analyze Vedic compatibility (Ashta Kuta Guna Milan) between:
          Person 1: ${birthData.name} (${birthData.date}, ${birthData.place})
          Person 2: ${birthData.partnerName} (${birthData.partnerDate}, ${birthData.partnerPlace})
          
          Provide:
          1. **Guna Score** (out of 36).
          2. **Detailed Kuta Analysis** (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakut, Nadi).
          3. **Mangal Dosha** compatibility.
          4. **Final Recommendation** for the union.`;
          break;
        case 'rituals':
          prompt = `Provide guidance on ancient rituals, worship (Puja), and spiritual practices based on Sanatana Dharma. 
          Explain the history, procedure, and benefits of specific pujas (e.g., Satyanarayan Puja, Rudrabhishek). 
          Include information on sacred geometries (Yantras) and powerful Mantras. 
          Discuss the significance of Vedas and ancient scriptures in daily worship.`;
          break;
        case 'tantra':
          prompt = `Provide deep insights into the esoteric sciences of Tantra, Mantra, and Yantra. 
          Explain the concepts of Mantra Siddhis, the science of sound vibrations, and the use of Yantras as cosmic energy tools. 
          Discuss the history of Tantric traditions in India and their global influence. 
          Provide guidance on Vashikaran (as a science of attraction/influence) and other spiritual powers (Siddhis) within the ethical framework of Sanatana Dharma. 
          Include specific Mantras for spiritual growth and protection.`;
          break;
        case 'panchang':
          prompt = `Generate the Vedic Daily Almanac (Panchang) and Auspicious Timings (Muhurta) for:
          Date: ${birthData.date || new Date().toISOString().split('T')[0]}
          Place: ${birthData.place || 'Ujjain, India'}
          
          Include:
          1. **Tithi** (Lunar Day).
          2. **Nakshatra** (Star).
          3. **Yoga** and **Karana**.
          4. **Abhijit Muhurta** (Most auspicious time).
          5. **Rahu Kaal** (Inauspicious time to avoid).
          6. **Choghadiya** timings for the day.`;
          break;
      }

      const contents: any = { parts: [{ text: prompt }] };
      if ((activeTab === 'palmistry' || activeTab === 'face') && image) {
        contents.parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image.split(',')[1]
          }
        });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: (activeTab === 'palmistry' || activeTab === 'face') ? "gemini-2.5-flash" : "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: `You are an expert in ancient wisdom, Vedic astrology (Jyotish), Sanatana Dharma rituals, Tantra, Mantra, Yantra, palmistry, and spiritual sciences. 
          Provide deep, historical, and culturally rich insights. Use traditional terminology (Sanskrit) where appropriate but explain it clearly. 
          Focus on accuracy and profound spiritual depth.
          
          The user's gender is ${birthData.gender}.
          The output MUST be in the following language/style: ${
            globalLanguage === 'hi-sa' ? 'A mix of Hindi and Sanskrit (Sanatana Dharma style)' : 
            globalLanguage === 'hi' ? 'Pure Hindi' : 
            globalLanguage === 'sa' ? 'Sanskrit with Hindi explanations' : 
            'English'
          }.
          
          If a specific focus was selected (${focus}), prioritize that in the analysis.`
        }
      }));

      const text = response.text || "";
      
      // Extract chart data if present
      if (activeTab === 'astrology') {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*?"chart_data"[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            setChartData(data.chart_data || data);
          } catch (e) {
            console.error("Failed to parse chart data", e);
          }
        }
      }

      setReading(text || "The oracle is silent. Try again.");
    } catch (error) {
      console.error(error);
      setReading("An error occurred while consulting the stars.");
    } finally {
      setLoading(false);
      setFeedback(null);
    }
  };

  const downloadReading = () => {
    if (!reading) return;
    const blob = new Blob([reading], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mystic_reading_${activeTab}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReading = () => {
    if (!reading) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Mystic Oracle Reading - ${activeTab.toUpperCase()}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@400;600&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 60px; line-height: 1.8; color: #1a1a1a; background: #fff; }
              h1, h2, h3 { font-family: 'Cormorant Garamond', serif; color: #1a1a1a; }
              h1 { font-size: 32px; text-align: center; border-bottom: 2px solid #fef3c7; padding-bottom: 20px; margin-bottom: 40px; }
              .meta { text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.5; margin-bottom: 60px; }
              .content { font-size: 16px; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>MYSTIC ORACLE: ${activeTab.toUpperCase()}</h1>
            <div class="meta">
              Prepared for ${birthData.name} • Archaeos Digital Research Institute • ${new Date().toLocaleDateString()}
            </div>
            <div class="content">
              ${(reading || '').replace(/\n/g, '<br/>')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#1a1a1a]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-700">
              <History className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Mystic Oracle</h2>
          </div>
          <p className="text-lg text-[#1a1a1a]/60 max-w-2xl leading-relaxed">
            Consult the ancient wisdom of civilizations. From Vedic astrology to global palmistry, 
            unlock the secrets of your path through the lens of history and the stars.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#f5f2ed] p-2 rounded-[2rem] border border-[#1a1a1a]/5">
        {[
          { id: 'astrology', label: 'Birth Chart', icon: Calendar },
          { id: 'panchang', label: 'Muhurta', icon: Clock },
          { id: 'compatibility', label: 'Compatibility', icon: Heart },
          { id: 'palmistry', label: 'Palmistry', icon: Hand },
          { id: 'face', label: 'Face Reading', icon: User },
          { id: 'tarot', label: 'Tarot', icon: Layout },
          { id: 'rituals', label: 'Rituals', icon: Flame },
          { id: 'tantra', label: 'Tantra & Mantra', icon: TantraIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as ReadingType);
              setReading(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg' 
                : 'text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Consultation Details
            </h3>

            {(activeTab === 'palmistry' || activeTab === 'face') && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-[#f5f2ed] rounded-3xl border-2 border-dashed border-[#1a1a1a]/10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f5f2ed]/70 transition-all overflow-hidden relative"
                >
                  {image ? (
                    <Image 
                      src={image} 
                      alt="Reading Subject" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <Camera className="w-12 h-12 opacity-20 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Upload {activeTab === 'palmistry' ? 'Hand' : 'Face'} Image</p>
                      <p className="text-[10px] opacity-30 mt-2">Clear photo for analysis</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            )}

            {(activeTab === 'astrology' || activeTab === 'compatibility' || activeTab === 'panchang') && (
              <div className="space-y-4">
                {activeTab !== 'panchang' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</label>
                      <input 
                        type="text" 
                        value={birthData.name}
                        onChange={(e) => setBirthData({...birthData, name: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gender</label>
                      <select 
                        value={birthData.gender}
                        onChange={(e) => setBirthData({...birthData, gender: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">{activeTab === 'panchang' ? 'Select Date' : 'Birth Date'}</label>
                    <input 
                      type="date" 
                      value={birthData.date}
                      onChange={(e) => setBirthData({...birthData, date: e.target.value})}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  {activeTab !== 'panchang' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Time</label>
                      <input 
                        type="time" 
                        value={birthData.time}
                        onChange={(e) => setBirthData({...birthData, time: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">{activeTab === 'panchang' ? 'Location' : 'Birth Place'}</label>
                  <input 
                    type="text" 
                    value={birthData.place}
                    onChange={(e) => setBirthData({...birthData, place: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="City, Country"
                  />
                </div>

                {activeTab === 'compatibility' && (
                  <div className="pt-4 border-t border-[#1a1a1a]/5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Partner Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Partner Name</label>
                        <input 
                          type="text" 
                          value={birthData.partnerName}
                          onChange={(e) => setBirthData({...birthData, partnerName: e.target.value})}
                          className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                          placeholder="Enter partner's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Partner Gender</label>
                        <select 
                          value={birthData.partnerGender}
                          onChange={(e) => setBirthData({...birthData, partnerGender: e.target.value})}
                          className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Partner Birth Date</label>
                      <input 
                        type="date" 
                        value={birthData.partnerDate}
                        onChange={(e) => setBirthData({...birthData, partnerDate: e.target.value})}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-[#1a1a1a]/5">
              <div className="flex items-center gap-2 mb-4 opacity-40">
                <Languages className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Global Language Active</span>
              </div>
              <p className="text-[10px] opacity-30 leading-relaxed">
                The oracle is currently synchronized with the global language setting: <span className="font-bold">{globalLanguage.toUpperCase()}</span>. 
                Change this in the main header to update all tools.
              </p>
            </div>

            {activeTab === 'tarot' && (
              <div className="py-12 text-center">
                <Layout className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm opacity-50 italic">Focus on your question and the oracle will draw the cards for you.</p>
              </div>
            )}

            {activeTab === 'rituals' && (
              <div className="space-y-4">
                <p className="text-sm opacity-50 italic mb-4">Select a focus for ritual guidance:</p>
                <div className="grid grid-cols-1 gap-2">
                  {['Prosperity & Wealth', 'Health & Healing', 'Peace & Meditation', 'Protection & Shielding', 'Ancestral Worship'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFocus(f)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                        focus === f ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-[#f5f2ed] hover:bg-amber-50'
                      }`}
                    >
                      {f} <ChevronRight className="w-3 h-3 opacity-30" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tantra' && (
              <div className="space-y-6">
                <p className="text-sm opacity-50 italic mb-4">Select an esoteric focus:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'shanti', label: 'Shanti (Peace)', icon: '🕊️' },
                    { id: 'vashikaran', label: 'Vashikaran (Influence)', icon: '🌀' },
                    { id: 'stambhan', label: 'Stambhan (Stopping)', icon: '🛑' },
                    { id: 'vidweshan', label: 'Vidweshan (Separation)', icon: '⚡' },
                    { id: 'uchatan', label: 'Uchatan (Removal)', icon: '💨' },
                    { id: 'maran', label: 'Maran (Protection)', icon: '🛡️' },
                    { id: 'beej', label: 'Beej Mantras', icon: '🌱' },
                    { id: 'siddhi', label: 'Siddhi (Attainment)', icon: '✨' },
                    { id: 'yantra', label: 'Yantra Science', icon: '📐' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFocus(item.label)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                        focus === item.label 
                          ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm' 
                          : 'bg-[#f5f2ed] border-transparent hover:border-amber-200'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl">
                  <p className="text-[9px] text-amber-800 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Esoteric Warning
                  </p>
                  <p className="text-[10px] text-amber-700 leading-relaxed italic">
                    Tantra and Mantra are powerful sciences. They should be practiced with pure intent and under guidance. Misuse can lead to karmic imbalances.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={generateReading}
              disabled={loading || ((activeTab === 'palmistry' || activeTab === 'face') && !image)}
              className="w-full mt-8 bg-[#1a1a1a] text-[#f5f2ed] py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Consult Oracle</>}
            </button>
          </div>

          <div className="bg-amber-900 text-amber-50 rounded-[2rem] p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-lg">Global Wisdom</h3>
            </div>
            <p className="text-xs opacity-70 leading-relaxed">
              Our oracle integrates knowledge from diverse cultures: Vedic, Western, Chinese, Mayan, and more. 
              India&apos;s vast spiritual history serves as the core, connecting global seekers to ancient truths.
            </p>
          </div>
        </div>

        {/* Reading Area */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Oracle&apos;s Revelation</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-40">Ancient Knowledge Synthesis</p>
                </div>
              </div>
              {reading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReading(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f5f2ed] text-[#1a1a1a] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={printReading}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                    title="Print / Export PDF"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadReading}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-600"
                    title="Download Markdown"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar" id="printable-oracle-reading">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-serif text-xl italic">Consulting the Akasha...</p>
                </div>
              ) : reading ? (
                <div className="space-y-8">
                  {activeTab === 'astrology' && chartData && (
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-900/10">
                      <h4 className="text-center font-serif text-lg mb-4 text-amber-900">Vedic Birth Chart (Lagna Kundali)</h4>
                      <KundaliChart data={chartData} />
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal prose-amber">
                    <Markdown>{reading}</Markdown>
                  </div>

                  {/* Feedback Mechanism */}
                  <div className="mt-12 pt-8 border-t border-[#1a1a1a]/5 flex flex-col items-center gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Was this reading helpful?</p>
                    <div className="flex items-center gap-4">
                      {feedback === null ? (
                        <>
                          <button 
                            onClick={() => setFeedback('up')}
                            className="flex items-center gap-2 px-6 py-3 bg-[#f5f2ed] hover:bg-emerald-50 hover:text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest transition-all border border-transparent hover:border-emerald-100"
                          >
                            <ThumbsUp className="w-4 h-4" /> Yes
                          </button>
                          <button 
                            onClick={() => setFeedback('down')}
                            className="flex items-center gap-2 px-6 py-3 bg-[#f5f2ed] hover:bg-rose-50 hover:text-rose-700 rounded-full text-xs font-bold uppercase tracking-widest transition-all border border-transparent hover:border-rose-100"
                          >
                            <ThumbsDown className="w-4 h-4" /> No
                          </button>
                        </>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-emerald-600 font-serif italic"
                        >
                          <Sparkles className="w-4 h-4" />
                          Thank you for your feedback, seeker.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <Sparkles className="w-16 h-16 mb-6" />
                  <p className="font-serif text-2xl italic">The revelation awaits your details.</p>
                  <p className="text-xs mt-4 max-w-xs">Provide your birth details or upload a palm image to begin the ancient consultation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
