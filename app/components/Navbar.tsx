"use client";

import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <a href="/" className="navbar__logo" aria-label="Dolphin Pay Home">
          <div className="navbar__logo-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 14.5 18.9 16.75 17.14 18.28"
                strokeLinecap="round"
              />
              <path
                d="M12 8V12L14.5 14.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2" fill="white" stroke="none" />
            </svg>
          </div>
          <span className="navbar__logo-text">
            Dolphin<span>Pay</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className="navbar__links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="navbar__link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Launching badge & CTA (desktop) */}
        <div className="navbar__cta">
          <div className="navbar__badge-wrapper">
            <div className="launching-badge">
              <span className="launching-badge__dot" aria-hidden="true" />
              Launching soon.
            </div>
          </div>
          <a href="#waitlist" className="btn-nav-outline">
            Log In
          </a>
          <a href="#waitlist" className="btn-nav-solid">
            Join Waitlist
          </a>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className={`navbar__hamburger ${menuOpen ? "open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile slide-down menu */}
      <div
        className={`navbar__mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}

        <div
          className="launching-badge"
          style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
        >
          <span className="launching-badge__dot" aria-hidden="true" />
          Launching soon.
        </div>

        <div className="navbar__mobile-cta">
          <a
            href="#waitlist"
            className="btn-mobile-outline"
            onClick={() => setMenuOpen(false)}
          >
            Log In
          </a>
          <a
            href="#waitlist"
            className="btn-mobile-solid"
            onClick={() => setMenuOpen(false)}
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </>
  );
}
