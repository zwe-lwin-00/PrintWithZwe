import type { SiteConfig } from "@/types/config";

export const defaultSiteConfig: SiteConfig = {
  contact: {
    phoneNumber: "+959787238201",
    telegramUsername: "zwe_ll",
    whatsappNumber: "959787238201",
    messengerPageId: "printwithzwe",
    locationUrl: "https://maps.app.goo.gl/Fq5xDbNXvTAWbB8t5",
  },
  pricing: {
    currency: "MMK",
    locale: "en-MM",
    baseFee: 4000,
    machineRatePerHour: 1200,
    materials: [
      { id: "pla", label: "PLA", ratePerGram: 300 },
      { id: "petg", label: "PETG", ratePerGram: 320 },
      { id: "abs", label: "ABS", ratePerGram: 340 },
      { id: "tpu", label: "TPU", ratePerGram: 400 },
      { id: "multi-color", label: "Multi-Color (AMS)", ratePerGram: 400 },
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
