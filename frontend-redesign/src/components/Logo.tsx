import { BRAND } from "../data/catalog";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a className={`logo ${light ? "logo--light" : ""}`} href="#/" aria-label={`${BRAND.name} home`}>
      <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`lg${light ? "l" : "d"}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2447d6" />
            <stop offset="1" stopColor="#f2661c" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#lg${light ? "l" : "d"})`} />
        <path d="M19 17h8l5 8 5-8h8L36 32l9 15h-8l-5-8-5 8h-8l9-15z" fill="#fff" />
      </svg>
      <span className="logo__text">
        <strong>XOLUTIONS HUB</strong>
        <small>{BRAND.tagline}</small>
      </span>
    </a>
  );
}
