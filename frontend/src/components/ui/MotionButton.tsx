import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { springTransition } from "@/lib/motion";

export interface MotionLinkButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: "default" | "outline";
}

export function MotionLinkButton({
  href,
  children,
  className,
  icon,
  variant = "outline",
}: MotionLinkButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className={cn(
        "inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:px-8",
        variant === "default"
          ? "border border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 dark:shadow-primary/20"
          : "border border-border bg-transparent text-foreground hover:border-primary/30 hover:bg-muted/50",
        className,
      )}
    >
      {icon}
      {children}
    </motion.a>
  );
}

export function AnimatedArrow() {
  return (
    <motion.span
      className="inline-flex"
      initial={{ x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <ArrowRight className="h-4 w-4" />
    </motion.span>
  );
}
