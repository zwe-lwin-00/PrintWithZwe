import type { PricingConfig } from "@/types/config";
import type {
  BaseMaterialId,
  ColorCount,
  PriceBreakdown,
  PriceEstimateInput,
} from "@/types/pricing";

/** Extra MMK per gram for AMS multi-color waste/time (same material only). */
export const COLOR_SURCHARGE_PER_GRAM: Record<ColorCount, number> = {
  1: 0,
  2: 50,
  3: 90,
  4: 120,
};

export const BASE_MATERIAL_IDS: BaseMaterialId[] = ["pla", "petg", "abs", "tpu"];

export function isBaseMaterialId(value: string): value is BaseMaterialId {
  return BASE_MATERIAL_IDS.includes(value as BaseMaterialId);
}

export function isColorCount(value: number): value is ColorCount {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function getMaterialRate(pricing: PricingConfig, materialId: BaseMaterialId) {
  return (
    pricing.materials.find((material) => material.id === materialId) ??
    pricing.materials.find((material) => material.id === "pla") ??
    pricing.materials[0]
  );
}

export function effectiveRatePerGram(
  pricing: PricingConfig,
  materialId: BaseMaterialId,
  colorCount: ColorCount,
): number {
  const material = getMaterialRate(pricing, materialId);
  return material.ratePerGram + COLOR_SURCHARGE_PER_GRAM[colorCount];
}

export function calculatePrice(
  input: PriceEstimateInput,
  pricing: PricingConfig,
): PriceBreakdown {
  const ratePerGram = effectiveRatePerGram(
    pricing,
    input.materialId,
    input.colorCount,
  );
  const materialCost = input.weightGrams * ratePerGram;
  const machineCost = input.printHours * pricing.machineRatePerHour;

  return {
    materialCost,
    machineCost,
    baseFee: pricing.baseFee,
    ratePerGram,
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
): { materialId: BaseMaterialId; colorCount: ColorCount } | null {
  if (!value) return null;
  if (value === "multi-color") {
    return { materialId: "pla", colorCount: 4 };
  }
  if (!isBaseMaterialId(value)) return null;
  const match = pricing.materials.find((material) => material.id === value);
  if (!match) return null;
  return { materialId: value, colorCount: 1 };
}

export function getDefaultMaterialId(pricing: PricingConfig): BaseMaterialId {
  const first = pricing.materials.find((material) =>
    isBaseMaterialId(material.id),
  );
  return first?.id as BaseMaterialId | undefined ?? "pla";
}
