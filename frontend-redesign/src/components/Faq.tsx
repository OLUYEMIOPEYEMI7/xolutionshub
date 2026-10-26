import { CONTACT } from "../data/catalog";
import { Reveal } from "./Reveal";

const ITEMS = [
  ["How is the price worked out?", "Each service has a fixed price. Delivery is Normal (no extra charge), Priority (+₦15,000) or Urgent (+₦25,000). The order builder adds these up live. Final pricing depends on the selected services, delivery option and applicable service requirements."],
  ["How do I pay?", "By bank transfer. After you send your order you are given payment instructions, and you then send your payment receipt through WhatsApp."],
  ["Can I order only one part of my project?", "Yes. Choose only what you need, for example just a questionnaire or just formatting."],
  ["How do I follow my order?", "Use Track order with your order reference. Online tracking is being connected; until then, message us on WhatsApp for updates."],
];

export function Faq() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="wrap faq">
        <Reveal>
          <p className="eyebrow">Good to know</p>
          <h2 id="faq-title" className="h2">Questions, answered plainly.</h2>
          <p className="muted">Something else? WhatsApp <a href={`https://wa.me/${CONTACT.whatsappIntl}`}>{CONTACT.whatsappDisplay}</a>.</p>
        </Reveal>
        <Reveal className="faq__list" delay={80}>
          {ITEMS.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
