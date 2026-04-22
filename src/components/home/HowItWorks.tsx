import { RevealOnScroll } from "../ui/RevealOnScroll";
import { StepCard, type StepData } from "./StepCard";

const STEPS: StepData[] = [
  {
    title: "Purchase",
    description:
      "One payment. No subscription, no contracts. Your number is reserved the moment you check out.",
  },
  {
    title: "Scan the QR code",
    description:
      "Open the Arnacon app and scan. Your Israeli number is linked to your device instantly.",
  },
  {
    title: "Call from anywhere",
    description:
      "Receive and make calls, send and receive SMS — on your Israeli number, from anywhere in the world.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="mx-auto px-6 py-24"
      style={{ maxWidth: "1200px" }}
    >
      {/* Section header — left aligned, not centered */}
      <RevealOnScroll className="mb-4">
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          How it works
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={0.08} className="mb-2">
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--color-text)",
          }}
        >
          From payment to call
          <br />
          <span className="gradient-text">in minutes.</span>
        </h2>
      </RevealOnScroll>

      {/* Step rows — bottom border closes the list */}
      <div
        className="mt-14"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {STEPS.map((step, i) => (
          <StepCard key={step.title} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}
