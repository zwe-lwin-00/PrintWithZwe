import type { SiteConfig } from "@/types/config";

export const defaultSiteConfig: SiteConfig = {
  contact: {
    phoneNumber: "+959787238201",
    telegramUsername: "zwe_ll",
    messengerPageId: "printwithzwe",
    tiktokUsername: "printwithzwe2026",
    facebookUrl: "https://www.facebook.com/share/193HnfrGfk/?mibextid=wwXIfr",
    locationUrl: "https://maps.app.goo.gl/Fq5xDbNXvTAWbB8t5",
  },
  pricing: {
    currency: "MMK",
    locale: "en-MM",
    baseFee: 3000,
    machineRatePerHour: 1000,
    colorSurchargesPerGram: { "1": 0, "2": 50, "3": 90, "4": 120 },
    materials: [
      { id: "pla", label: "PLA", ratePerGram: 250 },
      { id: "petg", label: "PETG", ratePerGram: 270 },
      { id: "abs", label: "ABS", ratePerGram: 280 },
      { id: "tpu", label: "TPU", ratePerGram: 350 },
      { id: "multi-color", label: "Multi-Color (AMS)", ratePerGram: 370 },
    ],
  },
  brand: {
    name: "Print with Zwe",
    tagline: "Bringing your ideas to life, layer by layer.",
    heroBadge: "Bambu Lab quality · Precision engineering",
    heroBadgeShort: "Bambu Lab quality prints",
  },
};

export const SITE_CONFIG_URL = "/site-config.json";
