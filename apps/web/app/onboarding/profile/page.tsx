"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "../../../lib/api";
import { getAssetUrl } from "../../../lib/assets";
import { queryKeys } from "../../../lib/queryKeys";
import { useSession } from "../../../lib/session";
import { buildDobString, getAgeFromDob, INTEREST_OPTIONS, parseDobString } from "../../../lib/profileUtils";

type ProfileForm = {
  displayName: string;
  gender: string;
  genderPreference: string;
  age: string;
  city: string;
  profession: string;
  bioShort: string;
};

type PreferencesState = {
  intent: string;
  distance: string;
};

type DraftData = {
  form?: Partial<ProfileForm>;
  preferences?: {
    intent?: string;
    distance?: string;
    dob?: string;
    interests?: string[];
  };
};

type ProfilePhoto = {
  id: string;
  url: string;
};

type StepKey =
  | "displayName"
  | "dob"
  | "gender"
  | "genderPreference"
  | "city"
  | "profession"
  | "bioShort"
  | "intent"
  | "distance"
  | "interests"
  | "photo"
  | "done";

type StepConfig = {
  key: StepKey;
  title: string;
  subtitle: string;
  componentType: "text" | "dob" | "choice" | "textarea" | "segmented" | "photo" | "done";
  placeholder?: string;
};

type ProfileResponse = { profile?: any; photos?: ProfilePhoto[]; user?: any };

type SaveResponse = { requiresPhoto?: boolean };

const steps: StepConfig[] = [
  {
    key: "displayName",
    title: "What should we call you?",
    subtitle: "This is the name Elite Match introduces to new connections.",
    componentType: "text",
    placeholder: "Your display name"
  },
  {
    key: "dob",
    title: "When’s your birthday?",
    subtitle: "We only share your age.",
    componentType: "dob"
  },
  {
    key: "gender",
    title: "How do you identify?",
    subtitle: "Choose the gender that best represents you.",
    componentType: "choice"
  },
  {
    key: "genderPreference",
    title: "Who do you want to meet?",
    subtitle: "Elite Match is built for genuine dating connections.",
    componentType: "choice"
  },
  {
    key: "city",
    title: "Where are you based?",
    subtitle: "Matches will see your city.",
    componentType: "text",
    placeholder: "City"
  },
  {
    key: "profession",
    title: "What do you do?",
    subtitle: "Add a quick line about your profession.",
    componentType: "text",
    placeholder: "Profession"
  },
  {
    key: "bioShort",
    title: "Share a short intro",
    subtitle: "Keep it warm, confident, and dating-forward.",
    componentType: "textarea",
    placeholder: "A quick line about your vibe"
  },
  {
    key: "intent",
    title: "What are you hoping to find?",
    subtitle: "We focus on real dating connections.",
    componentType: "segmented"
  },
  {
    key: "distance",
    title: "How far can we search?",
    subtitle: "Set your discovery radius.",
    componentType: "segmented"
  },
  {
    key: "interests",
    title: "Pick a few interests",
    subtitle: "Choose up to five to spark great first chats.",
    componentType: "choice"
  },
  {
    key: "photo",
    title: "Add your profile photo",
    subtitle: "One strong photo is all you need.",
    componentType: "photo"
  },
  {
    key: "done",
    title: "Profile complete",
    subtitle: "You’re ready to start meeting curated matches.",
    componentType: "done"
  }
];

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 10 * 1024 * 1024;
const preferenceDefaults = { intent: "serious", distance: "local" };
const draftKey = "elite-onboarding-draft";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { refresh } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    gender: "",
    genderPreference: "ALL",
    age: "",
    city: "",
    profession: "",
    bioShort: ""
  });
  const [preferences, setPreferences] = useState<PreferencesState>({
    intent: preferenceDefaults.intent,
    distance: preferenceDefaults.distance
  });
  const [existingPreferences, setExistingPreferences] = useState<Record<string, unknown>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [dob, setDob] = useState({ year: "", month: "", day: "" });
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dobString = useMemo(() => buildDobString(dob), [dob]);
  const agePreview = useMemo(() => (dobString ? getAgeFromDob(dobString) : null), [dobString]);
  const currentStep = steps[stepIndex];
  const progressValue = Math.round(((stepIndex + 1) / steps.length) * 100);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile("me"),
    queryFn: () => apiFetch<ProfileResponse>("/profile"),
    staleTime: 15000
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[wizard] upload photo", { name: file.name, size: file.size, type: file.type });
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(file);
      });
      return apiFetch<{ photo?: ProfilePhoto }>("/photos/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          dataUrl
        })
      });
    },
    onSuccess: (response) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[wizard] upload response", response);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile("me") });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQueues });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors ?? {});
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Unable to upload photo.");
      }
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const saveProfileMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch<SaveResponse>("/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile("me") });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: () => apiFetch("/profile/complete", { method: "POST" }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile("me") });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await refresh();
      router.push("/discover");
    }
  });

  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      persistDraft();
    }, 400);
    return () => clearTimeout(timeout);
  }, [form, preferences, interests, dobString, isLoaded]);

  useEffect(() => {
    if (!agePreview) return;
    setForm((prev) => ({ ...prev, age: agePreview.toString() }));
  }, [agePreview]);

  useEffect(() => {
    if (profileQuery.isError) {
      setErrorMessage(profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to load profile.");
      setIsLoaded(true);
      return;
    }
    if (!profileQuery.data) return;
    const data = profileQuery.data;
    if (process.env.NODE_ENV !== "production") {
      console.debug("[wizard] load profile", data);
    }
    const draft = readDraft();
    const draftForm = draft?.form ?? {};
    const draftPreferences = draft?.preferences ?? {};
    const profile = data.profile ?? {};
    const user = data.user ?? {};
    const incomingPreferences = profile.preferences ?? {};
    const mergedPreferences = { ...incomingPreferences, ...draftPreferences };

    setExistingPreferences(incomingPreferences);
    setPreferences({
      intent:
        typeof mergedPreferences.intent === "string"
          ? mergedPreferences.intent
          : preferenceDefaults.intent,
      distance:
        typeof mergedPreferences.distance === "string"
          ? mergedPreferences.distance
          : preferenceDefaults.distance
    });

    const incomingDob = typeof mergedPreferences.dob === "string" ? mergedPreferences.dob : "";
    setDob(parseDobString(incomingDob));
    setInterests(Array.isArray(mergedPreferences.interests) ? mergedPreferences.interests : []);

    setForm({
      displayName: draftForm.displayName ?? user.displayName ?? profile.name ?? "",
      gender: draftForm.gender ?? profile.gender ?? "",
      genderPreference: draftForm.genderPreference ?? profile.genderPreference ?? "ALL",
      age: draftForm.age ?? profile.age?.toString() ?? "",
      city: draftForm.city ?? profile.city ?? "",
      profession: draftForm.profession ?? profile.profession ?? "",
      bioShort: draftForm.bioShort ?? profile.bioShort ?? ""
    });

    setPhotos(data.photos ?? []);

    const nextStep = getFirstIncompleteStep({
      form: {
        displayName: draftForm.displayName ?? user.displayName ?? profile.name ?? "",
        gender: draftForm.gender ?? profile.gender ?? "",
        genderPreference: draftForm.genderPreference ?? profile.genderPreference ?? "ALL",
        age: draftForm.age ?? profile.age?.toString() ?? "",
        city: draftForm.city ?? profile.city ?? "",
        profession: draftForm.profession ?? profile.profession ?? "",
        bioShort: draftForm.bioShort ?? profile.bioShort ?? ""
      },
      preferences: mergedPreferences,
      interests: Array.isArray(mergedPreferences.interests) ? mergedPreferences.interests : [],
      dob: incomingDob,
      photos: data.photos ?? []
    });
    setStepIndex(nextStep);
    setErrorMessage("");
    setFieldErrors({});
    setIsLoaded(true);
  }, [profileQuery.data, profileQuery.isError, profileQuery.error]);

  function readDraft(): DraftData | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  }

  function writeDraft(nextDraft: DraftData) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(draftKey, JSON.stringify(nextDraft));
  }

  function persistDraft() {
    writeDraft({
      form,
      preferences: {
        ...preferences,
        dob: dobString || undefined,
        interests
      }
    });
  }

  function clearDraft() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(draftKey);
  }

  function getFirstIncompleteStep({
    form: currentForm,
    preferences: preferenceData,
    interests: interestList,
    dob: dobValue,
    photos: photoList
  }: {
    form: ProfileForm;
    preferences: Record<string, any>;
    interests: string[];
    dob: string;
    photos: ProfilePhoto[];
  }) {
    const stepCompletion: Record<StepKey, boolean> = {
      displayName: Boolean(currentForm.displayName.trim()),
      dob: Boolean(dobValue) && Boolean(currentForm.age),
      gender: Boolean(currentForm.gender),
      genderPreference: Boolean(currentForm.genderPreference),
      city: Boolean(currentForm.city.trim()),
      profession: Boolean(currentForm.profession.trim()),
      bioShort: Boolean(currentForm.bioShort.trim()),
      intent: Boolean(preferenceData.intent),
      distance: Boolean(preferenceData.distance),
      interests: Boolean(interestList.length),
      photo: Boolean(photoList.length),
      done: false
    };

    for (const step of steps) {
      if (!stepCompletion[step.key]) {
        return steps.findIndex((item) => item.key === step.key);
      }
    }
    return steps.length - 1;
  }

  function updateField(key: keyof ProfileForm, value: string) {
    setErrorMessage("");
    setFieldErrors((prev) => ({ ...prev, [key]: [] }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePreference(key: keyof PreferencesState, value: string) {
    setErrorMessage("");
    setFieldErrors((prev) => ({ ...prev, [key]: [] }));
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function updateDobField(key: "year" | "month" | "day", value: string) {
    setErrorMessage("");
    setFieldErrors((prev) => ({ ...prev, dob: [] }));
    setDob((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(value: string) {
    setErrorMessage("");
    setFieldErrors((prev) => ({ ...prev, interests: [] }));
    setInterests((prev) => {
      if (prev.includes(value)) {
        return prev.filter((interest) => interest !== value);
      }
      if (prev.length >= 5) {
        setErrorMessage("Choose up to five interests.");
        return prev;
      }
      return [...prev, value];
    });
  }

  function validatePhoto(file: File) {
    setFieldErrors((prev) => ({ ...prev, photo: [] }));
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Only JPEG, PNG, or WebP images are supported.");
      setFieldErrors({ photo: ["Only JPEG, PNG, or WebP images are supported."] });
      return false;
    }
    if (file.size > maxBytes) {
      setErrorMessage("Image must be 10MB or smaller.");
      setFieldErrors({ photo: ["Image must be 10MB or smaller."] });
      return false;
    }
    return true;
  }

  function handlePhotoUpload(file: File) {
    if (!validatePhoto(file)) return;
    setErrorMessage("");
    setFieldErrors({});
    setUploadProgress(0);
    setIsUploading(true);
    uploadMutation.mutate(file);
  }

  function buildPreferences() {
    return {
      ...existingPreferences,
      intent: preferences.intent || preferenceDefaults.intent,
      distance: preferences.distance || preferenceDefaults.distance,
      interests,
      dob: dobString || (existingPreferences as any).dob
    };
  }

  function canSaveProfile() {
    const displayName = form.displayName.trim();
    const ageNumber = Number(form.age);
    return Boolean(
      displayName &&
        form.gender &&
        Number.isFinite(ageNumber) &&
        ageNumber >= 18 &&
        form.city.trim() &&
        form.profession.trim() &&
        form.bioShort.trim()
    );
  }

  async function saveProfileData(options: { auto?: boolean; requirePhoto?: boolean } = {}) {
    persistDraft();
    if (!canSaveProfile()) {
      setSaveState("saved");
      return true;
    }
    const displayName = form.displayName.trim();
    const ageNumber = Number(form.age);
    const city = form.city.trim();
    const profession = form.profession.trim();
    const bioShort = form.bioShort.trim();
    setIsSaving(true);
    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[wizard] save profile", {
          displayName,
          gender: form.gender,
          genderPreference: form.genderPreference,
          age: ageNumber,
          city,
          profession,
          bioShort,
          preferences: buildPreferences()
        });
      }
      const response = await saveProfileMutation.mutateAsync({
        displayName,
        gender: form.gender,
        genderPreference: form.genderPreference,
        age: ageNumber,
        city,
        profession,
        bioShort,
        preferences: buildPreferences()
      });
      if (process.env.NODE_ENV !== "production") {
        console.debug("[wizard] save response", response);
      }
      if (options.requirePhoto && response.requiresPhoto) {
        setErrorMessage("Add your profile photo to continue.");
        setFieldErrors({ photo: ["Add your profile photo to continue."] });
        setIsSaving(false);
        return false;
      }
      setSaveState("saved");
      setErrorMessage("");
      setFieldErrors({});
      clearDraft();
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors ?? {});
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Unable to save profile.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function finalizeProfileAndNavigate() {
    setErrorMessage("");
    setIsSaving(true);
    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[wizard] finalize profile");
      }
      await finalizeMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete profile.";
      setErrorMessage(message);
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to finalize profile completion.", error);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveState("saving");
    saveTimeoutRef.current = setTimeout(() => {
      void saveProfileData({ auto: true });
    }, 600);
  }, [saveProfileData]);

  function validateStep(step: StepKey) {
    setErrorMessage("");
    setFieldErrors({});
    if (step === "displayName" && !form.displayName.trim()) {
      setErrorMessage("Please enter the name you want displayed.");
      setFieldErrors({ displayName: ["Please enter the name you want displayed."] });
      return false;
    }
    if (step === "dob") {
      if (!dobString || !agePreview) {
        setErrorMessage("Please choose your date of birth.");
        setFieldErrors({ dob: ["Please choose your date of birth."] });
        return false;
      }
      if (agePreview < 18) {
        setErrorMessage("You must be 18 or older to join.");
        setFieldErrors({ dob: ["You must be 18 or older to join."] });
        return false;
      }
    }
    if (step === "gender" && !form.gender) {
      setErrorMessage("Please select your gender.");
      setFieldErrors({ gender: ["Please select your gender."] });
      return false;
    }
    if (step === "genderPreference" && !form.genderPreference) {
      setErrorMessage("Please choose who you want to meet.");
      setFieldErrors({ genderPreference: ["Please choose who you want to meet."] });
      return false;
    }
    if (step === "city" && !form.city.trim()) {
      setErrorMessage("Please enter your city.");
      setFieldErrors({ city: ["Please enter your city."] });
      return false;
    }
    if (step === "profession" && !form.profession.trim()) {
      setErrorMessage("Please enter your profession.");
      setFieldErrors({ profession: ["Please enter your profession."] });
      return false;
    }
    if (step === "bioShort" && !form.bioShort.trim()) {
      setErrorMessage("Please add a short intro.");
      setFieldErrors({ bioShort: ["Please add a short intro."] });
      return false;
    }
    if (step === "intent" && !preferences.intent) {
      setErrorMessage("Please select your dating intent.");
      setFieldErrors({ intent: ["Please select your dating intent."] });
      return false;
    }
    if (step === "distance" && !preferences.distance) {
      setErrorMessage("Please select a distance preference.");
      setFieldErrors({ distance: ["Please select a distance preference."] });
      return false;
    }
    if (step === "interests" && !interests.length) {
      setErrorMessage("Pick at least one interest.");
      setFieldErrors({ interests: ["Pick at least one interest."] });
      return false;
    }
    if (step === "photo" && !photos.length) {
      setErrorMessage("Add your profile photo to continue.");
      setFieldErrors({ photo: ["Add your profile photo to continue."] });
      return false;
    }
    return true;
  }

  async function handleNext() {
    setErrorMessage("");
    if (currentStep.key === "done") {
      await finalizeProfileAndNavigate();
      return;
    }
    if (!validateStep(currentStep.key)) return;

    if (currentStep.key === "photo") {
      const saved = await saveProfileData({ requirePhoto: true });
      if (saved) {
        await refresh();
        setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      }
      return;
    }

    if (canSaveProfile()) {
      const saved = await saveProfileData();
      if (!saved) return;
    } else {
      setSaveState("saved");
    }
    scheduleAutoSave();
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }

  const stepFieldError = (key: string) => fieldErrors[key]?.[0];

  function handleBack() {
    setErrorMessage("");
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function renderStep() {
    if (currentStep.key === "displayName") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <label className="wizard-label" htmlFor="profile-display-name">
            Display name
          </label>
          <input
            id="profile-display-name"
            placeholder={currentStep.placeholder}
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
          />
          {stepFieldError("displayName") ? <p className="field-error">{stepFieldError("displayName")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "dob") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="dob-picker">
            <div className="field">
              <label htmlFor="dob-month">Month</label>
              <select id="dob-month" value={dob.month} onChange={(e) => updateDobField("month", e.target.value)}>
                <option value="">MM</option>
                {Array.from({ length: 12 }).map((_, index) => (
                  <option key={index + 1} value={`${index + 1}`}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dob-day">Day</label>
              <select id="dob-day" value={dob.day} onChange={(e) => updateDobField("day", e.target.value)}>
                <option value="">DD</option>
                {Array.from({ length: 31 }).map((_, index) => (
                  <option key={index + 1} value={`${index + 1}`}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dob-year">Year</label>
              <select id="dob-year" value={dob.year} onChange={(e) => updateDobField("year", e.target.value)}>
                <option value="">YYYY</option>
                {Array.from({ length: 60 }).map((_, index) => {
                  const year = new Date().getFullYear() - 18 - index;
                  return (
                    <option key={year} value={`${year}`}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <p className="card-subtitle">
            {agePreview ? `You’ll appear as ${agePreview} years old.` : "Select your DOB to preview your age."}
          </p>
          {stepFieldError("dob") ? <p className="field-error">{stepFieldError("dob")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "gender") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="wizard-choice-grid">
            {[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "NON_BINARY", label: "Non-binary" },
              { value: "OTHER", label: "Other" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={form.gender === option.value ? "chip active" : "chip"}
                onClick={() => updateField("gender", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {stepFieldError("gender") ? <p className="field-error">{stepFieldError("gender")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "genderPreference") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="wizard-choice-grid">
            {[
              { value: "ALL", label: "Everyone" },
              { value: "MALE", label: "Men" },
              { value: "FEMALE", label: "Women" },
              { value: "NON_BINARY", label: "Non-binary" },
              { value: "OTHER", label: "Other" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={form.genderPreference === option.value ? "chip active" : "chip"}
                onClick={() => updateField("genderPreference", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {stepFieldError("genderPreference") ? (
            <p className="field-error">{stepFieldError("genderPreference")}</p>
          ) : null}
        </div>
      );
    }
    if (currentStep.key === "city") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <label className="wizard-label" htmlFor="profile-city">
            City
          </label>
          <input
            id="profile-city"
            placeholder={currentStep.placeholder}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
          {stepFieldError("city") ? <p className="field-error">{stepFieldError("city")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "profession") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <label className="wizard-label" htmlFor="profile-profession">
            Profession
          </label>
          <input
            id="profile-profession"
            placeholder={currentStep.placeholder}
            value={form.profession}
            onChange={(e) => updateField("profession", e.target.value)}
          />
          {stepFieldError("profession") ? <p className="field-error">{stepFieldError("profession")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "bioShort") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <label className="wizard-label" htmlFor="profile-bio">
            Short bio
          </label>
          <textarea
            id="profile-bio"
            placeholder={currentStep.placeholder}
            value={form.bioShort}
            onChange={(e) => updateField("bioShort", e.target.value)}
          />
          {stepFieldError("bioShort") ? <p className="field-error">{stepFieldError("bioShort")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "intent") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="segmented-control">
            {[
              { value: "serious", label: "Serious relationship" },
              { value: "casual", label: "See where it goes" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={preferences.intent === option.value ? "active" : ""}
                onClick={() => updatePreference("intent", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {stepFieldError("intent") ? <p className="field-error">{stepFieldError("intent")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "distance") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="segmented-control">
            {[
              { value: "local", label: "Local" },
              { value: "anywhere", label: "Open to distance" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={preferences.distance === option.value ? "active" : ""}
                onClick={() => updatePreference("distance", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {stepFieldError("distance") ? <p className="field-error">{stepFieldError("distance")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "interests") {
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <div className="chip-grid">
            {INTEREST_OPTIONS.map((interest) => {
              const isActive = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  className={isActive ? "chip active" : "chip"}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <p className="card-subtitle">{interests.length}/5 selected</p>
          {stepFieldError("interests") ? <p className="field-error">{stepFieldError("interests")}</p> : null}
        </div>
      );
    }
    if (currentStep.key === "photo") {
      const photoUrl = photos.length ? getAssetUrl(photos[0].url) : null;
      return (
        <div className="wizard-step-body" key={currentStep.key}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handlePhotoUpload(file);
              }
              e.currentTarget.value = "";
            }}
          />
          <div className="inline-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {photos.length ? "Replace photo" : "Upload photo"}
            </button>
            {isUploading ? <span className="card-subtitle">Uploading… {uploadProgress}%</span> : null}
          </div>
          {photoUrl ? <img className="photo-preview" src={photoUrl} alt="Profile" /> : null}
          {stepFieldError("photo") ? <p className="field-error">{stepFieldError("photo")}</p> : null}
        </div>
      );
    }
    return (
      <div className="wizard-step-body" key={currentStep.key}>
        <div className="wizard-complete">
          <span className="complete-icon">✓</span>
          <p>You’re ready to start meeting curated matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-shell">
      <div className="wizard-sidebar">
        <span className="wizard-badge">Step {stepIndex + 1} of {steps.length}</span>
        <h2>{currentStep.title}</h2>
        <p className="text-muted">{currentStep.subtitle}</p>
        <div className="wizard-progress">
          <div className="wizard-progress__bar" style={{ width: `${progressValue}%` }} />
        </div>
        {saveState === "saving" ? <p className="text-muted">Saving draft…</p> : null}
        {saveState === "saved" ? <p className="text-muted">Draft saved.</p> : null}
      </div>
      <div className="wizard-main">
        {!isLoaded ? (
          <div className="card">
            <p className="text-muted">Loading profile…</p>
          </div>
        ) : (
          <div className="card wizard-card">
            <div className="wizard-header">
              <span className="wizard-step">Step {stepIndex + 1} of {steps.length}</span>
              <h3>{currentStep.title}</h3>
              <p className="card-subtitle">{currentStep.subtitle}</p>
            </div>
            {errorMessage ? <p className="message error">{errorMessage}</p> : null}
            {renderStep()}
            <div className="wizard-actions">
              <button type="button" className="secondary" onClick={handleBack} disabled={stepIndex === 0 || isSaving}>
                Back
              </button>
              <button type="button" className="primary" onClick={handleNext} disabled={isSaving}>
                {currentStep.key === "done" ? "Finish" : "Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
