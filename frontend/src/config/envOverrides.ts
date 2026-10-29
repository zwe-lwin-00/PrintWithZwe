import type { SiteConfig } from "@/types/config";

export function applyEnvOverrides(config: SiteConfig): SiteConfig {
  const next = structuredClone(config);

  if (import.meta.env.VITE_TELEGRAM_USERNAME) {
    next.contact.telegramUsername = import.meta.env.VITE_TELEGRAM_USERNAME;
  }
  if (import.meta.env.VITE_PHONE_NUMBER) {
    next.contact.phoneNumber = import.meta.env.VITE_PHONE_NUMBER;
  }
  if (import.meta.env.VITE_WHATSAPP_NUMBER !== undefined) {
    next.contact.whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  }
  if (import.meta.env.VITE_MESSENGER_PAGE_ID) {
    next.contact.messengerPageId = import.meta.env.VITE_MESSENGER_PAGE_ID;
  }

  if (import.meta.env.VITE_BRAND_NAME) {
    next.brand.name = import.meta.env.VITE_BRAND_NAME;
  }
  if (import.meta.env.VITE_BRAND_TAGLINE) {
    next.brand.tagline = import.meta.env.VITE_BRAND_TAGLINE;
  }

  return next;
}
