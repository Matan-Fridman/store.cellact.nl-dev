import { motion, useScroll, useTransform } from "framer-motion";
import { GradientGlow } from "../ui/GradientGlow";
import phoneImage from "../../assets/secnum-1.webp";
import { useLanguage } from "../../contexts/LanguageContext";

interface PhoneFloatProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function PhoneFloat({ containerRef }: PhoneFloatProps) {
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.96]);

  return (
    <motion.div
      style={{ y, opacity, scale }}
      className="landing-phone relative flex items-center justify-center w-full"
    >
      <GradientGlow
        size={480}
        opacity={0.18}
        blur={120}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <div className="animate-float relative z-10">
        <img
          src={phoneImage}
          alt={t.hero.headlineA}
          className="landing-phone-img"
        />
      </div>
    </motion.div>
  );
}
