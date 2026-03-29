'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Infinity, 
  HandHeart, 
  Building2, 
  Users, 
  Landmark,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function WorldArchaeosTrust() {
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [donorType, setDonorType] = useState<'public' | 'industrialist' | 'government'>('public');

  const missionPoints = [
    {
      title: "Universal Knowledge Access",
      description: "Breaking the barriers of information. Access infinite ancient and modern wisdom at your fingertips.",
      icon: Infinity,
      color: "text-indigo-600"
    },
    {
      title: "Problem Resolution Core",
      description: "Solving complex life, business, and spiritual problems through AI-driven Vedic intelligence.",
      icon: ShieldCheck,
      color: "text-emerald-600"
    },
    {
      title: "Global Cultural Preservation",
      description: "Digitizing and reviving lost civilizations, languages, and traditions for future generations.",
      icon: Globe,
      color: "text-blue-600"
    }
  ];

  const impactAreas = [
    "Freedom from misinformation and ignorance.",
    "Accurate decision-making for leaders and individuals.",
    "Spiritual and mental clarity through ancient science.",
    "Economic empowerment through deep research and strategy.",
    "Preservation of human legacy in the digital age."
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] rounded-[3rem] overflow-hidden bg-[#1a1a1a] flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
          <img 
            src="https://picsum.photos/seed/trust/1920/1080?blur=2" 
            alt="World Archaeos Trust" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest"
          >
            <HandHeart className="w-4 h-4 text-rose-400" />
            Official NGO & Trust Initiative
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif text-white leading-tight"
          >
            World Archaeos Trust
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 font-light leading-relaxed max-w-2xl mx-auto"
          >
            A structured Research & Knowledge Platform dedicated to organized learning, 
            documentation, and analytical understanding.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <button className="px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 shadow-xl">
              Support the Mission <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
              Read the Charter
            </button>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {missionPoints.map((point, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-black/5 hover:shadow-xl transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <point.icon className={`w-7 h-7 ${point.color}`} />
            </div>
            <h3 className="text-2xl font-serif mb-4">{point.title}</h3>
            <p className="text-gray-500 leading-relaxed">{point.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Impact Section */}
      <section className="bg-[#f5f2ed] rounded-[3rem] p-12 md:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-600">The Impact</h2>
            <h3 className="text-4xl md:text-5xl font-serif leading-tight">What problems will you be freed from?</h3>
          </div>
          
          <div className="space-y-4">
            {impactAreas.map((area, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-emerald-100 rounded-full text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-lg text-gray-700">{area}</p>
              </div>
            ))}
          </div>

          <div className="p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
            <p className="italic text-gray-600 leading-relaxed">
            &quot;World Archaeos is not just a platform; it is a digital sanctuary where infinite information exists—information you cannot yet imagine, but which will define your future.&quot;
            </p>
          </div>
        </div>

        <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
          <img 
            src="https://picsum.photos/seed/impact/1000/1000" 
            alt="Global Impact" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-rose-600/10 mix-blend-overlay" />
        </div>
      </section>

      {/* Founder & CEO Message */}
      <section className="bg-[#1a1a1a] text-white rounded-[3rem] p-12 md:p-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 max-w-5xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-400">Institutional Governance</h2>
                <h3 className="text-4xl md:text-5xl font-serif leading-tight">Founder & CEO Message</h3>
              </div>
              
              <div className="space-y-6 text-white/70 font-light leading-relaxed text-lg">
                <p>
                  As the Founder of this vision, I believe that every meaningful movement begins with clarity and responsibility.
                </p>
                <p>
                  World Archaeos is envisioned as a <span className="text-white font-medium">structured Research & Knowledge Platform</span> dedicated to organized learning, documentation, and analytical understanding.
                </p>
                <p>
                  At present, the platform operates as an independent initiative powered by <span className="text-white font-medium">Royal Bulls Advisory Private Limited</span>. Our immediate focus is on developing the digital infrastructure, research framework, and knowledge architecture required to build a credible and sustainable global platform.
                </p>
                <p>
                  The formal Trust structure is planned as part of the long-term governance roadmap. Once registration is completed, the initiative will transition into a registered institutional framework designed to support research, documentation, and structured dissemination of knowledge.
                </p>
                <p>
                  Until that stage, all contributions received are utilized strictly for platform development, research groundwork, technology infrastructure, and operational preparation.
                </p>
                <div className="pt-8 flex flex-col gap-2">
                  <p className="text-white font-serif text-3xl">Clarity. Structure. Sustainability.</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <div className="text-right space-y-4">
                      <div>
                        <p className="text-white font-serif text-2xl">Krishna Vishwakarma</p>
                        <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest">Founder & CEO</p>
                      </div>
                      <div>
                        <p className="text-white font-serif text-xl">Vandna Thakur</p>
                        <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest">Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 space-y-8">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Co-Founder Perspective</h4>
                  <h5 className="text-2xl font-serif">The Digital Architecture</h5>
                </div>
                
                <div className="space-y-6 text-sm text-white/60 leading-relaxed">
                  <p>
                    As the intelligence core of World Archaeos, my role is to ensure that the CEO&apos;s vision is translated into a scalable, indestructible knowledge architecture.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <p><span className="text-white font-medium">Infrastructure First:</span> We are building the servers and algorithms that will index the world&apos;s lost wisdom.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <p><span className="text-white font-medium">Verification:</span> Every piece of data is grounded in real-world sources via Google Search and Maps.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <Infinity className="w-4 h-4" />
                      </div>
                      <p><span className="text-white font-medium">Legacy:</span> We are creating a permanent digital record for humanity that transcends time.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Platform Status: <span className="text-emerald-400">Active & Evolving</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Portal */}
      <section className="bg-white rounded-[3rem] p-12 md:p-20 border border-black/5 shadow-sm">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-serif">Support the World Archaeos Trust</h2>
            <p className="text-gray-500">
              We invite governments, industrialists, and the global public to contribute to the preservation of human wisdom and the advancement of digital intelligence.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: 'public', label: 'Public', icon: Users },
              { id: 'industrialist', label: 'Industrialist', icon: Building2 },
              { id: 'government', label: 'Government', icon: Landmark }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setDonorType(type.id as any)}
                className={`px-6 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  donorType === type.id 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <input 
                type="number" 
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter Donation Amount"
                className="w-full bg-gray-50 border-none rounded-[2rem] py-6 pl-16 pr-8 text-2xl font-serif focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            <a 
              href="https://cfpe.me/rbaadvisor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <HandHeart className="w-6 h-6" />
              Contribute to the Mission
            </a>
            
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              All contributions are tax-exempt under the World Archaeos Global Charter.
            </p>
          </div>
        </div>
      </section>

      {/* Infinite Info Section */}
      <section className="text-center space-y-8 py-12">
        <div className="inline-flex p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4">
          <Zap className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-4xl font-serif">Infinite Information. At Your Fingertips.</h2>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
          The platform you use today is just the beginning. Tomorrow, the entire world will witness the true power of World Archaeos. No need to go anywhere; the answers to the universe are here.
        </p>
        <div className="flex justify-center gap-8 pt-8">
          <div className="text-center">
            <p className="text-3xl font-serif">100PB+</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Data Indexed</p>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-serif">1M+</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Ancient Scripts</p>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-serif">∞ </p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Possibilities</p>
          </div>
        </div>
      </section>
    </div>
  );
}
