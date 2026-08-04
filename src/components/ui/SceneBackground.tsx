import { motion } from "framer-motion";
import { floatAnimation, floatAnimationSlow, pulseGlow } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SceneBackgroundProps {
  className?: string;
  showOrbs?: boolean;
  gridOpacity?: string;
}

export function SceneBackground({
  className,
  showOrbs = true,
  gridOpacity = "opacity-30",
}: SceneBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-[-48px] animate-mesh-drift bg-mesh-grid bg-mesh bg-[length:32px_32px] sm:bg-mesh",
          gridOpacity,
        )}
      />
      {showOrbs && (
        <>
          <motion.div
            aria-hidden
            className="absolute -left-20 top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl sm:-left-32 sm:top-20 sm:h-72 sm:w-72"
            animate={floatAnimation}
          />
          <motion.div
            aria-hidden
            className="absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[hsl(var(--accent-glow)/0.12)] blur-3xl sm:-right-24 sm:bottom-10 sm:h-80 sm:w-80"
            animate={floatAnimationSlow}
          />
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl sm:h-48 sm:w-48"
            animate={pulseGlow}
          />
        </>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </div>
  );
}
