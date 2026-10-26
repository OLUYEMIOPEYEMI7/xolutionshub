import { DELIVERY, RULES, SERVICES, type Rule } from "../data/catalog";

const nf = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
export const formatNaira = (n: number) => nf.format(n);

export interface Quote {
  items: { id: string; name: string; price: number }[];
  subtotal: number;
  delivery: { label: string; surcharge: number };
  total: number;
}

export function quote(selected: ReadonlySet<string>, deliveryId: string): Quote {
  const items = SERVICES.filter((s) => selected.has(s.id)).map(({ id, name, price }) => ({ id, name, price }));
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const d = DELIVERY.find((x) => x.id === deliveryId) ?? DELIVERY[0];
  // A delivery surcharge only applies when something is selected.
  const surcharge = items.length ? d.surcharge : 0;
  return { items, subtotal, delivery: { label: d.label, surcharge }, total: subtotal + surcharge };
}

export function violations(selected: ReadonlySet<string>, rules: Rule[] = RULES): string[] {
  const out: string[] = [];
  for (const r of rules) {
    if (!selected.has(r.service)) continue;
    if (r.kind === "requires" && !selected.has(r.with)) out.push(r.message);
    if (r.kind === "conflicts" && selected.has(r.with)) out.push(r.message);
  }
  return out;
}
