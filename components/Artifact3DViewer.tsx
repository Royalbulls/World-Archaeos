'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Center, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rotate3D, 
  ZoomIn, 
  Info, 
  Loader2
} from 'lucide-react';

// Procedural Artifact Components
function IndusSeal() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[2, 2, 0.2]} />
        <meshStandardMaterial color="#c2b280" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[1.5, 1.5, 0.22]} />
        <meshStandardMaterial color="#a89a6b" roughness={0.9} />
      </mesh>
      {/* Unicorn representation */}
      <mesh position={[0, 0.2, 0.15]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial color="#8a7d55" />
      </mesh>
    </group>
  );
}

function VedicVimana() {
  return (
    <group position={[0, -1, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.5]} />
        <meshStandardMaterial color="#b87333" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[1.5, 2, 32]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 2.75, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1]} />
        <meshStandardMaterial color="#b87333" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 3.4, 0]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#ffdf00" roughness={0.1} metalness={1} />
      </mesh>
    </group>
  );
}

function MysticRelic() {
  return (
    <mesh scale={0.8}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshStandardMaterial color="#4a5568" roughness={0.2} metalness={0.9} envMapIntensity={2} />
    </mesh>
  );
}

function AncientCoin() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.2, 1.2, 0.1, 64]} />
      <meshStandardMaterial color="#cd7f32" roughness={0.6} metalness={0.7} />
    </mesh>
  );
}

const ARTIFACTS = [
  {
    id: 'indus-seal',
    name: 'Indus Valley Seal',
    period: 'c. 2500 BCE',
    material: 'Steatite',
    description: 'A reconstructed representation of a typical Indus Valley seal, often featuring animal motifs like the "unicorn" and an undeciphered script. These were used for trade and administrative purposes.',
    component: <IndusSeal />
  },
  {
    id: 'vimana',
    name: 'Vedic Vimana Concept',
    period: 'Mythological / Ancient Texts',
    material: 'Gold & Copper Alloy',
    description: 'An architectural and conceptual reconstruction of a Vimana, described in ancient Indian texts as flying palaces or chariots. This model represents the temple-like structure often associated with them.',
    component: <VedicVimana />
  },
  {
    id: 'mystic-relic',
    name: 'The Cosmic Knot',
    period: 'Unknown Antiquity',
    material: 'Meteoric Iron',
    description: 'An abstract representation of an ancient geometric relic, symbolizing the interconnectedness of the universe found in various ancient philosophies.',
    component: <MysticRelic />
  },
  {
    id: 'maurya-coin',
    name: 'Mauryan Punch-Marked Coin',
    period: 'c. 300 BCE',
    material: 'Silver / Bronze',
    description: 'A stylized representation of early Indian coinage, which were irregularly shaped pieces of metal stamped with various symbols representing nature and royalty.',
    component: <AncientCoin />
  }
];

export default function Artifact3DViewer() {
  const [activeArtifact, setActiveArtifact] = useState(ARTIFACTS[0]);
  const [isSpinning, setIsSpinning] = useState(true);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl text-[#1a1a1a]">3D Artifact Vault</h2>
          <p className="text-sm text-[#1a1a1a]/50 mt-1">Interactive reconstructions of ancient structures and relics</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
          <Rotate3D className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">WebGL Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#1a1a1a]/5 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 mb-4">Select Artifact</h3>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {ARTIFACTS.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setActiveArtifact(artifact)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    activeArtifact.id === artifact.id
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg shadow-black/10'
                      : 'bg-gray-50 text-[#1a1a1a] border-transparent hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-bold text-sm">{artifact.name}</h4>
                  <p className={`text-xs mt-1 ${activeArtifact.id === artifact.id ? 'text-white/60' : 'text-[#1a1a1a]/40'}`}>
                    {artifact.period}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeArtifact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-indigo-300" />
                <h3 className="font-serif text-xl">Artifact Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block mb-1">Material</span>
                  <p className="text-sm">{activeArtifact.material}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block mb-1">Historical Context</span>
                  <p className="text-sm text-indigo-100 leading-relaxed">{activeArtifact.description}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3D Canvas Area */}
        <div className="lg:col-span-8 bg-[#1a1a1a] rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/10">
          {/* Overlay Controls */}
          <div className="absolute top-6 left-6 z-10 flex gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 text-white">
              <ZoomIn className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Scroll to Zoom</span>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 text-white">
              <Rotate3D className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Drag to Rotate</span>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-10">
            <button
              onClick={() => setIsSpinning(!isSpinning)}
              className="px-6 py-3 bg-white text-[#1a1a1a] rounded-full font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg"
            >
              {isSpinning ? 'Stop Rotation' : 'Auto Rotate'}
            </button>
          </div>

          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Suspense fallback={
              <Html center>
                <div className="flex flex-col items-center justify-center text-white w-48">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                  <p className="text-sm font-mono tracking-widest uppercase text-center">Loading 3D Assets...</p>
                </div>
              </Html>
            }>
              <color attach="background" args={['#1a1a1a']} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <Float speed={isSpinning ? 2 : 0} rotationIntensity={isSpinning ? 1 : 0} floatIntensity={isSpinning ? 2 : 0}>
                <Center>
                  {activeArtifact.component}
                </Center>
              </Float>

              <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
              <Environment preset="city" />
              <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={10} autoRotate={isSpinning} autoRotateSpeed={1} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
