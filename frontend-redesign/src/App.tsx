import { Contact } from "./components/Contact";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { OrderBuilder } from "./components/OrderBuilder";
import { PrivacyPage } from "./components/PrivacyPage";
import { TrackPage } from "./components/TrackPage";
import { useOrder } from "./lib/useOrder";
import { useRoute } from "./lib/useRoute";

export function App() {
  const { page } = useRoute();
  const order = useOrder();
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>
        {page === "home" && (
          <>
            <Hero />
            <OrderBuilder order={order} />
            <HowItWorks />
            <Faq />
            <Contact />
          </>
        )}
        {page === "track" && <TrackPage />}
        {page === "privacy" && <PrivacyPage />}
      </main>
      <Footer />
    </>
  );
}
