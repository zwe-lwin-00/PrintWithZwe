import type { PricingConfig } from "@/types/config";
import type {
  MaterialId,
  PriceBreakdown,
  PriceEstimateInput,
} from "@/types/pricing";

export function getMaterialRate(pricing: PricingConfig, materialId: MaterialId) {
  return (
    pricing.materials.find((material) => material.id === materialId) ??
    pricing.materials[0]
  );
}

export function calculatePrice(
  input: PriceEstimateInput,
  pricing: PricingConfig,
): PriceBreakdown {
  const material = getMaterialRate(pricing, input.materialId);
  const materialCost = input.weightGrams * material.ratePerGram;
  const machineCost = input.printHours * pricing.machineRatePerHour;

  return {
    materialCost,
    machineCost,
    baseFee: pricing.baseFee,
    total: materialCost + machineCost + pricing.baseFee,
  };
}

export function formatPrice(amount: number, pricing: PricingConfig): string {
  return new Intl.NumberFormat(pricing.locale, {
    style: "currency",
    currency: pricing.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseMaterialFromQuery(
  value: string | null,
  pricing: PricingConfig,
): MaterialId | null {
  if (!value) return null;
  const match = pricing.materials.find((material) => material.id === value);
  return match?.id ?? null;
}

export function getDefaultMaterialId(pricing: PricingConfig): MaterialId {
  return pricing.materials[0]?.id ?? "pla";
}
