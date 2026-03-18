export type LegalDocumentSection = {
  title: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  accent: string;
  intro: string;
  sections: LegalDocumentSection[];
};

export const privacyDocument: LegalDocument = {
  title: "Privacy",
  accent: "Policy",
  intro:
    "VAEL platform values the privacy and security of our exclusive members above all else. This document outlines how we protect and manage your data.",
  sections: [
    {
      title: "1. Data Collection",
      body:
        "We only collect information necessary to provide you with meaningful, curated introductions. This includes preference data, demographic information, and encrypted platform interactions."
    },
    {
      title: "2. Zero Unauthorized Sharing",
      body:
        "Your data is never sold, traded, or shared with third parties. Your profile is only visible to the specific matches curated for you by our concierge algorithm."
    },
    {
      title: "3. Security",
      body:
        "We employ enterprise-grade encryption and strict access controls to ensure your personal information remains confidential at all times."
    }
  ]
};

export const termsDocument: LegalDocument = {
  title: "Terms of",
  accent: "Service",
  intro:
    "Welcome to VAEL. By accessing our platform, configuring an account, or requesting an invitation, you implicitly accept these highly exclusive terms of service.",
  sections: [
    {
      title: "1. Membership Eligibility",
      body:
        "Membership is granted strictly on an invitation and review basis. VAEL reserves the unilateral right to deny or revoke access to maintain the integrity of our network."
    },
    {
      title: "2. Code of Conduct",
      body:
        "Members are expected to interact with the utmost respect, discretion, and intention. Any violation of privacy protocols or inappropriate behavior will result in an immediate, permanent ban."
    },
    {
      title: "3. Intellectual Property",
      body:
        "The VAEL platform, its design system, algorithm, and 3D architectural implementations are protected proprietary assets."
    }
  ]
};
