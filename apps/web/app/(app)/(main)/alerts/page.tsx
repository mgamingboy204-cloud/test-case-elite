"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// --- Mock Data ---
interface Alert {
  id: string;
  type: 'INTEREST' | 'CONNECTION' | 'CONCIERGE';
  title: string;
  message: string;
  timestamp: string;
  image: string;
  isUnread: boolean;
  targetId?: number;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    type: "CONCIERGE",
    title: "Priority Concierge",
    message: "Aisha has requested an Offline Rendezvous.",
    timestamp: "2m ago",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    isUnread: true,
  },
  {
    id: "a2",
    type: "CONNECTION",
    title: "New Match",
    message: "New Connection: James is waiting for your move.",
    timestamp: "1h ago",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    isUnread: true,
  },
  {
    id: "a3",
    type: "INTEREST",
    title: "New Interest",
    message: "A new member is interested in connecting.",
    timestamp: "4h ago",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    isUnread: false,
  },
  {
    id: "a4",
    type: "INTEREST",
    title: "New Interest",
    message: "A new member is interested in connecting.",
    timestamp: "1d ago",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
    isUnread: false,
  }
];

export default function AlertsPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/signin');
    else if (onboardingStep !== 'COMPLETED') router.replace('/onboarding/verification'); 
  }, [isAuthenticated, onboardingStep, router]);

  if (!isAuthenticated || onboardingStep !== 'COMPLETED') return null;

  const handleAlertClick = (alert: Alert) => {
    // Deep Linking Mock Logic
    if (alert.type === 'INTEREST') {
      router.push('/likes');
    } else if (alert.type === 'CONNECTION') {
      router.push('/matches');
    } else if (alert.type === 'CONCIERGE') {
      router.push('/matches'); // In a real app with global state, we would pass a param or set context to auto-open Aisha & trigger specific flow
    }
  };

  return (
    <div className="w-full h-full relative">
      
      {/* Page Header */}
      <div className="w-full pt-8 pb-4 flex flex-col items-center justify-center px-6">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm uppercase">
          Alerts
        </h1>
      </div>

      {/* Alerts List */}
      <div className="w-full px-4 pt-4 pb-20 flex flex-col gap-3">
        {MOCK_ALERTS.map((alert, index) => (
          <motion.button
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAlertClick(alert)}
            className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
              alert.isUnread 
                ? 'bg-primary/5 border-primary/20 shadow-md' 
                : 'bg-transparent border-transparent hover:bg-primary/5'
            }`}
          >
            {/* Contextual Thumbnail */}
            <div className="shrink-0 relative">
               {alert.type === 'INTEREST' && (
                 <img src={alert.image} alt="Blurred profile" className="w-14 h-14 rounded-full object-cover blur-sm border border-white/10 opacity-80" />
               )}
               {alert.type === 'CONNECTION' && (
                 <img src={alert.image} alt={alert.title} className="w-14 h-14 rounded-[1rem] object-cover border border-white/10 shadow-sm" />
               )}
               {alert.type === 'CONCIERGE' && (
                 <div className="relative">
                   <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-highlight to-primary opacity-50 blur-sm animate-pulse" />
                   <img src={alert.image} alt={alert.title} className="w-14 h-14 rounded-full object-cover border-2 border-[#E0BFB8] relative z-10 shadow-[0_0_15px_rgba(224,191,184,0.4)]" />
                 </div>
               )}

               {/* Unread Indicator Dot */}
               {alert.isUnread && alert.type !== 'CONCIERGE' && (
                 <div className="absolute top-0 right-0 w-3 h-3 bg-[#E0BFB8] rounded-full border-2 border-slate-900" />
               )}
            </div>

            {/* Alert Content */}
            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
               <div className="flex justify-between items-center w-full">
                  <h3 className="font-serif text-foreground text-[16px] truncate">{alert.title}</h3>
                  <span className="text-[10px] text-foreground/30 tracking-widest font-bold shrink-0 ml-2 uppercase">{alert.timestamp}</span>
               </div>
               <p className={`text-[13px] leading-relaxed truncate ${alert.isUnread ? 'text-primary' : 'text-foreground/60 font-light'}`}>
                 {alert.message}
               </p>
            </div>
          </motion.button>
        ))}
        
        {/* End of Line Indicator */}
        <div className="w-full flex justify-center py-6 pb-20">
           <div className="w-1 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
      
    </div>
  );
}
