"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { getOfflineMeet, getOnlineMeet, getPhoneUnlock, getSocialExchange, respondMatchConsent, unmatch } from "@/lib/matches";
import { fetchMatches, type MatchCard } from "@/lib/queries";
import { primeCache, useStaleWhileRevalidate } from "@/lib/cache";
import { MapPin, Video, Link as LinkIcon, Unlock, ChevronRight, Loader2, Instagram, Linkedin, Ghost, X, CheckCircle2, Copy, UserMinus } from "lucide-react";


const springTransition = { type: "spring", bounce: 0.15, duration: 0.6 } as any;

const VENUES = ["Soho House", "The Leela Lounge", "Blue Tokai Reserve"];
const TIMES = ["Sat 4PM", "Sat 8PM", "Sun 11AM"];
const PLATFORMS = ["FaceTime", "G-Meet", "Zoom"];

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();

  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null);

  const matchesQuery = useStaleWhileRevalidate({
    key: "matches",
    fetcher: fetchMatches,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 60_000
  });

  const matches = matchesQuery.data ?? [];

  if (!isAuthenticated || onboardingStep !== 'COMPLETED') return null;

  return (
    <div className="w-full h-full relative">
      
      {/* Grid area */}
      <div className="w-full px-6 md:px-8 pt-8 pb-20">
        
        {/* Page Header */}
        <div className="w-full pb-8 flex flex-col items-center justify-center z-10">
          <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm uppercase">
            Matches
          </h1>
        </div>

        {/* Grid Layout */}
        {matchesQuery.isRefreshing && matches.length === 0 ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-foreground/50" /></div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center text-sm text-foreground/60">No active matches yet. Mutual interest will appear here discreetly.</div>
        ) : <div className="grid grid-cols-2 gap-4 auto-rows-max">
          {matches.map((match) => (
            <motion.div
              key={match.id}
              layoutId={`container-${match.id}`}
              onClick={() => setSelectedMatch(match)}
              className="relative w-full flex flex-col cursor-pointer group"
              transition={springTransition}
            >
              {/* Photo — no fog overlay */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                <motion.img
                  layoutId={`image-${match.id}`}
                  src={match.image}
                  alt={match.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  draggable={false}
                  transition={springTransition}
                />
                {/* Narrow bottom scrim — only behind the very edge */}
                <motion.div layoutId={`gradient-${match.id}`} className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-black/50 to-transparent z-10" />
              </div>

              {/* Name/Location — below the photo, clean and legible */}
              <motion.div layoutId={`info-${match.id}`} className="pt-3 pb-1 px-1">
                <h3 className="text-base font-serif text-foreground tracking-wide">{match.name}, <span className="font-light">{match.age}</span></h3>
                <p className="text-[9px] uppercase tracking-[0.2em] font-medium text-foreground/40 mt-0.5">{match.location}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>}

      </div>

      {/* Expanded Modal (Shared Layout Morph) */}
      <AnimatePresence>
        {selectedMatch && (
           <MatchModal
             match={selectedMatch}
             onClose={() => setSelectedMatch(null)}
             onUnmatch={(matchId) => {
               const next = matches.filter((entry) => entry.id !== matchId);
               primeCache("matches", next);
               matchesQuery.setData(next);
               setSelectedMatch(null);
             }}
           />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Match Expanded Modal & State Machine ---
function MatchModal({ match, onClose, onUnmatch }: { match: MatchCard, onClose: () => void; onUnmatch: (matchId: string) => void }) {
  const [flowState, setFlowState] = useState<
    'idle' | 
    'offline_step1' | 'offline_pending_match' | 'offline_agent' | 'offline_selection' | 'offline_pending_final' | 'offline_success' |
    'online_step1' | 'online_pending_match' | 'online_agent' | 'online_success' |
    'social_step1' | 'social_pending_match' | 'social_agent' | 'social_success' |
    'phone_step1' | 'phone_pending_match' | 'phone_agent' | 'phone_success'
  >('idle');

  // Specific flow states
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedSocial, setSelectedSocial] = useState<string | null>(null);
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null);
  const [socialHandle, setSocialHandle] = useState<string>("@liam_creative");
  const [isUnmatching, setIsUnmatching] = useState(false);

  // Flow Triggers
  const startFlow = (flow: string) => setFlowState(`${flow}_step1` as any);
  const handleUnmatch = async () => {
    if (isUnmatching) return;
    setIsUnmatching(true);
    try {
      await unmatch(match.id);
      onUnmatch(match.id);
    } finally {
      setIsUnmatching(false);
    }
  };
  const proceedOfflineInvite = async () => {
    setFlowState('offline_pending_match');
    await respondMatchConsent({ matchId: match.id, type: 'OFFLINE_MEET', response: 'YES' });
    setFlowState('offline_agent');
    setTimeout(() => setFlowState('offline_selection'), 1200);
  };

  const proceedOfflineSubmit = async () => {
    setFlowState('offline_pending_final');
    await respondMatchConsent({
      matchId: match.id,
      type: 'OFFLINE_MEET',
      response: 'YES',
      payload: { venues: selectedVenues, times: selectedTimes }
    });
    await getOfflineMeet(match.id).catch(() => null);
    setFlowState('offline_success');
  }

  const proceedOnline = async () => {
    setFlowState('online_pending_match');
    await respondMatchConsent({
      matchId: match.id,
      type: 'ONLINE_MEET',
      response: 'YES',
      payload: { platforms: selectedPlatforms, times: selectedTimes }
    });
    setFlowState('online_agent');
    await getOnlineMeet(match.id).catch(() => null);
    setTimeout(() => setFlowState('online_success'), 1200);
  };

  const proceedSocial = async () => {
    if(!selectedSocial) return;
    setFlowState('social_pending_match');
    await respondMatchConsent({
      matchId: match.id,
      type: 'SOCIAL_EXCHANGE',
      response: 'YES',
      payload: { platform: selectedSocial }
    });
    setFlowState('social_agent');
    const exchange = await getSocialExchange(match.id).catch(() => null);
    if (exchange?.payloads?.length) {
      const firstPayload = exchange.payloads.find((entry) => typeof entry.payload === 'object' && entry.payload !== null) as { payload?: { handle?: string; platform?: string } } | undefined;
      if (firstPayload?.payload?.handle) setSocialHandle(firstPayload.payload.handle);
    }
    setTimeout(() => setFlowState('social_success'), 1200);
  };

  const proceedPhone = async () => {
    setFlowState('phone_pending_match');
    await respondMatchConsent({ matchId: match.id, type: 'PHONE_NUMBER', response: 'YES' });
    setFlowState('phone_agent');
    const unlock = await getPhoneUnlock(match.id).catch(() => null);
    if (unlock?.users?.length) {
      setUnlockedPhone(unlock.users[0]?.phone ?? null);
    }
    setTimeout(() => setFlowState('phone_success'), 1200);
  };

  // Content Renderer
  const renderFlowContent = () => {
    switch (flowState) {
      case 'idle':
        return (
          <div className="flex flex-col gap-3">
             <ActionTile icon={MapPin} title="Offline Meet" onClick={() => startFlow('offline')} />
             <ActionTile icon={Video} title="Online Meet" onClick={() => startFlow('online')} />
             <ActionTile icon={LinkIcon} title="Exchange Socials" onClick={() => startFlow('social')} />
             <ActionTile icon={Unlock} title="Unlock Phone" onClick={() => startFlow('phone')} />
          </div>
        );

      /* OFFLINE FLOW */
      case 'offline_step1':
        return (
          <FlowStep title="Initiate Rendezvous" subtitle={`Invite ${match.name} to meet offline. If they accept, our physical Concierge Agent will personally review both your locations and curate 3 premium venues.`}>
             <PrimaryButton label="Send Invitation" onClick={proceedOfflineInvite} />
          </FlowStep>
        );
      case 'offline_pending_match':
        return <PendingStep message={`Invitation Sent. Awaiting ${match.name}'s response...`} />;
      case 'offline_agent':
        return <AgentReviewStep agentName="Julian" message={`Invitation Accepted! Our Concierge Agent, Julian, is now reviewing your locations and curating your shortlist...`} />;
      case 'offline_selection':
        return (
          <FlowStep title="Agent Julian’s Curated Shortlist" subtitle="Select the options that suit you best.">
             <div className="flex flex-col gap-4">
                <ScrollSelector items={VENUES} selected={selectedVenues} onChange={setSelectedVenues} />
                <ScrollSelector items={TIMES} selected={selectedTimes} onChange={setSelectedTimes} />
                <PrimaryButton label="Submit to Agent" onClick={proceedOfflineSubmit} disabled={selectedVenues.length === 0 || selectedTimes.length === 0} />
             </div>
          </FlowStep>
        );
      case 'offline_pending_final':
        return <PendingStep message={`Coordinating final details...`} />;
      case 'offline_success':
        return <SuccessStep title="Itinerary Confirmed" message={`Agent Julian has secured your table at ${selectedVenues[0] || 'Soho House'} on ${selectedTimes[0] || 'Saturday at 4:00 PM'}. An entry pass has been sent to your Alerts.`} />;

      /* ONLINE FLOW */
      case 'online_step1':
        return (
          <FlowStep title="Virtual Rendezvous" subtitle="Select preferred platforms and availability.">
             <div className="flex flex-col gap-4">
                <ScrollSelector items={PLATFORMS} selected={selectedPlatforms} onChange={setSelectedPlatforms} />
                <ScrollSelector items={TIMES} selected={selectedTimes} onChange={setSelectedTimes} />
                <PrimaryButton label="Request Virtual Meet" onClick={proceedOnline} disabled={selectedPlatforms.length === 0 || selectedTimes.length === 0} />
             </div>
          </FlowStep>
        );
      case 'online_pending_match':
        return <PendingStep message={`Awaiting ${match.name}'s response...`} />;
      case 'online_agent':
        return <AgentReviewStep agentName="Julian" message={`Agent is reviewing time zones and generating a secure bridge...`} />;
      case 'online_success':
        return <SuccessStep title="Virtual Rendezvous Confirmed" message={`Virtual Meet Confirmed for ${selectedTimes[0] || 'Sunday 11:00 AM'}. A secure link will be generated 15 minutes prior.`} />;

      /* SOCIAL FLOW */
      case 'social_step1':
        return (
          <FlowStep title="Exchange Credentials" subtitle="Choose a platform to share.">
             <div className="grid grid-cols-3 gap-3 mb-4">
                <SocialTile icon={Instagram} label="Instagram" isSelected={selectedSocial === 'Instagram'} onClick={() => setSelectedSocial('Instagram')} />
                <SocialTile icon={Linkedin} label="LinkedIn" isSelected={selectedSocial === 'LinkedIn'} onClick={() => setSelectedSocial('LinkedIn')} />
                <SocialTile icon={Ghost} label="Snapchat" isSelected={selectedSocial === 'Snapchat'} onClick={() => setSelectedSocial('Snapchat')} />
             </div>
             <PrimaryButton label="Request Exchange" onClick={proceedSocial} disabled={!selectedSocial} />
          </FlowStep>
        );
      case 'social_pending_match':
        return <PendingStep message="Requesting permission to exchange..." />;
      case 'social_agent':
        return <AgentReviewStep agentName="Julian" message={`Agent is verifying both consents and revealing IDs securely...`} />;
      case 'social_success':
        return (
          <SuccessStep title="Exchange Secured" message="Credentials safely transmitted.">
             <div className="mt-4 p-4 rounded-xl bg-foreground/5 border border-border/10 flex items-center justify-between backdrop-blur-md">
                <span className="text-primary font-medium tracking-wide">{socialHandle}</span>
                <button className="p-2 hover:bg-foreground/10 rounded-full transition-colors"><Copy size={16} className="text-foreground/60" /></button>
             </div>
          </SuccessStep>
        );

      /* PHONE FLOW */
      case 'phone_step1':
        return (
          <FlowStep title="Unlock Direct Line" subtitle={`This requires mutual consent. Your number will only be revealed if ${match.name} agrees. (Requires 1 Elite Credit)`}>
             <PrimaryButton label="Request Unlock" onClick={proceedPhone} />
          </FlowStep>
        );
      case 'phone_pending_match':
        return <PendingStep message="Awaiting secure unlock approval..." />;
      case 'phone_agent':
        return <AgentReviewStep agentName="Julian" message={`Agent is verifying mutual approval before Secure Reveal...`} />;
      case 'phone_success':
        return (
          <SuccessStep title="Direct Line Unlocked" message="Connection established.">
             <div className="mt-4 flex justify-center py-4">
                <span className="text-2xl font-serif text-white tracking-widest">{unlockedPhone ?? "+91 • 98765 43210"}</span>
             </div>
          </SuccessStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        // onClick={onClose} // Optional to close on backdrop click
      />

      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.1, ...springTransition }}
        onClick={onClose}
        className="absolute top-[env(safe-area-inset-top,24px)] right-6 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X size={20} className="text-white drop-shadow-md" />
      </motion.button>

      <motion.div 
        layoutId={`container-${match.id}`}
        transition={springTransition}
        className="relative z-[105] w-full max-w-sm rounded-[2.5rem] overflow-hidden bg-background border border-primary/20 shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Top Half: Photo Component */}
        <div className="w-full relative shrink-0 aspect-square">
           <motion.img 
             layoutId={`image-${match.id}`}
             src={match.image}
             alt={match.name}
             className="absolute inset-0 w-full h-full object-cover"
             draggable={false}
             transition={springTransition}
           />
           <motion.div layoutId={`gradient-${match.id}`} className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
           <motion.div layoutId={`info-${match.id}`} className="absolute bottom-6 left-6 z-20 flex flex-col">
              <h3 className="text-4xl font-serif text-foreground tracking-wide drop-shadow-md">{match.name}, <span className="font-light">{match.age}</span></h3>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mt-1">{match.location}</p>
           </motion.div>
        </div>

        {/* Bottom Half: State Machine Animated Content */}
        <div className="w-full relative shrink-0 p-6 pb-8 overflow-y-auto no-scrollbar min-h-[220px]">
           <AnimatePresence mode="wait">
              <motion.div 
                 key={flowState}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3, ease: 'easeInOut' }}
                 className="flex flex-col w-full h-full"
              >
                  {renderFlowContent()}
                  <button
                    onClick={() => void handleUnmatch()}
                    disabled={isUnmatching}
                    className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:bg-primary/10 disabled:opacity-50"
                  >
                    {isUnmatching ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                    Unmatch
                  </button>
              </motion.div>
           </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}

// --- Action & Flow Micro-Components ---

function ActionTile({ icon: Icon, title, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors shadow-sm`}
    >
      <div className="flex items-center gap-4">
         <Icon size={20} className="text-primary" strokeWidth={1} />
         <span className={`text-[13px] text-foreground font-medium tracking-wide`}>{title}</span>
      </div>
      <ChevronRight size={16} className="text-primary/40" />
    </button>
  );
}

function FlowStep({ title, subtitle, children }: any) {
  return (
    <div className="flex flex-col h-full justify-center">
       <h4 className="text-foreground font-serif text-xl mb-1">{title}</h4>
       <p className="text-xs text-foreground/50 font-light leading-relaxed mb-6">{subtitle}</p>
       {children}
    </div>
  )
}

function PendingStep({ message }: { message: string }) {
  return (
     <div className="flex flex-col items-center justify-center h-full py-10 gap-6">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-[11px] text-foreground/40 uppercase tracking-[0.3em] font-bold text-center">{message}</p>
     </div>
  )
}

function SuccessStep({ title, message, children }: any) {
  return (
     <div className="flex flex-col items-center justify-center h-full py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 border border-primary/30">
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-primary" />
        </div>
       {title && <h4 className="text-xl font-serif text-foreground mb-2">{title}</h4>}
       <p className="text-xs font-light leading-relaxed text-foreground/60 mb-2 px-6">{message}</p>
       {children && <div className="w-full mt-2">{children}</div>}
    </div>
  )
}

function AgentReviewStep({ agentName, message }: { agentName: string, message: string }) {
  return (
     <div className="flex flex-col items-center justify-center h-full py-6">
        <div className="relative mb-6">
           <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80" alt={`Agent ${agentName}`} className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xl" />
           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center shadow-md">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
           </div>
        </div>
        <h4 className="text-primary font-serif text-xl mb-1">Agent {agentName}</h4>
        <p className="text-[11px] text-foreground/50 font-medium leading-relaxed text-center px-4 uppercase tracking-widest">{message}</p>
     </div>
  )
}

function PrimaryButton({ label, onClick, disabled }: any) {
  return (
    <button 
       disabled={disabled}
       onClick={onClick} 
       className="w-full mt-2 py-3 rounded-xl bg-primary text-background uppercase text-[10px] tracking-widest font-semibold shadow-md disabled:opacity-50 disabled:grayscale transition-all"
    >
       {label}
    </button>
  )
}

function ScrollSelector({ items, selected, onChange }: { items: string[], selected: string[], onChange: (arr: string[]) => void }) {
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter(i => i !== val));
    else onChange([...selected, val]);
  }
  return (
    <div className="w-full flex overflow-x-auto no-scrollbar gap-2 pb-1">
      {items.map(item => {
        const isActive = selected.includes(item);
        return (
          <button 
            key={item} 
            onClick={() => toggle(item)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs transition-all border ${
              isActive 
                ? 'bg-foreground/10 border-primary text-primary shadow-[0_0_10px_rgba(200,155,144,0.2)]' 
                : 'bg-foreground/5 border-foreground/8 text-foreground/50 hover:bg-foreground/10'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

function SocialTile({ icon: Icon, label, isSelected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
        isSelected ? 'bg-white/10 border-[#E0BFB8] shadow-md' : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <Icon size={24} strokeWidth={1.5} className={isSelected ? 'text-primary' : 'text-foreground/50'} />
      <span className={`text-[9px] uppercase tracking-widest mt-2 ${isSelected ? 'text-primary font-semibold' : 'text-foreground/40'}`}>{label}</span>
    </button>
  )
}
