import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/theme";

export interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const options: { value: Theme; labelKey: string; icon: typeof Sun }[] = [
    { value: "light", labelKey: "theme.light", icon: Sun },
    { value: "dark", labelKey: "theme.dark", icon: Moon },
  ];

  if (compact) {
    const next = theme === "dark" ? "light" : "dark";
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={t("theme.switchTo", { mode: t(`theme.${next}`) })}
        className={cn(
          "inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
          className,
        )}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </motion.span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-card/60 p-1 backdrop-blur-sm",
        className?.includes("w-full") && "flex w-full",
        className,
      )}
      role="group"
      aria-label={t("theme.themeLabel")}
    >
      {options.map(({ value, labelKey, icon: Icon }) => {
        const active = theme === value;
        const label = t(labelKey);
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={t("theme.switchTo", { mode: label })}
            aria-pressed={active}
            className={cn(
              "relative inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors sm:min-w-[4.5rem] sm:px-3",
              className?.includes("w-full") && "flex-1",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemeHint() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Monitor className="h-3.5 w-3.5 shrink-0" />
      {t("theme.usingMode", { mode: t(`theme.${theme}`) })}
    </p>
  );
}
