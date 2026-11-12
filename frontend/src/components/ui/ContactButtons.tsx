import { motion } from "framer-motion";
import { MapPin, MessageCircle, Phone } from "lucide-react";
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

interface ChannelButtonProps {
  href: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  className?: string;
  sizeClass: string;
  external?: boolean;
}

function ChannelButton({
  href,
  label,
  detail,
  icon,
  className,
  sizeClass,
  external = true,
}: ChannelButtonProps) {
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-lg text-center font-medium leading-snug transition-colors",
        sizeClass,
        className,
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 whitespace-normal break-words">
        {label}
        {detail ? (
          <span className="mt-0.5 block text-xs font-normal opacity-90">{detail}</span>
        ) : null}
      </span>
    </motion.a>
  );
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
        <ChannelButton
          href={links.telegram}
          label={t("contact.telegram")}
          icon={<MessageCircle className="h-4 w-4" />}
          sizeClass={sizeClass}
          className="bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/25 hover:bg-[#1d8bc2]"
        />
      </div>
    );
  }

  const items = [
    links.hasTelegram
      ? {
          key: "telegram",
          href: links.telegram,
          label: t("contact.telegram"),
          detail: links.telegramDisplay,
          icon: <MessageCircle className="h-4 w-4" />,
          className:
            "bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/25 hover:bg-[#1d8bc2]",
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
          className:
            "border border-border bg-card text-foreground shadow-sm hover:border-primary/30 hover:bg-card/80",
          external: false,
        }
      : null,
    links.hasFacebook
      ? {
          key: "facebook",
          href: links.facebook,
          label: t("contact.facebook"),
          detail: undefined,
          icon: <FacebookIcon className="h-4 w-4" />,
          className:
            "border border-border bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/25 hover:bg-[#166fe5]",
          external: true,
        }
      : null,
    links.hasTiktok
      ? {
          key: "tiktok",
          href: links.tiktok,
          label: t("contact.tiktok"),
          detail: links.tiktokDisplay,
          icon: <TikTokIcon className="h-4 w-4" />,
          className:
            "border border-border bg-foreground text-background shadow-sm hover:opacity-90",
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
          className:
            "border border-border bg-card text-foreground shadow-sm hover:border-primary/30 hover:bg-card/80",
          external: true,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid min-w-0 gap-2",
        items.length === 1 ? "grid-cols-1" : "grid-cols-1 xs:grid-cols-2",
        className,
      )}
    >
      {items.map((item) => (
        <ChannelButton
          key={item.key}
          href={item.href}
          label={item.label}
          detail={item.detail}
          icon={item.icon}
          sizeClass={sizeClass}
          className={item.className}
          external={item.external}
        />
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
