import { Reveal } from "./Reveal";

const STEPS = [
  ["Select your services", "Choose only what you need and pick a delivery option."],
  ["Enter your details", "Academic and project information, so we know your context."],
  ["Review the total", "Every service and delivery charge is itemised before you send."],
  ["Send your order", "You receive an order reference once your order is confirmed."],
  ["Pay by bank transfer", "Transfer the amount using the instructions you are given."],
  ["Send your receipt", "Share the payment receipt through WhatsApp."],
  ["Follow your project", "Track the order and follow progress online."],
];

export function HowItWorks() {
  return (
    <section id="how" className="section section--paper2" aria-labelledby="how-title">
      <div className="wrap how">
        <Reveal className="how__head">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="h2">Seven steps from selection to delivery.</h2>
          <p className="muted">Final pricing depends on the selected services, delivery option, and applicable service requirements.</p>
        </Reveal>
        <ol className="how__list">
          {STEPS.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 50} className="how__item">
              <span className="how__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
