import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, MapPin, Calendar, Clock, User, Moon, Sun, Star, Crosshair, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { appDB } from '../lib/db';

interface KundliData {
  basicDetails: {
    rashi: string;
    nakshatra: string;
    lagna: string;
    sunSign: string;
  };
  planetaryPositions: {
    planet: string;
    house: number;
    sign: string;
  }[];
  lifePredictions: {
    childhood: string;
    education: string;
    career: string;
    marriage: string;
    health: string;
    oldAge: string;
  };
  dashaAnalysis: {
    period: string;
    prediction: string;
  }[];
  remedies: string[];
}

export default function KundliGenerator({ globalLanguage }: { globalLanguage: string }) {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    tob: '',
    pob: '',
    gender: 'male'
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [kundliData, setKundliData] = useState<KundliData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentDateTime();
  }, []);

  const setCurrentDateTime = () => {
    const now = new Date();
    // Format to YYYY-MM-DD
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    // Format to HH:MM
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    setFormData(prev => ({
      ...prev,
      dob: dateStr,
      tob: timeStr
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            const country = data.address.country || '';
            const locationStr = [city, state, country].filter(Boolean).join(', ');
            setFormData(prev => ({ ...prev, pob: locationStr }));
          } else {
            setFormData(prev => ({ ...prev, pob: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
        } catch (error) {
          console.error("Error fetching location details:", error);
          setFormData(prev => ({ ...prev, pob: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` }));
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please enter it manually.");
        setLocating(false);
      }
    );
  };

  const generateKundli = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setKundliData(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const prompt = `Generate a detailed Vedic Astrology Kundli (Birth Chart) and whole life prediction (Janm se Mritu tak) for the following person:
      Name: ${formData.name}
      Date of Birth: ${formData.dob}
      Time of Birth: ${formData.tob}
      Place of Birth: ${formData.pob}
      Gender: ${formData.gender}
      Language: ${globalLanguage === 'hi' || globalLanguage === 'hi-sa' ? 'Hindi' : 'English'}

      Please provide a comprehensive analysis covering basic astrological details, planetary positions, detailed life predictions across different stages (childhood, education, career, marriage, health, old age), major Dasha periods, and suggested remedies.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              basicDetails: {
                type: Type.OBJECT,
                properties: {
                  rashi: { type: Type.STRING, description: 'Moon Sign (Rashi)' },
                  nakshatra: { type: Type.STRING, description: 'Birth Star (Nakshatra)' },
                  lagna: { type: Type.STRING, description: 'Ascendant (Lagna)' },
                  sunSign: { type: Type.STRING, description: 'Sun Sign' }
                },
                required: ['rashi', 'nakshatra', 'lagna', 'sunSign']
              },
              planetaryPositions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    planet: { type: Type.STRING },
                    house: { type: Type.INTEGER },
                    sign: { type: Type.STRING }
                  },
                  required: ['planet', 'house', 'sign']
                },
                description: 'Positions of major planets in houses and signs'
              },
              lifePredictions: {
                type: Type.OBJECT,
                properties: {
                  childhood: { type: Type.STRING, description: 'Predictions for childhood and early life' },
                  education: { type: Type.STRING, description: 'Predictions for education and learning' },
                  career: { type: Type.STRING, description: 'Predictions for career, wealth, and profession' },
                  marriage: { type: Type.STRING, description: 'Predictions for marriage and relationships' },
                  health: { type: Type.STRING, description: 'Predictions for health and longevity' },
                  oldAge: { type: Type.STRING, description: 'Predictions for old age and spiritual journey' }
                },
                required: ['childhood', 'education', 'career', 'marriage', 'health', 'oldAge']
              },
              dashaAnalysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    period: { type: Type.STRING, description: 'Name and duration of the Dasha period' },
                    prediction: { type: Type.STRING, description: 'Prediction for this specific period' }
                  },
                  required: ['period', 'prediction']
                },
                description: 'Analysis of major planetary periods (Mahadasha)'
              },
              remedies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Suggested astrological remedies'
              }
            },
            required: ['basicDetails', 'planetaryPositions', 'lifePredictions', 'dashaAnalysis', 'remedies']
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setKundliData(data);
        // Save to IndexedDB
        try {
          await appDB.set('kundli_store', 'latest_kundli', data);
        } catch (e) {
          console.error("Failed to save Kundli to IndexedDB", e);
        }
      } else {
        setError('Failed to generate Kundli. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating the Kundli.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Star className="w-64 h-64 -mt-16 -mr-16" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Moon className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Kundli Generator</h1>
              <p className="text-sm opacity-80 uppercase tracking-widest mt-1">Whole Life Data (Janm se Mritu tak)</p>
            </div>
          </div>
          <p className="text-[#f5f2ed]/80 leading-relaxed">
            Generate a comprehensive Vedic Astrology birth chart and detailed life predictions based on your exact birth details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={generateKundli} className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 space-y-8">
            <div className="flex items-center gap-3 border-b border-[#1a1a1a]/10 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-xl font-bold">Birth Details</h2>
            </div>
            
            <div className="space-y-6">
              {/* Personal Info Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-2">
                  <User className="w-3 h-3" /> Personal Info
                </h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Time Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3" /> Birth Time
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60">Date of Birth</label>
                    <button 
                      type="button" 
                      onClick={setCurrentDateTime}
                      className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Current
                    </button>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2">Time of Birth</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
                    <input
                      type="time"
                      required
                      value={formData.tob}
                      onChange={(e) => setFormData({...formData, tob: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3" /> Birth Place
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60">Place of Birth</label>
                    <button 
                      type="button" 
                      onClick={getCurrentLocation}
                      disabled={locating}
                      className="text-[10px] uppercase tracking-widest font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />} 
                      {locating ? 'Locating...' : 'Locate Me'}
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
                    <input
                      type="text"
                      required
                      value={formData.pob}
                      onChange={(e) => setFormData({...formData, pob: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Kundli...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Generate Life Predictions
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-full min-h-[400px] bg-white rounded-3xl border border-[#1a1a1a]/5 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <Sun className="w-16 h-16 text-yellow-500 animate-spin-slow absolute opacity-20" />
                <Moon className="w-16 h-16 text-[#1a1a1a] animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold mb-2">Calculating Planetary Positions</h3>
                <p className="text-[#1a1a1a]/60 text-sm max-w-md mx-auto">
                  Analyzing cosmic alignments at your exact time of birth to generate your whole life predictions...
                </p>
              </div>
            </div>
          ) : kundliData ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Basic Details */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-600" />
                  Astrological Profile
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#f5f2ed] rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-1">Lagna (Ascendant)</p>
                    <p className="font-serif text-lg font-bold text-[#1a1a1a]">{kundliData.basicDetails.lagna}</p>
                  </div>
                  <div className="p-4 bg-[#f5f2ed] rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-1">Rashi (Moon Sign)</p>
                    <p className="font-serif text-lg font-bold text-[#1a1a1a]">{kundliData.basicDetails.rashi}</p>
                  </div>
                  <div className="p-4 bg-[#f5f2ed] rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-1">Nakshatra</p>
                    <p className="font-serif text-lg font-bold text-[#1a1a1a]">{kundliData.basicDetails.nakshatra}</p>
                  </div>
                  <div className="p-4 bg-[#f5f2ed] rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-1">Sun Sign</p>
                    <p className="font-serif text-lg font-bold text-[#1a1a1a]">{kundliData.basicDetails.sunSign}</p>
                  </div>
                </div>
              </div>

              {/* Life Predictions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Life Journey (Janm se Mritu tak)
                </h3>
                <div className="space-y-6">
                  <div className="relative pl-6 border-l-2 border-indigo-100">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Childhood & Early Life</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.childhood}</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-blue-100">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Education & Learning</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.education}</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-emerald-100">
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Career & Wealth</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.career}</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-rose-100">
                    <div className="absolute w-3 h-3 bg-rose-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Marriage & Relationships</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.marriage}</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-amber-100">
                    <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Health & Longevity</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.health}</p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-purple-100">
                    <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1"></div>
                    <h4 className="font-bold text-[#1a1a1a] mb-2">Old Age & Spiritual Journey</h4>
                    <p className="text-[#1a1a1a]/70 text-sm leading-relaxed">{kundliData.lifePredictions.oldAge}</p>
                  </div>
                </div>
              </div>

              {/* Dasha Analysis */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Major Dasha Periods
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kundliData.dashaAnalysis.map((dasha, index) => (
                    <div key={index} className="p-4 bg-[#f5f2ed] rounded-2xl">
                      <h4 className="font-bold text-[#1a1a1a] mb-2 text-sm">{dasha.period}</h4>
                      <p className="text-[#1a1a1a]/70 text-xs leading-relaxed">{dasha.prediction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planetary Positions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-orange-500" />
                  Planetary Positions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 bg-[#f5f2ed]">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Planet</th>
                        <th className="px-4 py-3">House</th>
                        <th className="px-4 py-3 rounded-r-xl">Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kundliData.planetaryPositions.map((pos, index) => (
                        <tr key={index} className="border-b border-[#1a1a1a]/5 last:border-0">
                          <td className="px-4 py-3 font-medium text-[#1a1a1a]">{pos.planet}</td>
                          <td className="px-4 py-3 text-[#1a1a1a]/70">{pos.house}</td>
                          <td className="px-4 py-3 text-[#1a1a1a]/70">{pos.sign}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remedies */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Suggested Remedies
                </h3>
                <ul className="space-y-3">
                  {kundliData.remedies.map((remedy, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-[#1a1a1a]/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{remedy}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] bg-white/50 rounded-3xl border border-[#1a1a1a]/5 border-dashed flex flex-col items-center justify-center p-8 text-center">
              <Moon className="w-12 h-12 text-[#1a1a1a]/20 mb-4" />
              <h3 className="font-serif text-lg font-bold text-[#1a1a1a]/40 mb-2">Awaiting Birth Details</h3>
              <p className="text-[#1a1a1a]/40 text-sm max-w-sm">
                Enter your birth details in the form to generate your complete life predictions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
