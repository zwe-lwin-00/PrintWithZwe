import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  panelClassName?: string;
  /** id of the element that labels the dialog (aria-labelledby) */
  labelledBy?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  panelClassName,
  labelledBy,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    const focusTimer = window.setTimeout(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const focusable = dialog?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
      window.clearTimeout(focusTimer);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close dialog overlay"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={cn(
              "relative z-10 w-full max-w-lg sm:mx-4",
              panelClassName,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface DialogContentProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function DialogContent({
  title,
  description,
  onClose,
  children,
  className,
}: DialogContentProps) {
  return (
    <div
      className={cn(
        "max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-border bg-card p-4 shadow-elevated sm:max-h-[85dvh] sm:rounded-xl sm:p-6",
        "pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
        <div className="min-w-0 pr-2">
          <h2 className="text-lg font-semibold text-card-foreground sm:text-xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close dialog"
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
