import type {
  ColorSurchargesPerGram,
  MaterialRateConfig,
  SiteConfig,
  SiteConfigPatch,
} from "@/types/config";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidMaterial(material: unknown): material is MaterialRateConfig {
  if (!material || typeof material !== "object") return false;
  const candidate = material as Partial<MaterialRateConfig>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    Number.isFinite(candidate.ratePerGram) &&
    (candidate.ratePerGram ?? -1) >= 0
  );
}

function isValidColorSurcharges(
  value: unknown,
): value is ColorSurchargesPerGram {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ColorSurchargesPerGram>;
  return (["1", "2", "3", "4"] as const).every(
    (key) => Number.isFinite(candidate[key]) && (candidate[key] ?? -1) >= 0,
  );
}

function mergeSiteConfig(
  base: SiteConfig,
  patch: SiteConfigPatch,
): SiteConfig {
  const result: SiteConfig = structuredClone(base);

  if (patch.contact) {
    result.contact = { ...result.contact, ...patch.contact };
  }

  if (patch.brand) {
    result.brand = { ...result.brand, ...patch.brand };
  }

  if (patch.pricing) {
    const { materials, colorSurchargesPerGram, ...pricingPatch } = patch.pricing;
    result.pricing = {
      ...result.pricing,
      ...pricingPatch,
      colorSurchargesPerGram: result.pricing.colorSurchargesPerGram,
    };

    if (isValidColorSurcharges(colorSurchargesPerGram)) {
      result.pricing.colorSurchargesPerGram = colorSurchargesPerGram;
    }

    if (Array.isArray(materials) && materials.length > 0) {
      const validMaterials = materials.filter(isValidMaterial);
      if (validMaterials.length > 0) {
        result.pricing.materials = validMaterials;
      }
    }
  }

  return result;
}

export function mergeSiteConfigDeep(
  base: SiteConfig,
  patch: unknown,
): SiteConfig {
  if (!isPlainObject(patch)) return base;

  const typedPatch = patch as SiteConfigPatch;
  return mergeSiteConfig(base, typedPatch);
}
