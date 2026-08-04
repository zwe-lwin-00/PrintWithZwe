import type { SiteConfig } from "@/types/config";

export const defaultSiteConfig: SiteConfig = {
  contact: {
    telegramUsername: "zwe_ll",
    whatsappNumber: "",
    messengerPageId: "printwithzwe",
  },
  pricing: {
    currency: "MMK",
    locale: "en-MM",
    baseFee: 2000,
    machineRatePerHour: 1500,
    materials: [
      { id: "pla", label: "PLA", ratePerGram: 50 },
      { id: "petg", label: "PETG", ratePerGram: 65 },
      { id: "abs", label: "ABS", ratePerGram: 70 },
      { id: "tpu", label: "TPU", ratePerGram: 90 },
      { id: "multi-color", label: "Multi-Color (AMS)", ratePerGram: 80 },
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
