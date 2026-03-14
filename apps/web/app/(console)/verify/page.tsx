"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Ban, Quote, FileVideo, ChevronRight } from "lucide-react";

// Mock Data
type VerificationRequest = {
  id: string;
  name: string;
  age: number;
  profession: string;
  location: string;
  story: string;
  photoUrl: string;
  videoUrl: string; // we'll use a placeholder or black box for UI
};

const INITIAL_QUEUE: VerificationRequest[] = [
  {
    id: "ver-1",
    name: "Elena Rostova",
    age: 28,
    profession: "Gallery Director",
    location: "Paris, FR",
    story: "I spend my days curating contemporary art and my evenings exploring the hidden jazz clubs of Le Marais. Seeking someone who appreciates the quiet moments as much as the grand gestures.",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    videoUrl: "" // Placeholder
  },
  {
    id: "ver-2",
    name: "James Sterling",
    age: 35,
    profession: "Venture Capitalist",
    location: "London, UK",
    story: "Always on the move between London and New York. Avid sailor, terrible golfer. Looking for an equal partner to share the journey.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    videoUrl: "" // Placeholder
  }
];

export default function VerificationVault() {
  const [queue, setQueue] = useState<VerificationRequest[]>(INITIAL_QUEUE);
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const activeProfile = queue[0];

  const handleApprove = () => {
    if (!activeProfile) return;
    nextProfile();
  };

  const handleReject = () => {
    if (!activeProfile) return;
    if (!isRejecting) {
      setIsRejecting(true);
      return;
    }
    // Submit rejection
    if (rejectReason.trim().length > 0) {
      nextProfile();
    }
  };

  const nextProfile = () => {
    setIsRejecting(false);
    setRejectReason("");
    setQueue(q => q.slice(1));
  };

  return (
    <div className="w-full h-full p-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-widest uppercase mb-1">Verification Vault</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">{queue.length} Profiles Pending Review</p>
        </div>
        
        {activeProfile && (
           <div className="px-4 py-2 rounded-full border border-[#1f222b] bg-white/[0.02] flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-white/60 uppercase tracking-widest">Live Review: {activeProfile.name}</span>
           </div>
        )}
      </div>

      {/* Main Vault Area */}
      <div className="flex-1 rounded-xl border border-[#1f222b] bg-[#0a0c10]/60 backdrop-blur-xl relative overflow-hidden flex">
        
        {!activeProfile ? (
          <div className="m-auto flex flex-col items-center gap-4 opacity-50">
             <ShieldCheck size={48} className="text-emerald-500" strokeWidth={1} />
             <p className="text-sm font-serif text-white uppercase tracking-widest">All verifications complete</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
               key={activeProfile.id}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.4 }}
               className="w-full h-full flex"
            >
               {/* Left Pane: Portrait & Story */}
               <div className="w-1/2 h-full border-r border-[#1f222b] flex flex-col p-8 overflow-y-auto">
                 <h2 className="text-xs text-[#C89B90] uppercase tracking-[0.2em] mb-6">Submitted Dossier</h2>
                 
                 <div className="flex gap-6 mb-8">
                    <img 
                      src={activeProfile.photoUrl} 
                      alt="Primary Portrait" 
                      className="w-48 h-64 object-cover rounded-xl border border-[#C89B90]/30 shadow-2xl" 
                    />
                    <div className="flex flex-col gap-4 py-2">
                       <div>
                         <h3 className="text-2xl font-serif text-white">{activeProfile.name}, {activeProfile.age}</h3>
                         <p className="text-xs font-sans text-white/50 uppercase tracking-wider mt-1">{activeProfile.profession}</p>
                         <p className="text-xs font-sans text-[#C89B90] uppercase tracking-wider mt-1">{activeProfile.location}</p>
                       </div>
                       
                       <div className="mt-auto">
                         <div className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 uppercase tracking-widest inline-block">
                           ID Verified (External)
                         </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 rounded-xl border border-[#1f222b] bg-white/[0.02] relative">
                    <Quote size={24} className="text-[#C89B90]/20 absolute top-4 left-4" />
                    <p className="text-lg font-serif italic text-white/80 leading-relaxed relative z-10 p-2">
                      "{activeProfile.story}"
                    </p>
                 </div>
               </div>

               {/* Right Pane: Video & Decision Console */}
               <div className="w-1/2 h-full flex flex-col p-8 bg-[#0a0c10]">
                 <h2 className="text-xs text-[#C89B90] uppercase tracking-[0.2em] mb-6">Proof of Life</h2>
                 
                 {/* Video Player Mockup */}
                 <div className="w-full aspect-video rounded-xl border border-[#1f222b] bg-black relative overflow-hidden flex items-center justify-center group">
                    {/* Simulated video background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#1f222b] to-black opacity-50" />
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-white uppercase tracking-widest font-mono">REC</span>
                    </div>
                    
                    <FileVideo size={48} className="text-white/20 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                         <div className="w-1/3 h-full bg-[#C89B90]" />
                      </div>
                    </div>
                 </div>

                 {/* Decision Console */}
                 <div className="mt-12 flex-1 flex flex-col bg-white/[0.02] border border-[#1f222b] rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B90]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <h3 className="text-sm font-serif text-white uppercase tracking-widest mb-6">Decision Console</h3>
                    
                    <AnimatePresence mode="wait">
                      {!isRejecting ? (
                        <motion.div 
                          key="actions"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex flex-col gap-4 mt-auto"
                        >
                          <button 
                            onClick={handleApprove}
                            className="w-full py-4 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 uppercase text-xs tracking-widest font-semibold hover:bg-emerald-900/50 hover:border-emerald-400 transition-all flex items-center justify-center gap-3"
                          >
                            <ShieldCheck size={18} /> APPROVE & GRANT ACCESS
                          </button>
                          
                          <button 
                            onClick={handleReject}
                            className="w-full py-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-500 uppercase text-xs tracking-widest font-semibold hover:bg-red-900/40 hover:border-red-500/50 transition-all flex items-center justify-center gap-3"
                          >
                            <Ban size={18} /> REJECT & NOTIFY
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="reject-form"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col h-full"
                        >
                          <p className="text-[10px] text-red-400 uppercase tracking-widest mb-4">Specify Rejection Reason</p>
                          <textarea 
                            autoFocus
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Image mismatch, Low quality video, Fake profile..."
                            className="w-full flex-1 bg-black/50 border border-red-500/30 rounded-lg p-4 text-sm text-white resize-none focus:outline-none focus:border-red-500/70 transition-colors mb-4 placeholder:text-white/20"
                          />
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setIsRejecting(false)}
                              className="flex-1 py-3 border border-white/10 rounded-lg text-xs text-white/50 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleReject}
                              disabled={rejectReason.trim().length === 0}
                              className={`flex-1 py-3 rounded-lg text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-2 ${
                                rejectReason.trim().length > 0
                                ? "bg-red-900/80 border border-red-500 text-red-100" 
                                : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              Confirm Rejection <ChevronRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                 </div>
               </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
