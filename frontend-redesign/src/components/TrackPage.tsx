import { useState } from "react";
import { CONTACT } from "../data/catalog";
import { NotConnectedError, ordersApi, type OrderStatus } from "../lib/ordersApi";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "unavailable" } | { kind: "error"; msg: string } | { kind: "found"; status: OrderStatus };

export function TrackPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "loading" || !ref.trim() || !email.trim()) return;
    setState({ kind: "loading" });
    try {
      setState({ kind: "found", status: await ordersApi.track(ref.trim(), email.trim()) });
    } catch (err) {
      setState(err instanceof NotConnectedError ? { kind: "unavailable" } : { kind: "error", msg: "We could not look that order up. Check the details and try again." });
    }
  }

  return (
    <div className="page wrap">
      <p className="eyebrow">Track order</p>
      <h1 className="h1">Follow your project.</h1>
      <p className="muted lead">Enter your order reference and the email you used on the order.</p>
      <form className="form form--narrow" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="t-ref">Order reference</label>
          <input id="t-ref" value={ref} onChange={(e) => setRef(e.target.value)} autoComplete="off" required />
        </div>
        <div className="field">
          <label htmlFor="t-email">Email on the order</label>
          <input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <button className="btn btn--accent" type="submit" disabled={state.kind === "loading" || !ref.trim() || !email.trim()}>
          {state.kind === "loading" ? "Checking…" : "Track order"}
        </button>
      </form>
      <div aria-live="polite">
        {state.kind === "unavailable" && (
          <div className="alert alert--info">
            <strong>Online tracking is not available yet.</strong> It is being connected. For an update on your order, message us on{" "}
            <a href={`https://wa.me/${CONTACT.whatsappIntl}`}>WhatsApp ({CONTACT.whatsappDisplay})</a> with your order reference.
          </div>
        )}
        {state.kind === "error" && <div className="alert alert--error">{state.msg}</div>}
        {state.kind === "found" && <div className="alert alert--info">Stage: <strong>{state.status.stage}</strong> (updated {state.status.updatedAt})</div>}
      </div>
    </div>
  );
}
