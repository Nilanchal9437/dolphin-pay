import Image from "next/image";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      {/* ====== NAVBAR ====== */}
      <Navbar />

      {/* ====== HERO SECTION ====== */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__container">
          {/* LEFT — Content */}
          <div className="hero__content">
            <p className="hero__eyebrow">Dolphin Pay (Dpay)</p>

            <h1 id="hero-title" className="hero__title">
              A new way to
              <br />
              manage your
              <br />
              digital lifestyle
            </h1>

            <p className="hero__description">
              Seamlessly control your finances and experiences with a secure,
              elegant digital platform designed for your modern life.
            </p>

            {/* CTA Buttons */}
            <div className="hero__actions">
              <a
                href="#waitlist"
                className="btn-waitlist"
                id="join-waitlist-cta"
              >
                Join Waitlist
              </a>
              <a
                href="#features"
                className="btn-learn-more"
                id="learn-more-cta"
              >
                Learn more
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            {/* Stats row */}
            <div
              className="hero__stats"
              role="list"
              aria-label="Key statistics"
            >
              <div className="hero__stat" role="listitem">
                <span className="hero__stat-value">50K+</span>
                <span className="hero__stat-label">Waitlist Users</span>
              </div>
              <div className="hero__stat" role="listitem">
                <span className="hero__stat-value">256-bit</span>
                <span className="hero__stat-label">Encryption</span>
              </div>
              <div className="hero__stat" role="listitem">
                <span className="hero__stat-value">99.9%</span>
                <span className="hero__stat-label">Uptime SLA</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div
              className="hero__trust"
              role="list"
              aria-label="Trust indicators"
            >
              <div className="hero__trust-item" role="listitem">
                <span className="hero__trust-dot" aria-hidden="true" />
                Bank-grade security
              </div>
              <div className="hero__trust-item" role="listitem">
                <span className="hero__trust-dot" aria-hidden="true" />
                No hidden fees
              </div>
              <div className="hero__trust-item" role="listitem">
                <span className="hero__trust-dot" aria-hidden="true" />
                Real-time sync
              </div>
            </div>
          </div>

          {/* RIGHT — 3D Visual */}
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__image-wrapper">
              <Image
                src="/hero-3d.png"
                alt="Dolphin Pay 3D glassmorphism logo — layered transparent panels with the letter D"
                width={600}
                height={600}
                className="hero__img"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====== PLACEHOLDER SECTIONS (for nav links to work) ====== */}
      <section
        id="features"
        style={{ height: "60px" }}
        aria-label="Features section"
      />
      <section
        id="how-it-works"
        style={{ height: "60px" }}
        aria-label="How it works section"
      />
      <section
        id="security"
        style={{ height: "60px" }}
        aria-label="Security section"
      />
      <section
        id="pricing"
        style={{ height: "60px" }}
        aria-label="Pricing section"
      />
      <section
        id="waitlist"
        style={{ height: "60px" }}
        aria-label="Waitlist section"
      />
    </>
  );
}
