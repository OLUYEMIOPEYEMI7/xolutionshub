import { useCallback, useEffect, useMemo, useState } from "react";
import { SERVICES } from "../data/catalog";
import { quote, violations } from "./pricing";
import { emptyDetails, type Details } from "./validation";

const KEY = "xh.selection.v1";

// Only service ids + delivery choice are remembered, never personal details.
function load(): { ids: string[]; delivery: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const ids = Array.isArray(p.ids) ? p.ids.filter((i: unknown) => SERVICES.some((s) => s.id === i)) : [];
      return { ids, delivery: ["normal", "priority", "urgent"].includes(p.delivery) ? p.delivery : "normal" };
    }
  } catch {
    /* storage unavailable: start empty */
  }
  return { ids: [], delivery: "normal" };
}

export function useOrder() {
  const initial = useMemo(load, []);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.ids));
  const [delivery, setDelivery] = useState(initial.delivery);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ids: [...selected], delivery }));
    } catch {
      /* ignore */
    }
  }, [selected, delivery]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);
  const q = useMemo(() => quote(selected, delivery), [selected, delivery]);
  const problems = useMemo(() => violations(selected), [selected]);

  return { selected, toggle, clear, delivery, setDelivery, details, setDetails, step, setStep, quote: q, problems };
}
export type OrderState = ReturnType<typeof useOrder>;
