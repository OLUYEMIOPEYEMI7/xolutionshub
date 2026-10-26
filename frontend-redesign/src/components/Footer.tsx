import { BRAND, CONTACT } from "../data/catalog";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <Logo light />
          <p className="footer__motto">{BRAND.motto}</p>
        </div>
        <nav aria-label="Footer">
          <a href="#/order">Services &amp; pricing</a>
          <a href="#/how">How it works</a>
          <a href="#/track">Track order</a>
          <a href="#/privacy">Privacy notice</a>
        </nav>
        <p className="footer__contact">
          <a href={`https://wa.me/${CONTACT.whatsappIntl}`}>WhatsApp {CONTACT.whatsappDisplay}</a>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
      </div>
      <div className="wrap footer__legal">&copy; {new Date().getFullYear()} {BRAND.name}.</div>
    </footer>
  );
}
