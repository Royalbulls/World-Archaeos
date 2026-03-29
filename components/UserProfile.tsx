'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  Save, 
  Sparkles, 
  Shield, 
  Heart, 
  Zap,
  CheckCircle2,
  Info,
  Camera,
  Trash2,
  CreditCard,
  Download,
  Repeat
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfileData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: string;
  profession: string;
  maritalStatus: string;
  interests: string[];
  isSetup: boolean;
  profilePhoto?: string;
  fatherName?: string;
  motherName?: string;
}

interface UserProfileProps {
  profile: UserProfileData;
  onUpdate: (data: UserProfileData) => void;
}

export default function UserProfile({ profile, onUpdate }: UserProfileProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<UserProfileData>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const memberId = `ARC-${(formData.name || 'UNK').substring(0, 3).toUpperCase()}-${(formData.birthDate || '00000000').replace(/-/g, '')}`;
  const qrData = JSON.stringify({
    id: memberId,
    name: formData.name,
    dob: formData.birthDate,
    role: 'Archaeos Member',
    profession: formData.profession,
    url: `https://worldarchaeos.com/m/${memberId}`
  });

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Archaeos_MemberCard_${memberId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card', err);
    }
  };

  const handleSave = async () => {
    onUpdate({ ...formData, isSetup: true });
    setIsSaved(true);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...formData,
          isSetup: true,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, profilePhoto: undefined });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#1a1a1a]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-700">
              <User className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Your Spiritual Identity</h2>
          </div>
          <p className="text-lg text-[#1a1a1a]/60 max-w-2xl leading-relaxed">
            Create your profile once. Archaeos uses this &quot;Digital Soul&quot; to personalize every tool, 
            from your Birth Chart to your Vastu recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 space-y-6">
          <h3 className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Core Details
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl bg-[#f5f2ed] border-2 border-dashed border-[#1a1a1a]/10 overflow-hidden group">
                  {formData.profilePhoto ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      <button 
                        onClick={removePhoto}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#1a1a1a]/20">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label 
                    htmlFor="profile-photo-upload"
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-indigo-100 transition-all inline-block"
                  >
                    Upload Photo
                  </label>
                  <p className="text-[10px] opacity-40 max-w-[200px]">
                    This photo will be used as a reference for AI-generated characters in your stories and content.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="How should the stars address you?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="date" 
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="time" 
                    value={formData.birthTime}
                    onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
                    className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Birth Place</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text" 
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gender</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Father&apos;s Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.fatherName || ''}
                  onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Father&apos;s Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mother&apos;s Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.motherName || ''}
                  onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Mother&apos;s Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profession / Business</label>
                <input 
                  type="text" 
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({...formData, profession: e.target.value})}
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Architect, Merchant"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Marital Status</label>
                <select 
                  value={formData.maritalStatus || 'single'}
                  onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                  className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {isSaved ? <><CheckCircle2 className="w-5 h-5" /> Profile Synchronized</> : <><Save className="w-5 h-5" /> Save Identity</>}
          </button>
        </div>

        {/* Benefits Card */}
        <div className="space-y-6">
          {formData.isSetup && (
            <div className="space-y-4">
              <div className="relative w-full h-64" style={{ perspective: '1000px' }}>
                <motion.div
                  ref={cardRef}
                  className="w-full h-full relative"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {/* Front */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden" 
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Shield className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="w-5 h-5 text-amber-400" />
                            <h3 className="font-serif text-xl text-amber-400">Archaeos Member</h3>
                          </div>
                          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">Global Digital Soul</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl">
                          <QRCodeSVG 
                            value={qrData} 
                            size={80} 
                            bgColor="#ffffff" 
                            fgColor="#1a1a1a" 
                            level="L" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest opacity-50">Name</p>
                          <p className="font-serif text-2xl">{formData.name || 'Unknown Seeker'}</p>
                          <p className="text-xs opacity-70 mt-2">{formData.profession || 'Seeker of Truth'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest opacity-50">Member Since</p>
                          <p className="font-mono text-xs mt-1">{new Date().getFullYear()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-gradient-to-tl from-[#1a1a1a] to-[#2a2a2a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden" 
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="absolute bottom-0 left-0 p-8 opacity-5 pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h4 className="font-serif text-lg text-amber-400 mb-6 border-b border-white/10 pb-2">Member Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-50">Member ID</p>
                            <p className="font-mono text-xs mt-1">{memberId}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-50">Origin</p>
                            <p className="text-xs mt-1">{formData.birthPlace || 'Earth'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-50">Gender</p>
                            <p className="text-xs mt-1 capitalize">{formData.gender || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-50">Status</p>
                            <p className="text-xs mt-1 capitalize">{formData.maritalStatus || 'Single'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-center opacity-50 text-[10px] uppercase tracking-widest mt-4">
                        &quot;Seek the truth within the ancient echoes.&quot;
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsFlipped(!isFlipped)} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-gray-200 transition-all"
                >
                  <Repeat className="w-4 h-4" /> Flip Card
                </button>
                <button 
                  onClick={handleDownloadCard} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2rem] p-8 shadow-xl">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Why Create a Profile?
            </h3>
            <div className="space-y-4">
              {[
                { icon: Shield, title: 'One-Time Setup', desc: 'Fill your details once, use them across 15+ tools instantly.' },
                { icon: Zap, title: 'Personalized AI', desc: 'Our AI models use your birth coordinates to provide accurate, unique guidance.' },
                { icon: Heart, title: 'Karmic Tracking', desc: 'Monitor your spiritual progress and energy levels over time.' }
              ].map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="p-2 bg-white/10 rounded-lg h-fit">
                    <b.icon className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{b.title}</h4>
                    <p className="text-[10px] opacity-60 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8">
            <p className="text-xs text-indigo-900/60 leading-relaxed italic">
              &quot;By establishing your digital soul, you allow the Archaeos engine to synchronize your biological rhythm with the cosmic grid.&quot;
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-4 text-indigo-900">— Kilvish Baba</p>
          </div>
        </div>
      </div>
    </div>
  );
}
