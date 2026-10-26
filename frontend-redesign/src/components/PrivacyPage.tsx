import { CONTACT } from "../data/catalog";

export function PrivacyPage() {
  return (
    <div className="page wrap prose">
      <p className="eyebrow">Privacy notice</p>
      <h1 className="h1">How this website handles your information.</h1>
      <p className="alert alert--warn">Draft for the business to review and confirm before launch. It describes what this website does today; it is not legal advice.</p>
      <h2>What the order form collects</h2>
      <p>Name, email, phone number, institution and department are needed to process an order. Project topic, deadline and notes are optional.</p>
      <h2>Where it goes</h2>
      <p>Your details stay in your browser while you fill in the form. They leave your device only when you choose to send the order by WhatsApp or email, to the contact points below. Selected services and delivery choice are remembered in your browser so you can come back to them; personal details are not stored.</p>
      <h2>Tracking and analytics</h2>
      <p>This website does not load advertising, analytics or other third-party tracking scripts. Fonts are served from this site.</p>
      <h2>Contact</h2>
      <p>WhatsApp {CONTACT.whatsappDisplay}, or email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.</p>
      <p><a href="#/">&larr; Back to home</a></p>
    </div>
  );
}
