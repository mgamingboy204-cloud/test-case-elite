export type OnboardingFieldConfig = {
  stepId: string;
  uiLabel: string;
  backendFieldName: string;
  dataType: "string" | "number" | "enum" | "image" | "boolean";
  required: boolean;
  validationRules: string[];
  updateEndpoint: string;
  supportedByBackend: boolean;
  submitMode: "per-step" | "batch";
  allowsSkip?: boolean;
};

export const ONBOARDING_PROFILE_FIELDS: OnboardingFieldConfig[] = [
  {
    stepId: "welcome",
    uiLabel: "House Rules Agreement",
    backendFieldName: "houseRulesAcceptedAt",
    dataType: "boolean",
    required: true,
    validationRules: ["Must explicitly agree to continue"],
    updateEndpoint: "client-only",
    supportedByBackend: false,
    submitMode: "batch"
  },
  {
    stepId: "photo",
    uiLabel: "Profile Photo",
    backendFieldName: "photo.url",
    dataType: "image",
    required: true,
    validationRules: ["Must upload at least one image via /photos/upload before activation"],
    updateEndpoint: "POST /photos/upload",
    supportedByBackend: true,
    submitMode: "per-step"
  },
  {
    stepId: "displayName",
    uiLabel: "Display Name",
    backendFieldName: "displayName (maps to profile.name)",
    dataType: "string",
    required: true,
    validationRules: ["Min length 1", "Required by ProfileSchema via displayName/name superRefine"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "gender",
    uiLabel: "Gender",
    backendFieldName: "gender",
    dataType: "enum",
    required: true,
    validationRules: ["One of MALE | FEMALE | NON_BINARY | OTHER"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "age",
    uiLabel: "Age",
    backendFieldName: "age",
    dataType: "number",
    required: true,
    validationRules: ["Integer", "Minimum 18"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "city",
    uiLabel: "City",
    backendFieldName: "city",
    dataType: "string",
    required: true,
    validationRules: ["Min length 1"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "profession",
    uiLabel: "Profession",
    backendFieldName: "profession",
    dataType: "string",
    required: true,
    validationRules: ["Min length 1"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "bioShort",
    uiLabel: "Short Bio",
    backendFieldName: "bioShort",
    dataType: "string",
    required: true,
    validationRules: ["Min length 1", "UI enforces >= 10 chars for quality"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch"
  },
  {
    stepId: "intent",
    uiLabel: "Intent",
    backendFieldName: "intent",
    dataType: "enum",
    required: false,
    validationRules: ["One of dating | friends | all", "Defaults to dating"],
    updateEndpoint: "PUT /profile",
    supportedByBackend: true,
    submitMode: "batch",
    allowsSkip: true
  }
];

export type ProfileDraft = {
  houseRulesAccepted: boolean;
  photoUrl: string;
  displayName: string;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "";
  age: string;
  city: string;
  profession: string;
  bioShort: string;
  intent: "dating" | "friends" | "all";
};

export const INITIAL_PROFILE_DRAFT: ProfileDraft = {
  houseRulesAccepted: false,
  photoUrl: "",
  displayName: "",
  gender: "",
  age: "",
  city: "",
  profession: "",
  bioShort: "",
  intent: "dating"
};
