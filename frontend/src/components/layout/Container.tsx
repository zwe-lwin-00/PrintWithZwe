import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full min-w-0 max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </Component>
  );
}
