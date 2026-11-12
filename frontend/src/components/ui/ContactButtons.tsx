import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { buildContactLinks } from "@/lib/contact";
import { cn } from "@/lib/utils";

export interface ContactButtonsProps {
  className?: string;
  layout?: "row" | "stack";
  size?: "default" | "lg";
  /** telegram = primary CTA only; all = every configured channel */
  channels?: "telegram" | "all";
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.5 4.2c.8 1.5 2.2 2.6 3.9 3V10c-1.5-.1-2.9-.6-4.1-1.5v5.7c0 3.2-2.6 5.8-5.8 5.8S4.7 17.4 4.7 14.2c0-3 2.3-5.5 5.2-5.8v3.1c-1.3.3-2.2 1.4-2.2 2.7 0 1.6 1.3 2.8 2.8 2.8s2.8-1.3 2.8-2.8V4.2h3.2z" />
    </svg>
  );
}

interface ChannelItem {
  key: string;
  href: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  external: boolean;
}

export function ContactButtons({
  className,
  layout = "row",
  size = "default",
  channels = "telegram",
}: ContactButtonsProps) {
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const links = buildContactLinks(config.contact);

  const sizeClass =
    size === "lg"
      ? "min-h-12 px-4 py-2.5 text-sm sm:px-5 sm:text-base"
      : "min-h-11 px-3 py-2 text-sm sm:px-4";

  if (channels === "telegram") {
    if (!links.hasTelegram) return null;

    return (
      <div
        className={cn(
          "flex min-w-0 gap-2",
          layout === "stack" ? "flex-col" : "flex-col sm:flex-row",
          className,
        )}
      >
        <motion.a
          href={links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-center font-medium leading-snug text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
            sizeClass,
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 whitespace-normal break-words">{t("contact.telegram")}</span>
        </motion.a>
      </div>
    );
  }

  const items: ChannelItem[] = [
    links.hasTelegram
      ? {
          key: "telegram",
          href: links.telegram,
          label: t("footer.telegram"),
          detail: links.telegramDisplay,
          icon: <MessageCircle className="h-4 w-4" />,
          external: true,
        }
      : null,
    links.hasPhone
      ? {
          key: "phone",
          href: links.phoneTel,
          label: t("contact.phone"),
          detail: links.phoneDisplay,
          icon: <Phone className="h-4 w-4" />,
          external: false,
        }
      : null,
    links.hasFacebook
      ? {
          key: "facebook",
          href: links.facebook,
          label: t("footer.facebook"),
          detail: undefined,
          icon: <FacebookIcon className="h-4 w-4" />,
          external: true,
        }
      : null,
    links.hasTiktok
      ? {
          key: "tiktok",
          href: links.tiktok,
          label: t("footer.tiktok"),
          detail: links.tiktokDisplay,
          icon: <TikTokIcon className="h-4 w-4" />,
          external: true,
        }
      : null,
    links.locationUrl
      ? {
          key: "location",
          href: links.locationUrl,
          label: t("contact.location"),
          detail: undefined,
          icon: <MapPin className="h-4 w-4" />,
          external: true,
        }
      : null,
  ].filter((item): item is ChannelItem => item !== null);

  if (items.length === 0) return null;

  return (
    <div className={cn("grid min-w-0 gap-2 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <motion.a
          key={item.key}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="group flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3 transition-colors hover:border-primary/35 hover:bg-card"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            {item.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">{item.label}</span>
            {item.detail ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.detail}</span>
            ) : null}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </motion.a>
      ))}
    </div>
  );
}

/** Sticky mobile/tablet bar — Telegram one tap away */
export function MobileContactBar() {
  const { config } = useSiteConfig();
  const links = buildContactLinks(config.contact);

  if (!links.hasTelegram) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="pointer-events-auto border-t border-border/60 bg-background/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md xs:px-4">
        <ContactButtons
          layout="row"
          size="default"
          channels="telegram"
          className="mx-auto w-full max-w-lg flex-row"
        />
      </div>
    </div>
  );
}
