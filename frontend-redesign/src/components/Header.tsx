import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#/order", label: "Services" },
  { href: "#/how", label: "How it works" },
  { href: "#/track", label: "Track order" },
  { href: "#/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`header ${scrolled ? "header--solid" : ""}`}>
      <div className="wrap header__bar">
        <Logo />
        <nav className="nav" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <a className="btn btn--accent btn--sm header__cta" href="#/order">Start your order</a>
        <button
          ref={btn}
          className="menu-btn"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className={`menu-btn__bars ${open ? "is-open" : ""}`} aria-hidden="true"><i /><i /></span>
        </button>
      </div>
      <nav id="mobile-nav" className={`mnav ${open ? "is-open" : ""}`} aria-label="Mobile" hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a className="btn btn--accent" href="#/order" onClick={() => setOpen(false)}>Start your order</a>
      </nav>
    </header>
  );
}
