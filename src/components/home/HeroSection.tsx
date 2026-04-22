import { useRef } from "react";
import { HeroCopy } from "./HeroCopy";
import { PhoneFloat } from "./PhoneFloat";

interface HeroSectionProps {
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

export function HeroSection(props: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Single atmospheric light source — mirrors the phone glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 72% 52%, rgba(110,40,200,0.1) 0%, transparent 65%)",
        }}
      />

      <div
        className="relative z-10 w-full px-6 pt-28 pb-20 mx-auto"
        style={{ maxWidth: "1200px" }}
      >
        <div className="hero-grid">
          <HeroCopy {...props} />
          <PhoneFloat containerRef={containerRef} />
        </div>
      </div>

      {/* Fade into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: "160px",
          background: "linear-gradient(to top, var(--color-bg), transparent)",
        }}
      />
    </section>
  );
}
