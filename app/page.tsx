import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      {/* ====== NAVBAR ====== */}
      <Navbar />

      {/* ====== HERO SECTION ====== */}
      <section className="hero" aria-labelledby="hero-title">
        {/* Full-screen background video */}
        {/* <video
          className="hero__bg-video"
          src="/dolphin-pay-bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        /> */}
        <div className="hero__container">
          {/* LEFT — Content */}
          <div className="hero__content">
            <p className="hero__eyebrow mt-4">Dolphin Pay (Dpay)</p>

            <h1 id="hero-title" className="hero__title_one">
              Your lifestyle.
            </h1>
            <h1 id="hero-title" className="hero__title_two">
              One powerful wallet.
            </h1>
            <p className="hero__description" style={{ color: "#000000" }}>
              Pay, shop, play and manage your digital world from one secure
              platform.
            </p>

            {/* CTA Buttons */}
            <div className="hero__actions">
              {/* Outer glow ring */}
              <button
                id="join-waitlist-cta"
                className="p-[2px] rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #7dd8cc, #a8ede3, #5fc9bb, #9fe3d8)",
                  boxShadow:
                    "0 0 0 3px rgba(127,214,200,0.25), 0 0 18px 4px rgba(127,214,200,0.35), 0 4px 20px rgba(95,201,187,0.2)",
                }}
              >
                {/* Frosted glass inner pill */}
                <span
                  className="flex items-center justify-center rounded-full font-medium text-[#1a4a45] text-[15px] tracking-wide"
                  style={{
                    padding: "11px 44px",
                    background:
                      "linear-gradient(160deg, rgba(234,247,245,0.92) 0%, rgba(210,240,235,0.85) 50%, rgba(198,236,230,0.88) 100%)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(127,214,200,0.2)",
                  }}
                >
                  Join Waitlist
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT — Video Visual */}
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__video-wrapper">
              <video
                src="/dolphin-pay.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="hero__visual-video"
              />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 bg-[#E8ECEF69] rounded-tr-md z-50">
          <p className="font-semibold text-sm md:text-lg mx-3">
            Powered by the Dolphin ecosystem
          </p>
        </div>
      </section>
    </>
  );
}
