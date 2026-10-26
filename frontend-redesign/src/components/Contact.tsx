import { BRAND, CONTACT } from "../data/catalog";
import { Reveal } from "./Reveal";

export function Contact() {
  return (
    <section id="contact" className="section section--ink" aria-labelledby="contact-title">
      <div className="wrap contact">
        <Reveal>
          <p className="eyebrow eyebrow--light">Contact</p>
          <h2 id="contact-title" className="h2 h2--light">Talk to {BRAND.name}.</h2>
          <p className="contact__motto">{BRAND.motto}</p>
        </Reveal>
        <Reveal className="contact__links" delay={80}>
          <a className="contact__row" href={`https://wa.me/${CONTACT.whatsappIntl}`} rel="noopener noreferrer" target="_blank">
            <span>WhatsApp</span>
            <strong>{CONTACT.whatsappDisplay}</strong>
          </a>
          <a className="contact__row" href={`mailto:${CONTACT.email}`}>
            <span>Email</span>
            <strong>{CONTACT.email}</strong>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
