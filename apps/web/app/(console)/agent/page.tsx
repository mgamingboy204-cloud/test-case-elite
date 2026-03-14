"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarClock, ChevronRight, CheckCircle2 } from "lucide-react";

// Mock Data
type Handshake = {
  id: string;
  userA: { name: string; location: string; photo: string };
  userB: { name: string; location: string; photo: string };
  matchedOn: string;
};

const INITIAL_QUEUE: Handshake[] = [
  {
    id: "req-1",
    userA: { name: "Alexander V.", location: "New York, NY", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop" },
    userB: { name: "Isabella R.", location: "Manhattan, NY", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" },
    matchedOn: "2 hours ago"
  },
  {
    id: "req-2",
    userA: { name: "Marcus C.", location: "London, UK", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" },
    userB: { name: "Eleanor W.", location: "London, UK", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop" },
    matchedOn: "5 hours ago"
  },
  {
    id: "req-3",
    userA: { name: "David K.", location: "Los Angeles, CA", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop" },
    userB: { name: "Sophia M.", location: "Beverly Hills, CA", photo: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop" },
    matchedOn: "1 day ago"
  }
];

export default function AgentWorkspace() {
  const [queue, setQueue] = useState<Handshake[]>(INITIAL_QUEUE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isDispatching, setIsDispatching] = useState(false);

  // Manual Curation State
  const [venues, setVenues] = useState([{ name: "", address: "" }, { name: "", address: "" }, { name: "", address: "" }]);
  const [timeSlots, setTimeSlots] = useState(["", "", "", ""]);

  const activeRequest = queue.find(q => q.id === selectedId);

  const handleUpdateVenue = (index: number, field: 'name' | 'address', value: string) => {
    const newVenues = [...venues];
    newVenues[index][field] = value;
    setVenues(newVenues);
  };

  const handleUpdateTimeSlot = (index: number, value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index] = value;
    setTimeSlots(newSlots);
  };

  const handleDispatch = () => {
    if (!activeRequest) return;
    setIsDispatching(true);

    // Simulate dispatch delay
    setTimeout(() => {
      setQueue(q => q.filter(item => item.id !== activeRequest.id));
      setSelectedId(null);
      
      // Reset Workspace
      setVenues([{ name: "", address: "" }, { name: "", address: "" }, { name: "", address: "" }]);
      setTimeSlots(["", "", "", ""]);
      setIsDispatching(false);
    }, 1500);
  };

  return (
    <div className="w-full h-full p-8 flex gap-8">
      
      {/* Handshake Queue Sidebar */}
      <div className="w-96 shrink-0 flex flex-col h-full bg-[#0a0c10]/80 rounded-xl border border-[#1f222b] overflow-hidden">
        <div className="p-6 border-b border-[#1f222b] bg-[#0a0c10]">
           <h2 className="text-xl font-serif text-white tracking-widest uppercase mb-1">Queue</h2>
           <p className="text-[10px] text-[#C89B90] uppercase tracking-widest">{queue.length} Pending Handshakes</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {queue.map((req) => (
              <motion.button
                layout
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ x: -100, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedId(req.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedId === req.id 
                  ? "border-[#C89B90]/40 bg-[#C89B90]/5 shadow-[0_0_20px_rgba(200,155,144,0.1)]" 
                  : "border-[#1f222b] hover:border-[#C89B90]/20 hover:bg-white/[0.02]"
                }`}
              >
                 <div className="flex items-center justify-between gap-4">
                    {/* User A */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <img src={req.userA.photo} alt={req.userA.name} className="w-12 h-12 rounded-full object-cover border border-[#1f222b]" />
                       <div className="text-center">
                         <p className="text-xs font-serif text-white whitespace-nowrap">{req.userA.name}</p>
                         <p className="text-[9px] text-white/40 uppercase tracking-widest whitespace-nowrap max-w-[80px] truncate">{req.userA.location}</p>
                       </div>
                    </div>
                    
                    {/* Connection Node */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C89B90]" />
                       <div className="w-px h-4 bg-gradient-to-b from-[#C89B90] to-transparent opacity-30" />
                       <span className="text-[8px] text-[#C89B90] uppercase tracking-[0.2em]">{req.matchedOn}</span>
                    </div>

                    {/* User B */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <img src={req.userB.photo} alt={req.userB.name} className="w-12 h-12 rounded-full object-cover border border-[#1f222b]" />
                       <div className="text-center">
                         <p className="text-xs font-serif text-white whitespace-nowrap">{req.userB.name}</p>
                         <p className="text-[9px] text-white/40 uppercase tracking-widest whitespace-nowrap max-w-[80px] truncate">{req.userB.location}</p>
                       </div>
                    </div>
                 </div>
              </motion.button>
            ))}
          </AnimatePresence>
          
          {queue.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-4 text-white/30">
              <CheckCircle2 size={32} strokeWidth={1} />
              <p className="text-xs uppercase tracking-widest">Queue Clear</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Curation Interface */}
      <div className="flex-1 h-full rounded-xl border border-[#1f222b] bg-[#0a0c10]/60 backdrop-blur-xl relative overflow-hidden flex flex-col">
        {!activeRequest ? (
          <div className="m-auto flex flex-col items-center gap-4 opacity-50">
             <MapPin size={48} className="text-[#C89B90]" strokeWidth={1} />
             <p className="text-sm font-serif text-white uppercase tracking-widest">Select a Handshake to Curate</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 border-b border-[#1f222b] bg-[#0a0c10] shrink-0">
               <h2 className="text-2xl font-serif text-white tracking-widest uppercase mb-2">Curation Canvas</h2>
               <p className="text-xs text-white/40 uppercase tracking-widest">
                 Drafting itinerary for <span className="text-[#C89B90]">{activeRequest.userA.name}</span> & <span className="text-[#C89B90]">{activeRequest.userB.name}</span>
               </p>
            </div>

            {/* Scrollable Work Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-12">
               
               {/* Inputs Column */}
               <div className="flex-1 flex flex-col gap-12">
                 
                 {/* Venues Section */}
                 <section>
                   <div className="flex items-center gap-3 mb-6">
                     <MapPin size={18} className="text-[#C89B90]" />
                     <h3 className="text-sm font-serif text-white uppercase tracking-widest">Venue Selection (3)</h3>
                   </div>
                   
                   <div className="flex flex-col gap-6">
                     {[0, 1, 2].map((i) => (
                       <div key={`venue-${i}`} className="p-5 rounded-lg border border-[#1f222b] bg-white/[0.01] flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#C89B90] uppercase tracking-[0.2em]">Option 0{i+1}</span>
                         </div>
                         <input 
                           type="text" 
                           placeholder="Venue Name (e.g. The Polo Lounge)" 
                           value={venues[i].name}
                           onChange={(e) => handleUpdateVenue(i, 'name', e.target.value)}
                           className="w-full bg-transparent border-b border-[#C89B90]/30 focus:border-[#C89B90] pb-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                         />
                         <input 
                           type="text" 
                           placeholder="Address/Details (e.g. Beverly Hills Hotel, California...)" 
                           value={venues[i].address}
                           onChange={(e) => handleUpdateVenue(i, 'address', e.target.value)}
                           className="w-full bg-transparent border-b border-[#C89B90]/30 focus:border-[#C89B90] pb-2 text-xs font-sans text-white/70 placeholder:text-white/20 focus:outline-none transition-colors"
                         />
                       </div>
                     ))}
                   </div>
                 </section>

                 <div className="w-full h-px bg-[#1f222b]" />

                 {/* Time Slots Section */}
                 <section>
                   <div className="flex items-center gap-3 mb-6">
                     <CalendarClock size={18} className="text-[#C89B90]" />
                     <h3 className="text-sm font-serif text-white uppercase tracking-widest">Avaialable Time Slots (4)</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     {[0, 1, 2, 3].map((i) => (
                       <div key={`slot-${i}`} className="p-4 rounded-lg border border-[#1f222b] bg-white/[0.01]">
                         <span className="block text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3">Slot 0{i+1}</span>
                         <input 
                           type="text" 
                           placeholder="e.g. Saturday, 14th March - 5:00 PM" 
                           value={timeSlots[i]}
                           onChange={(e) => handleUpdateTimeSlot(i, e.target.value)}
                           className="w-full bg-transparent border-b border-[#C89B90]/30 focus:border-[#C89B90] pb-2 text-xs font-sans text-white placeholder:text-white/20 focus:outline-none transition-colors"
                         />
                       </div>
                     ))}
                   </div>
                 </section>

               </div>

               {/* Preview & Dispatch Column */}
               <div className="w-80 shrink-0 flex flex-col gap-6 lg:border-l lg:border-[#1f222b] lg:pl-12">
                   <h3 className="text-sm font-serif text-white uppercase tracking-widest">Client Preview</h3>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                     This is how the curated itinerary will appear in both users' inboxes.
                   </p>

                   {/* Mock Phone Notification Bubble */}
                   <div className="mt-4 p-5 rounded-2xl bg-[#1f222b]/50 border border-[#1f222b] shadow-2xl relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C89B90]/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      
                      <p className="text-[10px] text-[#C89B90] uppercase tracking-widest mb-3">Elite Concierge</p>
                      <h4 className="text-sm font-serif text-white mb-2">Your Itinerary is Ready</h4>
                      <p className="text-xs text-white/60 font-sans leading-relaxed mb-4">
                        We have curated 3 exclusive venue options and 4 potential times for your rendezvous with {activeRequest.userB.name.split(' ')[0]}.
                      </p>
                      
                      {venues[0].name && (
                        <div className="p-3 bg-[#0a0c10] rounded-lg border border-[#C89B90]/20 mb-2">
                           <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Preview Option 1</p>
                           <p className="text-xs font-serif text-white">{venues[0].name}</p>
                           <p className="text-[10px] text-white/40 mt-1 truncate">{venues[0].address}</p>
                        </div>
                      )}

                      <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white uppercase tracking-widest pointer-events-none">
                        View Full Details
                      </button>
                   </div>

                   {/* Dispatch Action */}
                   <div className="mt-auto pt-8">
                     <button 
                       onClick={handleDispatch}
                       disabled={isDispatching || !venues[0].name || !timeSlots[0]}
                       className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 uppercase text-[11px] font-semibold tracking-widest transition-all ${
                         isDispatching 
                         ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' 
                         : (!venues[0].name || !timeSlots[0])
                           ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                           : 'bg-[#C89B90] text-[#0a0c10] shadow-[0_0_20px_rgba(200,155,144,0.3)] hover:scale-[1.02]'
                       }`}
                     >
                       {isDispatching ? (
                         <>
                           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                             <CheckCircle2 size={16} />
                           </motion.div>
                           Dispatching...
                         </>
                       ) : (
                         <>DISPATCH CURATED ITINERARY <ChevronRight size={16} /></>
                       )}
                     </button>
                   </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
