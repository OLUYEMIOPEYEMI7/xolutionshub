import { useEffect, useState } from "react";

export type Page = "home" | "track" | "privacy";

function parse(): { page: Page; anchor: string } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (raw === "track" || raw === "privacy") return { page: raw, anchor: "" };
  return { page: "home", anchor: raw };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    const titles: Record<Page, string> = {
      home: "Xolutions Hub | Academic Project Support for Nigerian Students",
      track: "Track your order | Xolutions Hub",
      privacy: "Privacy notice | Xolutions Hub",
    };
    document.title = titles[route.page];
    const el = route.anchor ? document.getElementById(route.anchor) : null;
    requestAnimationFrame(() => {
      if (el) {
        el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        if (el.tabIndex < 0) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0 });
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    });
  }, [route]);

  return route;
}
