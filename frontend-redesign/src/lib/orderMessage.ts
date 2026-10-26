import { CONTACT } from "../data/catalog";
import { formatNaira, type Quote } from "./pricing";
import type { Details } from "./validation";

export function buildOrderText(q: Quote, d: Details): string {
  const lines = [
    "Hello Xolutions Hub, I would like to place an order.",
    "",
    "SERVICES",
    ...q.items.map((i) => `- ${i.name}: ${formatNaira(i.price)}`),
    `Delivery: ${q.delivery.label}${q.delivery.surcharge ? ` (+${formatNaira(q.delivery.surcharge)})` : ""}`,
    `TOTAL: ${formatNaira(q.total)}`,
    "",
    "MY DETAILS",
    `Name: ${d.fullName.trim()}`,
    `Email: ${d.email.trim()}`,
    `Phone: ${d.phone.trim()}`,
    `Institution: ${d.institution.trim()}`,
    `Department: ${d.department.trim()}`,
  ];
  if (d.topic.trim()) lines.push(`Project topic: ${d.topic.trim()}`);
  if (d.deadline) lines.push(`Needed by: ${d.deadline}`);
  if (d.notes.trim()) lines.push(`Notes: ${d.notes.trim()}`);
  return lines.join("\n");
}

export const whatsappLink = (text: string) => `https://wa.me/${CONTACT.whatsappIntl}?text=${encodeURIComponent(text)}`;
export const mailtoLink = (text: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent("Xolutions Hub order request")}&body=${encodeURIComponent(text)}`;
