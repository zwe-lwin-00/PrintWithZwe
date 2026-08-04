import type { MaterialRateConfig, SiteConfig, SiteConfigPatch } from "@/types/config";

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

export function mergeSiteConfig(
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
    const { materials, ...pricingPatch } = patch.pricing;
    result.pricing = { ...result.pricing, ...pricingPatch };

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
