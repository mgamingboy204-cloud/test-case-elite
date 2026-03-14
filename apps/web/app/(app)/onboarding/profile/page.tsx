"use client";

import { useState, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

// ─── DOB Data ───────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const THIS_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: 70 }, (_, i) => String(THIS_YEAR - 17 - i));

// ─── Intents ─────────────────────────────────────────────────────────────────
const INTENTS = [
  { id: "partner",   label: "Long-term Partner",     emoji: "♾" },
  { id: "network",   label: "Discreet Networking",   emoji: "○" },
  { id: "dating",    label: "Curated Dating",        emoji: "◇" },
];

// ─── Sub-steps ───────────────────────────────────────────────────────────────
const TOTAL_SUB = 5; // name, dob, city, profession, intent

// ─── Shared variants ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit:  { opacity: 0, x: -40 },
};

// ─── DOB Drum Column ─────────────────────────────────────────────────────────
function DrumColumn({
  items, idx, onIdx,
}: { items: string[]; idx: number; onIdx: (i: number) => void }) {
  return (
    <div className="relative flex flex-col items-center w-full overflow-hidden">
      <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-[52px] border-y border-primary/20 bg-primary/[0.03] z-0" />

      <button onClick={() => onIdx(Math.max(0, idx - 1))}
        className="z-20 py-1.5 text-primary/40 hover:text-primary transition-colors touch-manipulation">
        <ChevronUp size={16} strokeWidth={1.5} />
      </button>

      <div className="h-[156px] w-full flex flex-col items-center justify-center">
        {[-2, -1, 0, 1, 2].map(offset => {
          const i   = idx + offset;
          const val = items[i];
          if (!val) return <div key={`e${offset}`} className="h-[52px]" />;
          const center = offset === 0;
          return (
            <div key={i} onClick={() => onIdx(i)}
              className={`h-[52px] w-full flex items-center justify-center cursor-pointer transition-all duration-200 text-center ${
                center ? "text-primary font-medium" : "text-foreground/20 hover:text-foreground/40"
              }`}
              style={{
                fontSize: center ? "1.15rem" : "0.82rem",
                transform: `scale(${1 - Math.abs(offset) * 0.1})`,
                opacity: 1 - Math.abs(offset) * 0.4,
              }}
            >
              {val}
            </div>
          );
        })}
      </div>

      <button onClick={() => onIdx(Math.min(items.length - 1, idx + 1))}
        className="z-20 py-1.5 text-primary/40 hover:text-primary transition-colors touch-manipulation">
        <ChevronDown size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileSetup() {
  const { completeOnboardingStep } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sub-step index (0–4)
  const [sub, setSub]         = useState(0);

  // Fields
  const [name, setName]       = useState("");
  const [dayIdx, setDayIdx]   = useState(14);
  const [monIdx, setMonIdx]   = useState(5);
  const [yrIdx,  setYrIdx]    = useState(5);
  const [city, setCity]       = useState("");
  const [profession, setProf] = useState("");
  const [intent, setIntent]   = useState("");

  const age = useMemo(() => {
    const dob   = new Date(Number(YEARS[yrIdx]), monIdx, Number(DAYS[dayIdx]));
    const today = new Date();
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    return a;
  }, [dayIdx, monIdx, yrIdx]);

  const isAgeValid = age >= 18;

  // Per-step validity
  const stepValid = [
    name.trim().length > 1,
    isAgeValid,
    city.trim().length > 1,
    profession.trim().length > 1,
    !!intent,
  ];

  const advance = async () => {
    if (sub < TOTAL_SUB - 1) {
      setSub(s => s + 1);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await apiRequest("/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          name,
          gender: "OTHER",
          age,
          city,
          profession,
          bioShort: `Looking for ${intent || "dating"}` ,
          intent: "dating"
        })
      });
      completeOnboardingStep("PHOTOS");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">

      {/* Sub-step dots */}
      <div className="flex-none flex items-center justify-center gap-1.5 pt-4 pb-8">
        {Array.from({ length: TOTAL_SUB }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === sub ? "w-5 h-1.5 bg-primary" : i < sub ? "w-1.5 h-1.5 bg-primary/40" : "w-1.5 h-1.5 bg-foreground/12"
          }`} />
        ))}
      </div>

      {/* Animated Step Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={sub}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            {sub === 0 && <NameStep name={name} onChange={setName} />}
            {sub === 1 && (
              <DobStep
                dayIdx={dayIdx} monIdx={monIdx} yrIdx={yrIdx}
                onDay={setDayIdx} onMon={setMonIdx} onYr={setYrIdx}
                age={age} isValid={isAgeValid}
              />
            )}
            {sub === 2 && <TextStep q="Where do you reside?" hint="City, Country" value={city} onChange={setCity} />}
            {sub === 3 && <TextStep q="Your primary vocation?" hint="e.g. Founder, Architect" value={profession} onChange={setProf} />}
            {sub === 4 && <IntentStep selected={intent} onSelect={setIntent} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="flex-none space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!stepValid[sub] || saving}
          onClick={advance}
          className={`btn-elite-primary transition-all ${!stepValid[sub] ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
        >
          {saving ? "Saving..." : sub === TOTAL_SUB - 1 ? "Proceed to Gallery" : "Continue"}
        </motion.button>

        {/* Back ghost link */}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        {sub > 0 && (
          <button onClick={() => setSub(s => s - 1)}
            className="w-full text-center text-[10px] uppercase tracking-[0.35em] text-foreground/30 hover:text-foreground/50 transition-colors py-1">
            Back
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step: Name ───────────────────────────────────────────────────────────────
function NameStep({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full">
      <p className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-semibold mb-6">Identity</p>
      <h2 className="text-4xl font-serif text-foreground tracking-wide leading-tight mb-10">
        What should<br />we call you?
      </h2>
      <input
        type="text"
        autoFocus
        autoComplete="name"
        value={name}
        onChange={e => onChange(e.target.value)}
        placeholder="Full name"
        className="w-full bg-transparent text-4xl font-light text-foreground border-b border-primary/30 pb-4 focus:outline-none focus:border-primary transition-all duration-400 placeholder:text-foreground/15"
      />
    </div>
  );
}

// ─── Step: DOB ────────────────────────────────────────────────────────────────
function DobStep({
  dayIdx, monIdx, yrIdx,
  onDay, onMon, onYr,
  age, isValid
}: {
  dayIdx: number; monIdx: number; yrIdx: number;
  onDay: (i: number) => void; onMon: (i: number) => void; onYr: (i: number) => void;
  age: number; isValid: boolean;
}) {
  return (
    <div className="w-full">
      <p className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-semibold mb-6">Date of Birth</p>
      <h2 className="text-4xl font-serif text-foreground tracking-wide leading-tight mb-10">
        When were<br />you born?
      </h2>

      <div className="grid grid-cols-3 gap-2 border border-primary/15 rounded-3xl bg-foreground/[0.015] p-3">
        <DrumColumn items={DAYS}   idx={dayIdx} onIdx={onDay} />
        <DrumColumn items={MONTHS} idx={monIdx} onIdx={onMon} />
        <DrumColumn items={YEARS}  idx={yrIdx}  onIdx={onYr}  />
      </div>

      <div className="mt-4 text-center">
        {!isValid ? (
          <p className="text-[9px] uppercase tracking-widest text-red-400/70">Members must be 18 or older.</p>
        ) : (
          <p className="text-[9px] uppercase tracking-widest text-foreground/25">Age Confirmed — {age}</p>
        )}
      </div>
    </div>
  );
}

// ─── Step: Generic Text ───────────────────────────────────────────────────────
function TextStep({
  q, hint, value, onChange
}: { q: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full">
      <h2 className="text-4xl font-serif text-foreground tracking-wide leading-tight mb-10">
        {q.split(" ").slice(0, -1).join(" ")}<br />
        <span className="text-primary">{q.split(" ").slice(-1)[0]}</span>
      </h2>
      <input
        type="text"
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={hint}
        className="w-full bg-transparent text-2xl font-light text-foreground border-b border-primary/30 pb-4 focus:outline-none focus:border-primary transition-all duration-400 placeholder:text-foreground/15 tracking-wide"
      />
    </div>
  );
}

// ─── Step: Intent ─────────────────────────────────────────────────────────────
function IntentStep({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="w-full">
      <p className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-semibold mb-6">Intention</p>
      <h2 className="text-4xl font-serif text-foreground tracking-wide leading-tight mb-10">
        What are you<br />here for?
      </h2>
      <div className="flex flex-col gap-4">
        {INTENTS.map(({ id, label, emoji }) => {
          const active = selected === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(id)}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl border text-left transition-all duration-300 ${
                active
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(200,155,144,0.1)]"
                  : "bg-foreground/[0.02] border-foreground/8 hover:border-primary/25"
              }`}
            >
              <span className={`text-2xl transition-all ${active ? "opacity-100" : "opacity-30"}`}>
                {emoji}
              </span>
              <span className={`text-[11px] uppercase tracking-[0.25em] font-medium transition-colors ${
                active ? "text-primary" : "text-foreground/40"
              }`}>
                {label}
              </span>
              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
