import type { MaterialId } from "@/types/pricing";

export interface ContactConfig {
  phoneNumber: string;
  telegramUsername: string;
  whatsappNumber: string;
  messengerPageId: string;
}

export interface MaterialRateConfig {
  id: MaterialId;
  label: string;
  ratePerGram: number;
}

export interface PricingConfig {
  currency: string;
  locale: string;
  baseFee: number;
  machineRatePerHour: number;
  materials: MaterialRateConfig[];
}

export interface BrandConfig {
  name: string;
  tagline: string;
  heroBadge: string;
  heroBadgeShort: string;
}

export interface SiteConfig {
  contact: ContactConfig;
  pricing: PricingConfig;
  brand: BrandConfig;
}

export type SiteConfigPatch = DeepPartial<SiteConfig>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
