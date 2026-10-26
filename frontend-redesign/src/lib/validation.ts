export interface Details {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  department: string;
  topic: string;
  deadline: string;
  notes: string;
  consent: boolean;
}

export const emptyDetails: Details = {
  fullName: "",
  email: "",
  phone: "",
  institution: "",
  department: "",
  topic: "",
  deadline: "",
  notes: "",
  consent: false,
};

export type Errors = Partial<Record<keyof Details, string>>;

export function validate(d: Details): Errors {
  const e: Errors = {};
  if (d.fullName.trim().length < 2) e.fullName = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = "Enter a valid email address, for example name@example.com.";
  const digits = d.phone.replace(/[\s()-]/g, "");
  if (!/^\+?\d{10,15}$/.test(digits)) e.phone = "Enter a phone number with 10 to 15 digits, for example 08012345678.";
  if (d.institution.trim().length < 2) e.institution = "Enter your institution.";
  if (d.department.trim().length < 2) e.department = "Enter your department.";
  if (d.deadline && Number.isNaN(Date.parse(d.deadline))) e.deadline = "Enter a valid date.";
  if (d.notes.length > 1000) e.notes = "Keep notes under 1,000 characters.";
  if (!d.consent) e.consent = "Please confirm so we can use your details for this order.";
  return e;
}
