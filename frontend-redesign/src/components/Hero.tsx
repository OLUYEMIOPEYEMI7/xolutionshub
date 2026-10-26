import { SERVICES } from "../data/catalog";
import { formatNaira } from "../lib/pricing";

// The hero rail shows the real services in the order a project usually moves
// through them. It reads straight from the catalog so prices can never drift.
const RAIL = ["topic", "ch1-3", "questionnaire", "analysis", "ch4-5", "formatting", "defense"];

export function Hero() {
  const rail = RAIL.map((id) => SERVICES.find((s) => s.id === id)!);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light">Professional project support</p>
          <h1 id="hero-title" className="hero__title">
            <span className="line"><span>Build a support</span></span>
            <span className="line"><span>package around</span></span>
            <span className="line"><span>the stage <em>you&rsquo;re</em></span></span>
            <span className="line"><span><em>actually at.</em></span></span>
          </h1>
          <p className="hero__lede">
            Choose exactly what you need, from topic and proposal to defense. See the full price, including delivery, before you send your order.
          </p>
          <div className="hero__actions">
            <a className="btn btn--accent btn--lg" href="#/order">Start your order</a>
            <a className="btn btn--ghost btn--lg" href="#/how">See how it works</a>
          </div>
          <ul className="hero__facts" aria-label="Highlights">
            <li>Live pricing</li>
            <li>Bank transfer</li>
            <li>WhatsApp receipts</li>
            <li>Built for Nigerian undergraduates</li>
          </ul>
        </div>
        <aside className="rail" aria-label="Project stages and starting prices">
          <p className="rail__label">A project, stage by stage</p>
          <ol className="rail__list">
            {rail.map((s, i) => (
              <li key={s.id} style={{ "--i": i } as React.CSSProperties}>
                <span className="rail__dot" aria-hidden="true" />
                <span className="rail__name">{s.name}</span>
                <span className="rail__price">{formatNaira(s.price)}</span>
              </li>
            ))}
          </ol>
          <a className="rail__more" href="#/order">Pick only the stages you need &rarr;</a>
        </aside>
      </div>
    </section>
  );
}
