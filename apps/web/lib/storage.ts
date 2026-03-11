// Client-side storage utilities
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  PHONE_NUMBER: 'pending_phone',
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_DATA: 'onboarding_data',
} as const;

export interface OnboardingData {
  phone?: string;
  videoUrl?: string;
  paymentSessionId?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  location?: string;
  bio?: string;
  photoUrls?: string[];
}

export function getOnboardingData(): OnboardingData {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
  return data ? JSON.parse(data) : {};
}

export function setOnboardingData(data: OnboardingData) {
  if (typeof window === 'undefined') return;
  const current = getOnboardingData();
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify({ ...current, ...data }));
}

export function clearOnboardingData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DATA);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_STEP);
}

export function getOnboardingStep(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP) || '0', 10);
}

export function setOnboardingStep(step: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, String(step));
}
