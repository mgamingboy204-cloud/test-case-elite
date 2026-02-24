"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useToast } from "@/app/providers";
import { getDefaultRoute, getPwaDefaultRoute } from "@/lib/onboarding";
import styles from "./ProfileWizard.module.css";

type Props = { mode: "desktop" | "pwa" };
type Data = { name: string; intent: "dating" | "friends" | "all" | ""; interests: string[]; gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | ""; photos: string[]; age: string; city: string; profession: string; bio: string };
const KEY = "em_profile_wizard_v2";

const initialData: Data = { name: "", intent: "", interests: [], gender: "", photos: [], age: "", city: "", profession: "", bio: "" };
const interestOptions = ["Travel", "Fitness", "Art", "Food", "Music", "Tech"];
const genderOptions = [["MALE", "Male"], ["FEMALE", "Female"], ["NON_BINARY", "Non-binary"], ["OTHER", "Other"], ["MALE", "Masculine"], ["FEMALE", "Feminine"]] as const;

export default function ProfileWizard({ mode }: Props) {
  const router = useRouter();
  const { refresh } = useSession();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>(initialData);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { step: number; data: Data; interstitialShown?: boolean };
      setStep(parsed.step ?? 0);
      setData(parsed.data ?? initialData);
      if (!parsed.interstitialShown) setShowModal(true);
    } catch {
      window.localStorage.removeItem(KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify({ step, data, interstitialShown: true }));
  }, [step, data]);

  useEffect(() => {
    if (step === 2) setShowModal(true);
  }, [step]);

  const progress = useMemo(() => ((step + 1) / 6) * 100, [step]);
  const isValid = useMemo(() => {
    if (step === 0) return data.name.trim().length > 1;
    if (step === 1) return Boolean(data.intent);
    if (step === 2) return data.interests.length >= 2;
    if (step === 3) return Boolean(data.gender);
    if (step === 4) return data.photos.length > 0;
    return data.age && data.city && data.profession && data.bio.length >= 10;
  }, [data, step]);

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || data.photos.length >= 6) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await apiFetch<{ photo?: { url: string } }>("/photos/upload", { method: "POST", body: { filename: file.name, dataUrl: String(reader.result) } as never });
        if (response.photo?.url) setData((p) => ({ ...p, photos: [...p.photos, response.photo!.url] }));
      } catch { addToast("Photo upload failed", "error"); }
    };
    reader.readAsDataURL(file);
  };

  const complete = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", { method: "PUT", body: { name: data.name.trim(), age: Number(data.age), gender: data.gender, city: data.city.trim(), profession: data.profession.trim(), bioShort: data.bio.trim(), intent: data.intent || "dating" } as never });
      await apiFetch("/profile/complete", { method: "POST" });
      const user = await refresh();
      window.localStorage.removeItem(KEY);
      router.replace(mode === "pwa" ? getPwaDefaultRoute(user) : getDefaultRoute(user));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to save profile";
      addToast(message, "error");
      setLoading(false);
    }
  };

  return <div className={`${styles.shell} ${mode === "pwa" ? styles.shellPwa : ""}`}>
    <div className={styles.top}><div className={styles.progress}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div><div className={styles.topRow}><button className={styles.iconBtn} onClick={() => setStep((s) => Math.max(0, s - 1))}>‹</button><button className={`${styles.iconBtn} ${styles.skip}`} onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 0 || step === 4 || step === 5}>Skip</button></div></div>
    <div className={styles.body}>
      {step === 0 && <><h1 className={styles.title}>What should we call you?</h1><p className={styles.help}>Use your first name to personalize your profile.</p><input className={styles.input} value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} /></>}
      {step === 1 && <><h1 className={styles.title}>What are you here for?</h1><p className={styles.help}>Choose one to tune your discovery feed.</p><div className={styles.stack}>{[["dating", "Dating"], ["friends", "Friends"], ["all", "Open to anything"]].map(([v, l]) => <button key={v} className={`${styles.option} ${data.intent === v ? styles.sel : ""}`} onClick={() => setData((p) => ({ ...p, intent: v as Data["intent"] }))}>{l}<span>{data.intent === v ? "✓" : ""}</span></button>)}</div></>}
      {step === 2 && <><h1 className={styles.title}>Pick at least 2 interests</h1><p className={styles.help}>Selected {data.interests.length}/2 minimum.</p><div className={styles.chips}>{interestOptions.map((i) => <button key={i} className={`${styles.chip} ${data.interests.includes(i) ? styles.sel : ""}`} onClick={() => setData((p) => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter((v) => v !== i) : [...p.interests, i] }))}>{i}</button>)}</div></>}
      {step === 3 && <><h1 className={styles.title}>Choose your profile style</h1><p className={styles.help}>Pick the card that fits best.</p><div className={styles.grid}>{genderOptions.map(([v, l], idx) => <button key={`${v}${idx}`} className={`${styles.option} ${data.gender === v ? styles.sel : ""}`} onClick={() => setData((p) => ({ ...p, gender: v }))}>{l}</button>)}</div></>}
      {step === 4 && <><h1 className={styles.title}>Add up to 6 photos</h1><p className={styles.help}>High quality photos improve matching. {data.photos.length}/6</p><div className={styles.grid}>{Array.from({ length: 6 }).map((_, idx) => <label key={idx} className={styles.photoCell}>{data.photos[idx] ? <img src={data.photos[idx]} alt="profile" /> : "+"}{idx === data.photos.length && data.photos.length < 6 ? <input type="file" hidden accept="image/*" onChange={onPhoto} /> : null}</label>)}</div></>}
      {step === 5 && <><h1 className={styles.title}>Finish your basics</h1><p className={styles.help}>These details complete your onboarding profile.</p><div className={styles.stack}><input className={styles.input} placeholder="Age" type="number" min={18} value={data.age} onChange={(e) => setData((p) => ({ ...p, age: e.target.value }))} /><input className={styles.input} placeholder="City" value={data.city} onChange={(e) => setData((p) => ({ ...p, city: e.target.value }))} /><input className={styles.input} placeholder="Profession" value={data.profession} onChange={(e) => setData((p) => ({ ...p, profession: e.target.value }))} /><textarea className={styles.input} placeholder="Short bio" value={data.bio} onChange={(e) => setData((p) => ({ ...p, bio: e.target.value }))} /></div><p className={styles.small}>Next 6/6</p></>}
    </div>
    <div className={styles.bottom}><button className={styles.cta} disabled={!isValid || loading} onClick={() => step === 5 ? void complete() : setStep((s) => Math.min(5, s + 1))}>{step === 5 ? "Complete" : `Next ${step + 1}/6`}</button></div>
    {showModal ? <div className={styles.modalBack}><div className={styles.modal}><h3>Welcome to Elite Match</h3><p className={styles.help}>You are almost done. Finish your profile to unlock premium discovery.</p><button className={styles.cta} onClick={() => setShowModal(false)}>Continue</button></div></div> : null}
  </div>;
}
