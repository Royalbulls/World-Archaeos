'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Languages, 
  ScrollText, 
  History,
  Satellite,
  Heart,
  Pickaxe,
  Sparkles,
  Zap,
  Newspaper,
  Leaf,
  Clock,
  Home,
  Bot,
  Infinity,
  Cpu,
  Activity,
  Shield,
  User,
  Briefcase,
  Box,
  PenTool,
  Dna,
  Menu,
  X,
  Settings as SettingsIcon,
  Search,
  Baby,
  Mountain,
  Music,
  Mic2,
  Camera,
  Star,
  Rocket,
  Library,
  LayoutTemplate,
  Book,
  Target
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ArchaeosExplorer = dynamic(() => import('@/components/ArchaeosExplorer'), { ssr: false });
const VirtualArchaeologist = dynamic(() => import('@/components/VirtualArchaeologist'), { ssr: false });
import ArtifactAnalyzer from '@/components/ArtifactAnalyzer';
import MysterySolver from '@/components/MysterySolver';
import LanguageTranslator from '@/components/LanguageTranslator';
import ResourceMapper from '@/components/ResourceMapper';
import DiscoveriesFeed from '@/components/DiscoveriesFeed';
import BotanicalLab from '@/components/BotanicalLab';
import GeologicalAnalyzer from '@/components/GeologicalAnalyzer';
import TemporalReconstructor from '@/components/TemporalReconstructor';
import VastuArchitect from '@/components/VastuArchitect';
import AIAgentCreator from '@/components/AIAgentCreator';
import MysticOracle from '@/components/MysticOracle';
import VedicTechLab from '@/components/VedicTechLab';
import AkashicExplorer from '@/components/AkashicExplorer';
import AncientSoundLab from '@/components/AncientSoundLab';
import BioMachineAnalyzer from '@/components/BioMachineAnalyzer';
import KilvishBabaApp from '@/components/KilvishBabaApp';
import DestinyNavigator from '@/components/DestinyNavigator';
import ArchaeosPublisher from '@/components/ArchaeosPublisher';
import ArchaeosFinder from '@/components/ArchaeosFinder';
import EvolutionCore from '@/components/EvolutionCore';
import AIKathaVachak from '@/components/AIKathaVachak';
import DailyPulse from '@/components/DailyPulse';
import WorldArchaeosTrust from '@/components/WorldArchaeosTrust';
import HomeView from '@/components/HomeView';
import Settings from '@/components/Settings';
import Namkaran from '@/components/Namkaran';
import LegacyArchitect from '@/components/LegacyArchitect';
import SanskarHub from '@/components/SanskarHub';
import ProfessionalServices from '@/components/ProfessionalServices';
import DharmaStrategist from '@/components/DharmaStrategist';
import NajarNivaran from '@/components/NajarNivaran';
import AIInfluencerStudio from '@/components/AIInfluencerStudio';
import Reconstructor from '@/components/Reconstructor';
import UserProfile, { UserProfileData } from '@/components/UserProfile';
import UserMenu from '@/components/UserMenu';
import ArtifactDiscovery from '@/components/ArtifactDiscovery';
import KundliGenerator from '@/components/KundliGenerator';
import PitchDeck from '@/components/PitchDeck';
import VedicLibrary from '@/components/VedicLibrary';
import SatelliteAnalyzer from '@/components/SatelliteAnalyzer';

import VirtualTool, { VirtualToolConfig } from '@/components/VirtualTool';
import * as LucideIcons from 'lucide-react';

import AppBlueprintGenerator from '@/components/AppBlueprintGenerator';
import SoulCouncil from '@/components/SoulCouncil';
import SoulJourneyBook from '@/components/SoulJourneyBook';
import { appDB } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, Timestamp } from 'firebase/firestore';
import { LogIn, LogOut } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', icon: Home, component: HomeView },
  { id: 'assistant', label: 'Virtual Archaeologist', icon: Bot, component: VirtualArchaeologist },
  { id: 'satellite', label: 'Satellite Analysis', icon: Satellite, component: SatelliteAnalyzer },
  { id: 'council', label: 'Soul Council', icon: Bot, component: SoulCouncil },
  { id: 'blueprint', label: 'App Blueprint', icon: LayoutTemplate, component: AppBlueprintGenerator },
  { id: 'daily-pulse', label: 'Daily Pulse', icon: Zap, component: DailyPulse },
  { id: 'pitch-deck', label: 'Pitch Deck', icon: Rocket, component: PitchDeck },
  { id: 'trust', label: 'Archaeos Trust', icon: Heart, component: WorldArchaeosTrust },
  { id: 'profile', label: 'My Profile', icon: User, component: UserProfile },
  { id: 'namkaran', label: 'Namkaran', icon: Baby, component: Namkaran },
  { id: 'kundli', label: 'Kundli Generator', icon: Star, component: KundliGenerator },
  { id: 'soul-book', label: 'Soul Journey Book', icon: Book, component: SoulJourneyBook },
  { id: 'katha', label: 'AI Katha Vachak', icon: Mic2, component: AIKathaVachak },
  { id: 'legacy', label: 'Legacy Architect', icon: ScrollText, component: LegacyArchitect },
  { id: 'pro-services', label: 'Pro Services', icon: Briefcase, component: ProfessionalServices },
  { id: 'dharma-ceo', label: 'Dharma CEO', icon: Briefcase, component: DharmaStrategist },
  { id: 'influencer', label: 'Influencer Studio', icon: Camera, component: AIInfluencerStudio },
  { id: 'reconstructor', label: 'Reconstructor', icon: Mic2, component: Reconstructor },
  { id: 'najar-nivaran', label: 'Najar Nivaran', icon: Shield, component: NajarNivaran },
  { id: 'sanskar', label: '16 Sanskars', icon: History, component: SanskarHub },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, component: Settings },
  { id: 'evolution', label: 'Evolution Core', icon: Dna, component: EvolutionCore },
  { id: 'publisher', label: 'Publisher Hub', icon: PenTool, component: ArchaeosPublisher },
  { id: 'finder', label: 'Archaeos Finder', icon: Target, component: ArchaeosFinder },
  { id: 'destiny', label: 'Destiny Navigator', icon: Sparkles, component: DestinyNavigator },
  { id: 'feed', label: 'Discoveries', icon: Newspaper, component: DiscoveriesFeed },
  { id: 'oracle', label: 'Mystic Oracle', icon: Sparkles, component: MysticOracle },
  { id: 'kilvish', label: 'Kilvish Baba', icon: Shield, component: KilvishBabaApp },
  { id: 'akashic', label: 'Akashic Records', icon: Infinity, component: AkashicExplorer },
  { id: 'sound', label: 'Sound Lab', icon: Music, component: AncientSoundLab },
  { id: 'bio', label: 'Bio-Machine', icon: Activity, component: BioMachineAnalyzer },
  { id: 'tech', label: 'Vedic Tech Lab', icon: Cpu, component: VedicTechLab },
  { id: 'agents', label: 'AI Souls', icon: Bot, component: AIAgentCreator },
  { id: 'vastu', label: 'Vastu Architect', icon: Home, component: VastuArchitect },
  { id: 'temporal', label: 'Temporal Lab', icon: Clock, component: TemporalReconstructor },
  { id: 'explorer', label: 'Site Explorer', icon: Compass, component: ArchaeosExplorer },
  { id: 'analyzer', label: 'Artifact Lab', icon: Pickaxe, component: ArtifactAnalyzer },
  { id: 'botany', label: 'Botanical Lab', icon: Leaf, component: BotanicalLab },
  { id: 'geology', label: 'Geology Lab', icon: Mountain, component: GeologicalAnalyzer },
  { id: 'resources', label: 'Resource Mapper', icon: Zap, component: ResourceMapper },
  { id: 'mysteries', label: 'Historical Mysteries', icon: History, component: MysterySolver },
  { id: 'translator', label: 'Ancient Script', icon: Languages, component: LanguageTranslator },
  { id: 'artifacts', label: 'The Vault', icon: Box, component: ArtifactDiscovery },
  { id: 'library', label: 'Vedic Library', icon: Library, component: VedicLibrary },
];

export default function Dashboard() {
  const { user, profile: authProfile, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalLanguage, setGlobalLanguage] = useState('hi-sa'); // Default to Hindi-Sanskrit mix
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    gender: 'male',
    profession: '',
    maritalStatus: 'single',
    interests: [],
    isSetup: false
  });
  const [customTools, setCustomTools] = useState<VirtualToolConfig[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      // Try IndexedDB first
      const saved = await appDB.get<UserProfileData>('profile_store', 'archaeos_user_profile');
      if (saved) {
        setUserProfile(saved);
      } else {
        // Fallback to localStorage for migration
        const legacy = localStorage.getItem('archaeos_user_profile');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            setUserProfile(parsed);
            // Migrate to IndexedDB
            await appDB.set('profile_store', 'archaeos_user_profile', parsed);
          } catch (e) {
            console.error("Failed to parse legacy profile", e);
          }
        }
      }
      setMounted(true);
    };
    
    loadProfile();
  }, []);

  // Sync with AuthProvider profile
  useEffect(() => {
    if (authProfile) {
      setUserProfile(prev => ({
        ...prev,
        ...authProfile,
        name: authProfile.name || authProfile.displayName || prev.name,
        profilePhoto: authProfile.profilePhoto || authProfile.photoURL || prev.profilePhoto,
        isSetup: authProfile.isSetup || prev.isSetup
      }));
    }
  }, [authProfile]);

  // Sync custom tools with Firestore
  useEffect(() => {
    if (!user) {
      setCustomTools([]);
      return;
    }

    const q = query(
      collection(db, 'custom_tools'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tools = snapshot.docs.map(doc => ({
        ...doc.data().config,
        id: doc.id
      })) as VirtualToolConfig[];
      setCustomTools(tools);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'custom_tools');
    });

    return () => unsubscribe();
  }, [user]);

  const handleProfileUpdate = async (data: UserProfileData) => {
    setUserProfile(data);
    try {
      await appDB.set('profile_store', 'archaeos_user_profile', data);
      // Also try to save to localStorage as backup, but wrap in try-catch to ignore quota errors
      try {
        localStorage.setItem('archaeos_user_profile', JSON.stringify(data));
      } catch (e) {
        console.warn("LocalStorage quota exceeded, profile saved to IndexedDB only.");
      }
    } catch (e) {
      console.error("Failed to save profile to IndexedDB", e);
    }
  };

  const allTabs = useMemo(() => [
    ...TABS,
    ...(customTools || []).filter(ct => ct.id && !TABS.some(t => t.id === ct.id)).map(t => ({
      id: t.id,
      label: t.name,
      icon: (LucideIcons as any)[t.iconName] || Sparkles,
      component: () => <VirtualTool config={t} globalLanguage={globalLanguage} />
    }))
  ], [customTools, globalLanguage]);

  const fuse = useMemo(() => new Fuse(allTabs, {
    keys: ['label', 'id'],
    threshold: 0.3,
    distance: 100,
    ignoreLocation: true
  }), [allTabs]);

  const categories = useMemo(() => {
    const rawCategories = [
      { id: 'personal', label: 'Personal & Daily Use', tabs: ['home', 'daily-pulse', 'trust', 'profile', 'namkaran', 'kundli', 'katha', 'reconstructor', 'sanskar', 'najar-nivaran', 'oracle', 'sound', 'vastu'] },
      { id: 'business', label: 'Legacy & Earning', tabs: ['blueprint', 'dharma-ceo', 'influencer', 'pro-services', 'publisher', 'legacy', 'destiny', 'kilvish', 'feed'] },
      { id: 'research', label: 'Ancient Research', tabs: ['library', 'geology', 'botany', 'analyzer', 'explorer', 'translator', 'resources', 'mysteries', 'artifacts', 'satellite', 'finder'] },
      { id: 'advanced', label: 'Vedic Innovation', tabs: ['council', 'agents', 'tech', 'bio', 'akashic', 'temporal', 'evolution'] },
      ...((customTools && customTools.length > 0) ? [{ id: 'evolved', label: 'Evolved Tools', tabs: customTools.map(t => t.id).filter(Boolean) as string[] }] : []),
      { id: 'system', label: 'System', tabs: ['settings'] }
    ];

    if (!searchQuery) return rawCategories;

    const searchResults = fuse.search(searchQuery).map(r => r.item.id);

    return rawCategories.map(cat => ({
      ...cat,
      tabs: cat.tabs.filter(tabId => searchResults.includes(tabId))
    })).filter(cat => cat.tabs.length > 0);
  }, [searchQuery, customTools, fuse]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!mounted) {
    return <div className="min-h-screen bg-[#f5f2ed]" />; // Simple placeholder
  }

  const handleEvolve = async (newTool: VirtualToolConfig) => {
    if (!user) {
      alert("Please sign in to save your evolved tools.");
      return;
    }

    try {
      const toolId = newTool.id || `evolved-${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'custom_tools', toolId), {
        userId: user.uid,
        name: newTool.name,
        iconName: newTool.iconName,
        config: newTool,
        createdAt: Timestamp.now(),
        id: toolId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'custom_tools');
    }
  };

  const activeCustomTool = customTools.find(t => t.id === activeTab);
  const ActiveComponent = (activeCustomTool 
    ? () => <VirtualTool config={activeCustomTool} globalLanguage={globalLanguage} />
    : (activeTab === 'home' || !TABS.find(t => t.id === activeTab))
      ? () => <HomeView profile={userProfile} setActiveTab={setActiveTab} categories={categories} allTabs={allTabs} />
      : TABS.find(t => t.id === activeTab)?.component || (() => <HomeView profile={userProfile} setActiveTab={setActiveTab} categories={categories} allTabs={allTabs} />)) as React.ComponentType<any>;

  const languages = [
    { id: 'hi-sa', label: 'हिन्दी + संस्कृत', short: 'HI-SA' },
    { id: 'hi', label: 'हिन्दी', short: 'HI' },
    { id: 'sa', label: 'संस्कृत', short: 'SA' },
    { id: 'en', label: 'English', short: 'EN' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2ed]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-[#1a1a1a]/5 rounded-xl transition-colors lg:flex hidden"
            >
              <Menu className="w-5 h-5 opacity-50" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-[#f5f2ed] group-hover:rotate-12 transition-transform duration-500">
                <Compass className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-xl tracking-tight text-[#1a1a1a]">WorldArchaeos</h1>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40 -mt-1">Engine v4.0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-[#1a1a1a]/5 rounded-full px-4 py-1.5 border border-[#1a1a1a]/5">
              <Search className="w-4 h-4 opacity-30 mr-2" />
              <input 
                type="text" 
                placeholder="Search engine..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs focus:outline-none w-48 font-medium"
              />
            </div>

            <div className="h-6 w-px bg-[#1a1a1a]/10 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setGlobalLanguage(lang.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    globalLanguage === lang.id 
                      ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg shadow-[#1a1a1a]/20' 
                      : 'hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/60'
                  }`}
                >
                  {lang.short}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-[#1a1a1a]/10 mx-2" />
            
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        <aside className={`
          ${isSidebarCollapsed ? 'w-20' : 'w-72'} 
          hidden lg:flex flex-col border-r border-[#1a1a1a]/5 bg-white/50 backdrop-blur-sm transition-all duration-500 ease-in-out print:hidden
        `}>
          <div className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar">
            {categories.map((category) => (
              <div key={category.id} className="mb-8 last:mb-0">
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]/30">{category.label}</h3>
                    <div className="h-px flex-1 bg-[#1a1a1a]/5" />
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-px w-full bg-[#1a1a1a]/5 mb-4" />}
                
                <div className="space-y-1">
                  {category.tabs.map(tabId => {
                    const tab = allTabs.find(t => t.id === tabId);
                    if (!tab) return null;
                    const Icon = tab.icon;
                    const isActive = activeTab === tabId;
                    
                    return (
                      <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                          ${isActive 
                            ? 'bg-[#1a1a1a] text-[#f5f2ed] shadow-lg shadow-[#1a1a1a]/20' 
                            : 'hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/60'}
                        `}
                        title={isSidebarCollapsed ? tab.label : ''}
                      >
                        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                        {!isSidebarCollapsed && (
                          <span className="text-xs font-bold tracking-tight">{tab.label}</span>
                        )}
                        {isActive && !isSidebarCollapsed && (
                          <motion.div 
                            layoutId="active-pill"
                            className="absolute right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f2ed]/50 relative custom-scrollbar">
          <div className="p-4 md:p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ActiveComponent 
                  globalLanguage={globalLanguage} 
                  profile={userProfile}
                  onUpdate={handleProfileUpdate}
                  setActiveTab={setActiveTab}
                  onEvolve={handleEvolve}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#1a1a1a]/10 px-6 py-3 z-50 flex justify-between items-center print:hidden">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'assistant', icon: Bot, label: 'AI' },
          { id: 'feed', icon: Newspaper, label: 'Feed' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'settings', icon: SettingsIcon, label: 'Menu' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'settings') setIsMenuOpen(true);
              else setActiveTab(item.id);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'}`}
          >
            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] lg:hidden overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-[#1a1a1a]/5 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category.id}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]/30 mb-4">{category.label}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {category.tabs.map(tabId => {
                        const tab = allTabs.find(t => t.id === tabId);
                        if (!tab) return null;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tabId}
                            onClick={() => {
                              setActiveTab(tabId);
                              setIsMenuOpen(false);
                            }}
                            className="flex flex-col items-center gap-2 p-4 bg-[#1a1a1a]/5 rounded-2xl hover:bg-[#1a1a1a]/10 transition-colors"
                          >
                            <Icon className="w-6 h-6 opacity-50" />
                            <span className="text-[10px] font-bold text-center">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-[#f5f2ed] py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 print:hidden mb-20 lg:mb-0">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Compass className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-serif text-2xl tracking-tight">WorldArchaeos</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Global Heritage Engine</p>
              </div>
            </div>
            <p className="text-sm opacity-60 leading-relaxed max-w-md mb-8">
              The world&apos;s first decentralized archaeological intelligence network. 
              Preserving human history through advanced AI, satellite analysis, and Vedic wisdom.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'Discord', 'Telegram', 'GitHub'].map(social => (
                <button key={social} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                  {social}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">Quick Access</h3>
            <ul className="space-y-4">
              {['Archaeos Trust', 'Daily Pulse', 'Vedic Library', 'Site Explorer'].map(link => (
                <li key={link}>
                  <button className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">{link}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold opacity-60">Engine Online</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                <span className="text-xs font-bold opacity-60">v4.0.2 Stable</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-xs font-bold opacity-60">Syncing Akashic Nodes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1600px] mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
            © 2026 WorldArchaeos. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <button className="text-[10px] font-bold opacity-30 uppercase tracking-widest hover:opacity-100 transition-opacity">Privacy Policy</button>
            <button className="text-[10px] font-bold opacity-30 uppercase tracking-widest hover:opacity-100 transition-opacity">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
}