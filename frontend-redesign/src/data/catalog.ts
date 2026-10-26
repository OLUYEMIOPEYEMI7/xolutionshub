// Single source of truth for services, delivery options and contact details.
// Prices and names are the verified figures supplied by the business.
// Fields marked "TO CONFIRM" were not supplied and are intentionally left empty
// rather than invented.

export interface Service {
  id: string;
  name: string;
  price: number; // NGN
  group: string;
  /** Only present where the business supplied it. */
  description?: string;
  /** Only present where the business supplied it. */
  days?: string;
}

export interface DeliveryOption {
  id: "normal" | "priority" | "urgent";
  label: string;
  surcharge: number;
  note: string;
}

export const CONTACT = {
  whatsappDisplay: "08069126742",
  whatsappIntl: "2348069126742", // 0806... -> +234 806...
  email: "xolutionshub@gmail.com",
} as const;

export const BRAND = {
  name: "Xolutions Hub",
  tagline: "Students • Reports • Solutions",
  motto: "Your Success, Our Priority!",
} as const;

// Group names for items 1-5 come from the live site; groups for items 6-12 are
// an assumption (TO CONFIRM).
export const SERVICES: Service[] = [
  {
    id: "topic",
    name: "Topic Development + Proposal Guidance",
    price: 25000,
    group: "Project Foundation",
    description: "Research direction, topic refinement and proposal guidance.",
    days: "3–5 days",
  },
  {
    id: "ch1-3",
    name: "Chapters 1–3 Research Support",
    price: 50000,
    group: "Chapter Support",
    description: "Structured support for introduction, literature review and methodology.",
    days: "5–8 days",
  },
  {
    id: "ch4-5",
    name: "Chapters 4–5 Research Support",
    price: 40000,
    group: "Chapter Support",
    description: "Support for results/discussion and summary, conclusion and recommendations.",
    days: "4–7 days",
  },
  {
    id: "questionnaire",
    name: "Questionnaire Development",
    price: 10000,
    group: "Research Instruments",
    description: "Research questionnaire development aligned with study objectives.",
    days: "1–3 days",
  },
  { id: "analysis", name: "Data Analysis & Interpretation", price: 40000, group: "Data & Analysis" },
  { id: "cleaning", name: "Data Cleaning", price: 15000, group: "Data & Analysis" },
  { id: "referencing", name: "Referencing & Citation Formatting", price: 10000, group: "Formatting & Editing" },
  { id: "formatting", name: "Complete Project Formatting", price: 15000, group: "Formatting & Editing" },
  { id: "proofreading", name: "Proofreading & Academic Editing", price: 15000, group: "Formatting & Editing" },
  { id: "powerpoint", name: "Project PowerPoint Presentation", price: 15000, group: "Presentation & Defense" },
  { id: "defense", name: "Defense Preparation", price: 20000, group: "Presentation & Defense" },
  { id: "full", name: "Full Project Research Support", price: 150000, group: "Complete Support" },
];

export const GROUP_ORDER = [
  "Project Foundation",
  "Chapter Support",
  "Research Instruments",
  "Data & Analysis",
  "Formatting & Editing",
  "Presentation & Defense",
  "Complete Support",
];

export const DELIVERY: DeliveryOption[] = [
  { id: "normal", label: "Normal", surcharge: 0, note: "No additional charge" },
  { id: "priority", label: "Priority", surcharge: 15000, note: "+₦15,000" },
  { id: "urgent", label: "Urgent", surcharge: 25000, note: "+₦25,000" },
];

/**
 * Dependency / conflict rules. The live site says it "checks dependencies,
 * conflicts and pricing", but the rules were not supplied. TO CONFIRM with the
 * business; add them here and the order builder will enforce them.
 */
export interface Rule {
  kind: "requires" | "conflicts";
  service: string;
  with: string;
  message: string;
}
export const RULES: Rule[] = [];

export const STEPS = ["Services", "Project details", "Review", "Send"] as const;
