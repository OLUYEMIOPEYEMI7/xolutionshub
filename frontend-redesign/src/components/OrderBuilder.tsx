import { useEffect, useRef, useState } from "react";
import { DELIVERY, GROUP_ORDER, SERVICES, STEPS, CONTACT } from "../data/catalog";
import { formatNaira } from "../lib/pricing";
import { buildOrderText, mailtoLink, whatsappLink } from "../lib/orderMessage";
import { ordersApi } from "../lib/ordersApi";
import { validate, type Details, type Errors } from "../lib/validation";
import type { OrderState } from "../lib/useOrder";
import { Reveal } from "./Reveal";

export function OrderBuilder({ order }: { order: OrderState }) {
  const { step, setStep, quote, selected, problems } = order;
  const [errors, setErrors] = useState<Errors>({});
  const head = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Move focus to the step heading when the step changes (not on first render).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    head.current?.focus();
  }, [step]);

  const canContinue = step === 0 ? selected.size > 0 && problems.length === 0 : true;

  function next() {
    if (step === 1) {
      const e = validate(order.details);
      setErrors(e);
      if (Object.keys(e).length) {
        requestAnimationFrame(() => document.getElementById("error-summary")?.focus());
        return;
      }
    }
    setStep(Math.min(step + 1, STEPS.length - 1));
  }

  return (
    <section id="order" className="section order" aria-labelledby="order-title">
      <div className="wrap">
        <Reveal className="order__intro">
          <p className="eyebrow">Services &amp; pricing</p>
          <h2 id="order-title" className="h2">Pick what you need. See the price as you go.</h2>
        </Reveal>

        <ol className="stepper" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
              <span className="stepper__n">{i < step ? "✓" : i + 1}</span>
              <span className="stepper__t">{s}</span>
            </li>
          ))}
        </ol>

        <div className="order__grid">
          <div className="order__main">
            {step === 0 && <ServicesStep order={order} headRef={head} />}
            {step === 1 && <DetailsStep order={order} errors={errors} setErrors={setErrors} headRef={head} />}
            {step === 2 && <ReviewStep order={order} headRef={head} />}
            {step === 3 && <SendStep order={order} headRef={head} />}

            <div className="order__nav">
              {step > 0 && (
                <button type="button" className="btn btn--outline" onClick={() => setStep(step - 1)}>Back</button>
              )}
              {step < 3 && (
                <button type="button" className="btn btn--accent" disabled={!canContinue} onClick={next}>
                  {step === 2 ? "Continue to send" : "Continue"}
                </button>
              )}
            </div>
          </div>
          <Summary order={order} />
        </div>
      </div>

      {step < 3 && (
        <div className="mbar" role="region" aria-label="Order total">
          <div>
            <span className="mbar__label">{selected.size} selected</span>
            <strong className="mbar__total">{formatNaira(quote.total)}</strong>
          </div>
          <button type="button" className="btn btn--accent btn--sm" disabled={!canContinue} onClick={next}>
            {step === 0 ? "Continue" : step === 1 ? "Review" : "Send"}
          </button>
        </div>
      )}
    </section>
  );
}

type HeadRef = React.RefObject<HTMLHeadingElement>;

function ServicesStep({ order, headRef }: { order: OrderState; headRef: HeadRef }) {
  const { selected, toggle, delivery, setDelivery, problems, clear } = order;
  return (
    <div>
      <h3 ref={headRef} tabIndex={-1} className="step-title">Select services</h3>
      <p className="muted">Choose only what you need. You can combine any of them.</p>

      {GROUP_ORDER.map((g) => {
        const items = SERVICES.filter((s) => s.group === g);
        return (
          <fieldset key={g} className="group">
            <legend>{g}</legend>
            <ul className="svc-list">
              {items.map((s) => {
                const on = selected.has(s.id);
                return (
                  <li key={s.id}>
                    <label className={`svc ${on ? "is-on" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(s.id)} />
                      <span className="svc__box" aria-hidden="true" />
                      <span className="svc__body">
                        <span className="svc__name">{s.name}</span>
                        {s.description && <span className="svc__desc">{s.description}</span>}
                      </span>
                      <span className="svc__meta">
                        <span className="svc__price">{formatNaira(s.price)}</span>
                        {s.days && <span className="svc__days">{s.days}</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}

      <fieldset className="group">
        <legend>Delivery</legend>
        <div className="seg" role="radiogroup" aria-label="Delivery option">
          {DELIVERY.map((d) => (
            <label key={d.id} className={`seg__opt ${delivery === d.id ? "is-on" : ""}`}>
              <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => setDelivery(d.id)} />
              <span className="seg__label">{d.label}</span>
              <span className="seg__note">{d.note}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {problems.length > 0 && (
        <ul className="alert alert--warn" role="alert">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      {selected.size > 0 && (
        <button type="button" className="link-btn" onClick={clear}>Clear all selections</button>
      )}
    </div>
  );
}

const FIELDS: { key: keyof Details; label: string; type?: string; autoComplete?: string; required?: boolean; hint?: string; inputMode?: "tel" | "email" }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name", required: true },
  { key: "email", label: "Email", type: "email", autoComplete: "email", required: true, inputMode: "email" },
  { key: "phone", label: "Phone / WhatsApp number", type: "tel", autoComplete: "tel", required: true, inputMode: "tel" },
  { key: "institution", label: "Institution", autoComplete: "organization", required: true },
  { key: "department", label: "Department", required: true },
  { key: "topic", label: "Project topic", hint: "Optional. Leave blank if you need topic development." },
  { key: "deadline", label: "Date you need it by", type: "date", hint: "Optional." },
];

function DetailsStep({ order, errors, setErrors, headRef }: { order: OrderState; errors: Errors; setErrors: (e: Errors) => void; headRef: HeadRef }) {
  const { details, setDetails } = order;
  const set = <K extends keyof Details>(k: K, v: Details[K]) => {
    setDetails({ ...details, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };
  const errList = Object.entries(errors).filter(([, v]) => v) as [keyof Details, string][];
  return (
    <div>
      <h3 ref={headRef} tabIndex={-1} className="step-title">Your academic and project details</h3>
      <p className="muted">We ask only for what is needed to handle this order. Details stay in your browser until you choose to send them.</p>

      {errList.length > 0 && (
        <div id="error-summary" className="alert alert--error" role="alert" tabIndex={-1}>
          <strong>Please fix {errList.length} {errList.length === 1 ? "field" : "fields"}:</strong>
          <ul>
            {errList.map(([k, m]) => (
              <li key={k}><a href={`#f-${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(`f-${k}`)?.focus(); }}>{m}</a></li>
            ))}
          </ul>
        </div>
      )}

      <form className="form" noValidate onSubmit={(e) => e.preventDefault()}>
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`f-${f.key}`}>{f.label}{f.required && <span className="req" aria-hidden="true"> *</span>}</label>
            <input
              id={`f-${f.key}`}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              value={details[f.key] as string}
              required={f.required}
              aria-invalid={errors[f.key] ? true : undefined}
              aria-describedby={[f.hint ? `h-${f.key}` : "", errors[f.key] ? `e-${f.key}` : ""].filter(Boolean).join(" ") || undefined}
              onChange={(e) => set(f.key, e.target.value as never)}
            />
            {f.hint && <p id={`h-${f.key}`} className="hint">{f.hint}</p>}
            {errors[f.key] && <p id={`e-${f.key}`} className="err">{errors[f.key]}</p>}
          </div>
        ))}
        <div className="field field--wide">
          <label htmlFor="f-notes">Anything else we should know</label>
          <textarea id="f-notes" rows={4} maxLength={1000} value={details.notes} aria-invalid={errors.notes ? true : undefined} onChange={(e) => set("notes", e.target.value)} />
          <p className="hint">Optional. {details.notes.length}/1000</p>
        </div>
        <div className="field field--wide">
          <label className="check">
            <input id="f-consent" type="checkbox" checked={details.consent} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "e-consent" : undefined} onChange={(e) => set("consent", e.target.checked)} />
            <span>I agree that Xolutions Hub may use these details to process this order. See the <a href="#/privacy">privacy notice</a>.</span>
          </label>
          {errors.consent && <p id="e-consent" className="err">{errors.consent}</p>}
        </div>
      </form>
    </div>
  );
}

function ReviewStep({ order, headRef }: { order: OrderState; headRef: HeadRef }) {
  const { quote, details, setStep } = order;
  const rows: [string, string][] = [
    ["Name", details.fullName], ["Email", details.email], ["Phone", details.phone],
    ["Institution", details.institution], ["Department", details.department],
    ["Project topic", details.topic], ["Needed by", details.deadline], ["Notes", details.notes],
  ];
  return (
    <div>
      <h3 ref={headRef} tabIndex={-1} className="step-title">Review your order</h3>
      <div className="review">
        <section aria-label="Services and total">
          <h4>Services <button type="button" className="link-btn" onClick={() => setStep(0)}>Edit</button></h4>
          <ul className="lines">
            {quote.items.map((i) => (
              <li key={i.id}><span>{i.name}</span><span>{formatNaira(i.price)}</span></li>
            ))}
            <li><span>Delivery: {quote.delivery.label}</span><span>{quote.delivery.surcharge ? `+${formatNaira(quote.delivery.surcharge)}` : "No extra charge"}</span></li>
            <li className="lines__total"><span>Total</span><span>{formatNaira(quote.total)}</span></li>
          </ul>
        </section>
        <section aria-label="Your details">
          <h4>Your details <button type="button" className="link-btn" onClick={() => setStep(1)}>Edit</button></h4>
          <dl className="dl">
            {rows.filter(([, v]) => v.trim()).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

function SendStep({ order, headRef }: { order: OrderState; headRef: HeadRef }) {
  const { quote, details } = order;
  const text = buildOrderText(quote, details);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  return (
    <div>
      <h3 ref={headRef} tabIndex={-1} className="step-title">Send your order</h3>
      <div className="alert alert--info" role="status">
        <strong>Your order has not been sent yet.</strong>{" "}
        {ordersApi.connected
          ? "Submit it to receive your order reference."
          : "Online submission and order references are being connected. For now, send this order to Xolutions Hub on WhatsApp or by email, and you will be told the next steps there."}
      </div>
      <div className="send">
        <a className="btn btn--accent btn--lg" href={whatsappLink(text)} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
        <a className="btn btn--outline btn--lg" href={mailtoLink(text)}>Send by email</a>
        <button type="button" className="btn btn--outline btn--lg" onClick={copy}>Copy order text</button>
      </div>
      <p className="hint" aria-live="polite">
        {copied === "ok" && "Copied. Paste it into WhatsApp or an email to " + CONTACT.email + "."}
        {copied === "fail" && "Copy was blocked by your browser. Select the text below and copy it manually."}
      </p>
      <pre className="preview" aria-label="Order message preview" tabIndex={0}>{text}</pre>
      <p className="muted">After you have paid by bank transfer, send your receipt on WhatsApp ({CONTACT.whatsappDisplay}).</p>
    </div>
  );
}

function Summary({ order }: { order: OrderState }) {
  const { quote } = order;
  return (
    <aside className="summary" aria-labelledby="sum-title">
      <h3 id="sum-title">Your order</h3>
      {quote.items.length === 0 ? (
        <p className="muted">Nothing selected yet. Choose a service to see your total.</p>
      ) : (
        <ul className="lines">
          {quote.items.map((i) => (
            <li key={i.id}><span>{i.name}</span><span>{formatNaira(i.price)}</span></li>
          ))}
          <li><span>Delivery: {quote.delivery.label}</span><span>{quote.delivery.surcharge ? `+${formatNaira(quote.delivery.surcharge)}` : "—"}</span></li>
        </ul>
      )}
      <div className="summary__total" aria-live="polite" aria-atomic="true">
        <span>Total</span>
        <strong>{formatNaira(quote.total)}</strong>
      </div>
      <p className="hint">Final pricing depends on the selected services, delivery option, and applicable service requirements.</p>
    </aside>
  );
}
