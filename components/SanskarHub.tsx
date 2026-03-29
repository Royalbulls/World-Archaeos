'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Heart, 
  Baby, 
  BookOpen, 
  Users, 
  Flame, 
  ChevronRight, 
  Info,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Utensils,
  Scissors,
  Music,
  GraduationCap,
  Shield,
  Star,
  Plus,
  X
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  History, Heart, Baby, BookOpen, Users, Flame, Sparkles, Sun, Moon, Utensils, Scissors, Music, GraduationCap, Shield, Star
};

interface Sanskar {
  id: string;
  name: string;
  category: 'pre-birth' | 'childhood' | 'grihastha';
  description: string;
  significance: string;
  icon: any;
  isCustom?: boolean;
  iconName?: string;
}

const SANSKARS: Sanskar[] = [
  // 1. Janm se Pehle
  { 
    id: 'garbhadhan', 
    name: 'Garbhadhan', 
    category: 'pre-birth', 
    description: 'The first sacrament performed for the attainment of a noble child.', 
    significance: 'Focuses on the physical and spiritual preparation of parents to welcome a new soul.',
    icon: Heart
  },
  { 
    id: 'pumsavan', 
    name: 'Pumsavan', 
    category: 'pre-birth', 
    description: 'Performed for the mental and physical development of the fetus.', 
    significance: 'Ensures the health and well-being of the unborn child.',
    icon: Sparkles
  },
  { 
    id: 'simantonayan', 
    name: 'Simantonayan', 
    category: 'pre-birth', 
    description: 'Performed to keep the pregnant woman mentally peaceful and happy.', 
    significance: 'Recognizes the impact of the mother\'s state of mind on the child.',
    icon: Moon
  },
  // 2. Bachpan aur Shiksha
  { 
    id: 'jatakarma', 
    name: 'Jatakarma', 
    category: 'childhood', 
    description: 'Performed by the father immediately after the birth of the child.', 
    significance: 'Welcomes the child into the family and establishes the father-child bond.',
    icon: Baby
  },
  { 
    id: 'namkaran', 
    name: 'Namkaran', 
    category: 'childhood', 
    description: 'Naming the child on the 11th or 12th day after birth.', 
    significance: 'Establishes the child\'s identity based on cosmic vibrations (Nakshatra).',
    icon: Music
  },
  { 
    id: 'nishkramana', 
    name: 'Nishkramana', 
    category: 'childhood', 
    description: 'Taking the child out of the house for the first time to see the Sun and Moon.', 
    significance: 'Introduces the child to the natural world and cosmic elements.',
    icon: Sun
  },
  { 
    id: 'annaprashana', 
    name: 'Annaprashana', 
    category: 'childhood', 
    description: 'Feeding the child solid food (Ann) for the first time.', 
    significance: 'Marks the transition from a liquid to a solid diet, essential for growth.',
    icon: Utensils
  },
  { 
    id: 'chudakarana', 
    name: 'Chudakarana (Mundan)', 
    category: 'childhood', 
    description: 'Cutting the child\'s hair for the first time for purification.', 
    significance: 'Symbolizes the shedding of past life impressions and mental purification.',
    icon: Scissors
  },
  { 
    id: 'karnavedha', 
    name: 'Karnavedha', 
    category: 'childhood', 
    description: 'The sacrament of piercing the ears.', 
    significance: 'Believed to have health benefits and enhances the child\'s beauty.',
    icon: Sparkles
  },
  { 
    id: 'vidyarambha', 
    name: 'Vidyarambha', 
    category: 'childhood', 
    description: 'The beginning of formal education and learning of alphabets.', 
    significance: 'Marks the start of the intellectual journey.',
    icon: BookOpen
  },
  { 
    id: 'upanayana', 
    name: 'Upanayana (Janeu)', 
    category: 'childhood', 
    description: 'Wearing the sacred thread and going to the Guru for education.', 
    significance: 'The "second birth" into the world of spiritual and social responsibility.',
    icon: Shield
  },
  { 
    id: 'vedarambha', 
    name: 'Vedarambha', 
    category: 'childhood', 
    description: 'Starting the study of Vedas and religious scriptures.', 
    significance: 'Focuses on deep spiritual and philosophical learning.',
    icon: History
  },
  { 
    id: 'keshanta', 
    name: 'Keshanta', 
    category: 'childhood', 
    description: 'The first shaving of the beard and mustache during education.', 
    significance: 'Marks the transition from childhood to youth within the Gurukul.',
    icon: Scissors
  },
  { 
    id: 'samavartana', 
    name: 'Samavartana', 
    category: 'childhood', 
    description: 'Returning home from the Gurukul after completing education.', 
    significance: 'The graduation ceremony, preparing for the next stage of life.',
    icon: GraduationCap
  },
  // 3. Grihastha
  { 
    id: 'vivaha', 
    name: 'Vivaha', 
    category: 'grihastha', 
    description: 'The most important sacrament, entering into married life.', 
    significance: 'The foundation of social and family life, fulfilling Dharma together.',
    icon: Users
  },
  { 
    id: 'antyesti', 
    name: 'Antyesti', 
    category: 'grihastha', 
    description: 'The final sacrament performed after death (Agni Sanskar).', 
    significance: 'Helps the soul attain liberation (Mukti) and return to the elements.',
    icon: Flame
  },
];

export default function SanskarHub() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pre-birth' | 'childhood' | 'grihastha'>('all');
  const [activeSanskar, setActiveSanskar] = useState<Sanskar | null>(null);
  const [ritualStep, setRitualStep] = useState<number>(0);
  const [isRitualActive, setIsRitualActive] = useState(false);
  
  const [customSanskars, setCustomSanskars] = useState<Sanskar[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newSanskar, setNewSanskar] = useState({
    name: '',
    category: 'childhood' as 'pre-birth' | 'childhood' | 'grihastha',
    description: '',
    significance: '',
    iconName: 'Star'
  });

  useEffect(() => {
    const saved = localStorage.getItem('custom_sanskars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loaded = parsed.map((s: any) => ({
          ...s,
          icon: ICON_MAP[s.iconName] || Star
        }));
        setCustomSanskars(loaded);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAddCustom = () => {
    if (!newSanskar.name || !newSanskar.description || !newSanskar.significance) {
      alert("Please fill all fields");
      return;
    }
    
    const sanskar: Sanskar = {
      id: `custom-${Date.now()}`,
      name: newSanskar.name,
      category: newSanskar.category,
      description: newSanskar.description,
      significance: newSanskar.significance,
      icon: ICON_MAP[newSanskar.iconName] || Star,
      isCustom: true,
      iconName: newSanskar.iconName
    };

    const updated = [...customSanskars, sanskar];
    setCustomSanskars(updated);
    
    const toSave = updated.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      significance: s.significance,
      iconName: s.iconName,
      isCustom: true
    }));
    localStorage.setItem('custom_sanskars', JSON.stringify(toSave));

    setIsAddingCustom(false);
    setNewSanskar({
      name: '',
      category: 'childhood',
      description: '',
      significance: '',
      iconName: 'Star'
    });
  };

  const allSanskars = [...SANSKARS, ...customSanskars];
  const filteredSanskars = selectedCategory === 'all' 
    ? allSanskars 
    : allSanskars.filter(s => s.category === selectedCategory);

  const startRitual = (sanskar: Sanskar) => {
    if (sanskar.id === 'namkaran') {
      // Logic handled by parent to switch tab would be better, 
      // but for now we'll show a guided mini-version or alert
      alert("Please use the dedicated 'Namkaran' tab for the full ceremony!");
      return;
    }
    setActiveSanskar(sanskar);
    setIsRitualActive(true);
    setRitualStep(1);
  };

  const RITUAL_STEPS: Record<string, { title: string; desc: string; action?: string }[]> = {
    'vidyarambha': [
      { title: 'Purification', desc: 'Bathe the child and dress them in new clothes. Offer prayers to Goddess Saraswati.', action: 'Light Incense' },
      { title: 'Saraswati Puja', desc: 'Place a book, pen, and an idol of Saraswati on a clean platform.', action: 'Offer Flowers' },
      { title: 'The First Letter', desc: 'Hold the child\'s hand and help them write "Om" or the first alphabet in a plate of rice.', action: 'Write Om' },
      { title: 'Blessings', desc: 'The Guru or elder blesses the child for a life of wisdom.', action: 'Receive Ashirwad' }
    ],
    'annaprashana': [
      { title: 'Preparation', desc: 'Prepare a pure dish of Kheer (rice pudding) or honey and curd.', action: 'Prepare Food' },
      { title: 'Offering', desc: 'Offer the food to the family deity first.', action: 'Offer to Deity' },
      { title: 'First Bite', desc: 'The maternal uncle or father feeds the child a tiny portion of the blessed food.', action: 'Feed Child' },
      { title: 'The Choice', desc: 'Place objects (book, gold, pen, soil) before the child. What they touch first hints at their future interest.', action: 'Observe Choice' }
    ],
    'chudakarana': [
      { title: 'Auspicious Time', desc: 'The ritual begins at the calculated Muhurat with a small Homa.', action: 'Start Homa' },
      { title: 'The First Snip', desc: 'The father or priest snips a small lock of hair while chanting mantras.', action: 'Snip Hair' },
      { title: 'Complete Shave', desc: 'The barber completes the shave, leaving a small tuft (Shikha).', action: 'Complete Shave' },
      { title: 'Cooling', desc: 'Apply sandalwood paste to the child\'s head to cool and protect the scalp.', action: 'Apply Chandan' }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-100">
          <Sparkles className="w-3 h-3" />
          Shodasha Sanskar
        </div>
        <h2 className="font-serif text-5xl text-[#1a1a1a]">The 16 Sacraments</h2>
        <p className="text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto leading-relaxed">
          In Sanatan Dharma, life is a series of 16 sacred milestones designed to purify and discipline the human journey from conception to the final transition.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4">
        {[
          { id: 'all', label: 'All Sanskars', icon: History },
          { id: 'pre-birth', label: 'Pre-Birth', icon: Heart },
          { id: 'childhood', label: 'Childhood & Education', icon: Baby },
          { id: 'grihastha', label: 'Adulthood & Final', icon: Flame },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-6 py-3 rounded-2xl flex items-center gap-3 transition-all ${
              selectedCategory === cat.id 
                ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg' 
                : 'bg-white text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 border border-[#1a1a1a]/5'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">{cat.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsAddingCustom(true)}
          className="px-6 py-3 rounded-2xl flex items-center gap-3 transition-all bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Add Custom</span>
        </button>
      </div>

      {/* Add Custom Sanskar Modal */}
      <AnimatePresence>
        {isAddingCustom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#f5f2ed] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsAddingCustom(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-all z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-12 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl">Add Custom Sanskar</h3>
                    <p className="text-sm opacity-60">Define a new milestone or family tradition.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-2">Name</label>
                    <input
                      type="text"
                      value={newSanskar.name}
                      onChange={e => setNewSanskar({...newSanskar, name: e.target.value})}
                      className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., First Step Ceremony"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-2">Category</label>
                    <select
                      value={newSanskar.category}
                      onChange={e => setNewSanskar({...newSanskar, category: e.target.value as any})}
                      className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="pre-birth">Pre-Birth</option>
                      <option value="childhood">Childhood & Education</option>
                      <option value="grihastha">Adulthood & Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-2">Icon</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.keys(ICON_MAP).map(iconName => {
                        const IconComp = ICON_MAP[iconName];
                        return (
                          <button
                            key={iconName}
                            onClick={() => setNewSanskar({...newSanskar, iconName})}
                            className={`p-3 rounded-xl transition-all ${
                              newSanskar.iconName === iconName 
                                ? 'bg-amber-600 text-white shadow-md' 
                                : 'bg-white text-[#1a1a1a]/60 hover:bg-amber-50'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-2">Description</label>
                    <textarea
                      value={newSanskar.description}
                      onChange={e => setNewSanskar({...newSanskar, description: e.target.value})}
                      className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 resize-none h-24"
                      placeholder="Describe the ritual or ceremony..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-2">Significance</label>
                    <textarea
                      value={newSanskar.significance}
                      onChange={e => setNewSanskar({...newSanskar, significance: e.target.value})}
                      className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 resize-none h-24"
                      placeholder="Why is this important?"
                    />
                  </div>

                  <button
                    onClick={handleAddCustom}
                    className="w-full py-4 bg-[#1a1a1a] text-[#f5f2ed] rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all mt-4"
                  >
                    Save Custom Sanskar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sanskar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredSanskars.map((sanskar, index) => (
          <motion.div
            key={sanskar.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveSanskar(sanskar)}
            className="group bg-white p-6 rounded-[2rem] border border-[#1a1a1a]/5 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-5 transition-all group-hover:opacity-10 ${
              sanskar.category === 'pre-birth' ? 'bg-pink-500' : 
              sanskar.category === 'childhood' ? 'bg-indigo-500' : 'bg-amber-500'
            }`} />
            
            <div className="relative z-10 space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                sanskar.category === 'pre-birth' ? 'bg-pink-50 text-pink-600' : 
                sanskar.category === 'childhood' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              }`}>
                <sanskar.icon className="w-6 h-6" />
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  {index + 1}. {sanskar.category}
                </p>
                <h3 className="font-serif text-xl group-hover:text-amber-700 transition-colors">{sanskar.name}</h3>
              </div>
              
              <p className="text-xs text-[#1a1a1a]/60 line-clamp-2 leading-relaxed">
                {sanskar.description}
              </p>
              
              <div className="pt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 opacity-0 group-hover:opacity-100 transition-all">
                Learn More <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal & Active Ritual */}
      <AnimatePresence>
        {activeSanskar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#f5f2ed] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setActiveSanskar(null);
                  setIsRitualActive(false);
                }}
                className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-all z-20"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>

              <div className="p-12 space-y-8">
                {!isRitualActive ? (
                  <>
                    <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${
                        activeSanskar.category === 'pre-birth' ? 'bg-pink-100 text-pink-600' : 
                        activeSanskar.category === 'childhood' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <activeSanskar.icon className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">{activeSanskar.category}</p>
                        <h3 className="font-serif text-4xl">{activeSanskar.name}</h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Description</h4>
                        <p className="text-lg leading-relaxed text-[#1a1a1a]/80">{activeSanskar.description}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Significance</h4>
                        <div className="p-6 bg-white rounded-3xl border border-[#1a1a1a]/5 text-sm leading-relaxed italic">
                          &quot;{activeSanskar.significance}&quot;
                        </div>
                      </div>

                      {RITUAL_STEPS[activeSanskar.id] && (
                        <div className="pt-4">
                          <button 
                            onClick={() => startRitual(activeSanskar)}
                            className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                          >
                            Start Active Ritual <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {activeSanskar.id === 'namkaran' && (
                        <div className="pt-4">
                          <button 
                            onClick={() => {
                              alert("Please use the dedicated 'Namkaran' tab for the full ceremony!");
                            }}
                            className="w-full py-4 bg-[#1a1a1a] text-[#f5f2ed] rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
                          >
                            Perform Ritual <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Active Ritual Experience</p>
                      <h3 className="font-serif text-3xl">{activeSanskar.name}</h3>
                      <div className="flex justify-center gap-2 pt-2">
                        {RITUAL_STEPS[activeSanskar.id].map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all ${
                              i + 1 <= ritualStep ? 'w-8 bg-amber-600' : 'w-4 bg-amber-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={ritualStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl shadow-amber-50 space-y-6 text-center"
                      >
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl font-serif font-bold">{ritualStep}</span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-serif text-2xl">{RITUAL_STEPS[activeSanskar.id][ritualStep - 1].title}</h4>
                          <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">
                            {RITUAL_STEPS[activeSanskar.id][ritualStep - 1].desc}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (ritualStep < RITUAL_STEPS[activeSanskar.id].length) {
                              setRitualStep(ritualStep + 1);
                            } else {
                              setIsRitualActive(false);
                              setActiveSanskar(null);
                              alert(`${activeSanskar.name} Ritual Completed Successfully!`);
                            }
                          }}
                          className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all"
                        >
                          {RITUAL_STEPS[activeSanskar.id][ritualStep - 1].action || 'Next Step'}
                        </button>
                      </motion.div>
                    </AnimatePresence>

                    <button 
                      onClick={() => setIsRitualActive(false)}
                      className="w-full text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                    >
                      Cancel Ritual
                    </button>
                  </div>
                )}

                <div className="pt-8 border-t border-[#1a1a1a]/5 flex items-center gap-4">
                  <Info className="w-5 h-5 opacity-20" />
                  <p className="text-[10px] opacity-40 leading-relaxed uppercase tracking-widest">
                    This information is based on traditional Vedic texts and the Shodasha Sanskar Vidhi.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500 rounded-full blur-[100px] -ml-32 -mt-32" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] -mr-32 -mb-32" />
        </div>
        
        <h3 className="font-serif text-3xl relative z-10">The Journey of a Soul</h3>
        <p className="text-sm opacity-60 max-w-xl mx-auto leading-relaxed relative z-10">
          Every Sanskar is a step towards higher consciousness. By understanding these rituals, we honor our past and prepare our future generations for a life of purpose and Dharma.
        </p>
        <div className="pt-4 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Archaeos Spiritual Research</p>
        </div>
      </div>
    </div>
  );
}
