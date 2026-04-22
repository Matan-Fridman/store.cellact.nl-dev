import { motion, useScroll, useTransform } from "framer-motion";
import { GradientGlow } from "../ui/GradientGlow";
import phoneImage from "../../../assets/phone.webp";

interface PhoneFloatProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * The hero phone visual.
 * - Floats up/down on a slow CSS loop
 * - Exits upward as the user scrolls past the hero
 * - Two-layer glow: tight inner core + large outer halo
 */
export function PhoneFloat({ containerRef }: PhoneFloatProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);

  return (
    <motion.div
      style={{ y, opacity, scale }}
      className="relative flex items-center justify-center w-full"
    >
      {/* Outer diffuse halo */}
      <GradientGlow
        size={700}
        opacity={0.13}
        blur={160}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Inner concentrated core */}
      <GradientGlow
        size={320}
        opacity={0.38}
        blur={72}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%]"
      />

      {/* Phone */}
      <div className="animate-float relative z-10">
        <img
          src={phoneImage}
          alt="Israeli mobile number on your phone"
          style={{
            width: "clamp(260px, 28vw, 400px)",
            borderRadius: "28px",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.07), 0 50px 100px rgba(0,0,0,0.6), 0 20px 60px rgba(142,45,226,0.25)",
          }}
        />
      </div>
    </motion.div>
  );
}
