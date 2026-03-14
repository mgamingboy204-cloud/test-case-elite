"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Video, Check } from "lucide-react";

export default function VideoVerification() {
  const { completeOnboardingStep } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const startVerification = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 2500);
  };

  const proceed = () => completeOnboardingStep('PAYMENT');

  return (
    <div className="flex flex-col h-full px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">

        {/* Scanning Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Rotating conic ring */}
          <motion.div
            animate={verifying ? { rotate: 360 } : verified ? {} : { rotate: 360 }}
            transition={{ duration: verifying ? 1.2 : 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: verified
                ? 'conic-gradient(from 0deg, rgba(200,155,144,0.9) 0%, rgba(200,155,144,0.9) 100%)'
                : 'conic-gradient(from 0deg, transparent 60%, rgba(200,155,144,0.8) 100%)',
            }}
          />
          <div className="absolute inset-[3px] rounded-full bg-background flex items-center justify-center">
            {verified ? (
              <Check size={36} className="text-primary" strokeWidth={1} />
            ) : (
              <Video
                size={28}
                className={verifying ? 'text-primary animate-pulse' : 'text-primary/40'}
                strokeWidth={1}
              />
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-wide mb-4">
            {verified ? 'Verification ' : 'Identity '}
            <span className="text-primary">{verified ? 'Confirmed' : 'Verification'}</span>
          </h1>
          <p className="text-foreground/40 font-light leading-relaxed max-w-xs uppercase tracking-widest text-[10px]">
            {verified
              ? 'The inner circle recognizes your credentials. Identification complete.'
              : 'A brief self-video confirms your membership in our exclusive, curated network.'}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none space-y-4">
        {!verified ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startVerification}
            disabled={verifying}
            className="btn-elite-primary"
          >
            {verifying ? 'Biometric Scan...' : 'Initiate Verification'}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={proceed}
            className="btn-elite-primary"
          >
            Advance to Funding
          </motion.button>
        )}
        <p className="text-[8px] uppercase tracking-[0.3em] text-center text-foreground/20 px-4">
          Biometric signatures are encrypted end-to-end and destroyed post-session.
        </p>
      </div>
    </div>
  );
}
