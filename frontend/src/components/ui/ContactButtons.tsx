import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { buildContactLinks } from "@/lib/contact";
import { cn } from "@/lib/utils";

export interface ContactButtonsProps {
  className?: string;
  layout?: "row" | "stack";
  size?: "default" | "lg";
}

export function ContactButtons({
  className,
  layout = "row",
  size = "default",
}: ContactButtonsProps) {
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const links = buildContactLinks(config.contact);

  if (!links.hasPhone && !links.hasTelegram) return null;

  const sizeClass =
    size === "lg"
      ? "h-12 min-h-12 px-5 text-base"
      : "h-11 min-h-11 px-4 text-sm";

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "stack" ? "flex-col" : "flex-col xs:flex-row",
        className,
      )}
    >
      {links.hasPhone && (
        <motion.a
          href={links.phoneTel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card/80 font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-card",
            sizeClass,
          )}
        >
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{t("contact.call")}</span>
        </motion.a>
      )}
      {links.hasTelegram && (
        <motion.a
          href={links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#229ED9] font-medium text-white shadow-lg shadow-[#229ED9]/25 transition-colors hover:bg-[#1d8bc2]",
            sizeClass,
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("contact.telegram")}</span>
        </motion.a>
      )}
    </div>
  );
}

/** Sticky mobile bar — Call + Telegram always one tap away */
export function MobileContactBar() {
  const { config } = useSiteConfig();
  const links = buildContactLinks(config.contact);

  if (!links.hasPhone && !links.hasTelegram) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
      <div className="pointer-events-auto border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <ContactButtons
          layout="row"
          size="default"
          className="mx-auto max-w-lg flex-row"
        />
      </div>
    </div>
  );
}
