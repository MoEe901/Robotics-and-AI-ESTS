"use client";

import Link from "next/link";

export function EditorialNav() {
  return (
    <nav className="ed-nav">
      <div className="ed-nav-inner">
        <Link href="/" className="ed-nav-logo">
          <span className="ed-nav-logo-mark">R/AI</span>
          <span>
            Robotics{" "}
            <em style={{ fontStyle: "italic", color: "var(--ed-terracotta)" }}>&amp;</em> AI
          </span>
        </Link>
        <div className="ed-nav-links">
          <a className="ed-nav-link" href="#events">Events</a>
          <a className="ed-nav-link" href="#know-us">About</a>
          <a className="ed-nav-link" href="#why">Why Join</a>
          <a className="ed-nav-link" href="#cellules">Cellules</a>
          <a className="ed-nav-link" href="#process">Process</a>
          <a className="ed-nav-link" href="#team">Team</a>
          <a className="ed-nav-link" href="#faq">FAQ</a>
        </div>
        <a className="ed-nav-link ed-nav-cta" href="#apply">Apply →</a>
      </div>
    </nav>
  );
}
