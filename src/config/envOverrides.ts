import type { MaterialId } from "@/types/pricing";
import type { SiteConfig } from "@/types/config";

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMaterialRatesJson(
  value: string | undefined,
  fallback: SiteConfig["pricing"]["materials"],
): SiteConfig["pricing"]["materials"] {
  if (!value?.trim()) return fallback;

  try {
    const parsed = JSON.parse(value) as Array<{
      id: MaterialId;
      label: string;
      ratePerGram: number;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

    return parsed.filter(
      (item) =>
        item.id &&
        item.label &&
        Number.isFinite(item.ratePerGram) &&
        item.ratePerGram >= 0,
    );
  } catch {
    return fallback;
  }
}

export function applyEnvOverrides(config: SiteConfig): SiteConfig {
  const next = structuredClone(config);

  if (import.meta.env.VITE_TELEGRAM_USERNAME) {
    next.contact.telegramUsername = import.meta.env.VITE_TELEGRAM_USERNAME;
  }
  if (import.meta.env.VITE_WHATSAPP_NUMBER !== undefined) {
    next.contact.whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  }
  if (import.meta.env.VITE_MESSENGER_PAGE_ID) {
    next.contact.messengerPageId = import.meta.env.VITE_MESSENGER_PAGE_ID;
  }

  if (import.meta.env.VITE_PRICING_BASE_FEE) {
    next.pricing.baseFee = parseNumber(
      import.meta.env.VITE_PRICING_BASE_FEE,
      next.pricing.baseFee,
    );
  }
  if (import.meta.env.VITE_PRICING_MACHINE_RATE) {
    next.pricing.machineRatePerHour = parseNumber(
      import.meta.env.VITE_PRICING_MACHINE_RATE,
      next.pricing.machineRatePerHour,
    );
  }
  if (import.meta.env.VITE_PRICING_CURRENCY) {
    next.pricing.currency = import.meta.env.VITE_PRICING_CURRENCY;
  }
  if (import.meta.env.VITE_PRICING_LOCALE) {
    next.pricing.locale = import.meta.env.VITE_PRICING_LOCALE;
  }
  if (import.meta.env.VITE_PRICING_MATERIALS) {
    next.pricing.materials = parseMaterialRatesJson(
      import.meta.env.VITE_PRICING_MATERIALS,
      next.pricing.materials,
    );
  }

  if (import.meta.env.VITE_BRAND_NAME) {
    next.brand.name = import.meta.env.VITE_BRAND_NAME;
  }
  if (import.meta.env.VITE_BRAND_TAGLINE) {
    next.brand.tagline = import.meta.env.VITE_BRAND_TAGLINE;
  }

  if (import.meta.env.VITE_GALLERY_FEED_URL) {
    next.gallery.feedUrl = import.meta.env.VITE_GALLERY_FEED_URL;
  }
  if (import.meta.env.VITE_GALLERY_DRIVE_FOLDER_ID) {
    next.gallery.driveFolderId = import.meta.env.VITE_GALLERY_DRIVE_FOLDER_ID;
  }

  return next;
}
