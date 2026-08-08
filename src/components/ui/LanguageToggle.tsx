import { motion } from "framer-motion";
import { useLocale } from "@/context/LocaleProvider";
import { LOCALE_LABELS, type Locale } from "@/types/locale";
import { cn } from "@/lib/utils";

const locales: Locale[] = ["en", "mm"];

export interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export function LanguageToggle({ className, compact = false }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLocale();

  if (compact) {
    const next = locale === "en" ? "mm" : "en";
    return (
      <button
        type="button"
        onClick={() => setLocale(next)}
        aria-label={t("language.switchTo", { language: LOCALE_LABELS[next] })}
        className={cn(
          "inline-flex h-11 min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card/60 px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
          className,
        )}
      >
        {LOCALE_LABELS[locale]}
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
      aria-label={t("language.label")}
    >
      {locales.map((value) => {
        const active = locale === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setLocale(value)}
            aria-label={t("language.switchTo", { language: LOCALE_LABELS[value] })}
            aria-pressed={active}
            className={cn(
              "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-xs font-semibold transition-colors sm:min-w-[2.75rem]",
              className?.includes("w-full") && "flex-1",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{LOCALE_LABELS[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
