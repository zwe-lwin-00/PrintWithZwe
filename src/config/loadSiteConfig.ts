import { defaultSiteConfig, SITE_CONFIG_URL } from "@/config/defaults";
import { applyEnvOverrides } from "@/config/envOverrides";
import { mergeSiteConfigDeep } from "@/config/mergeConfig";
import type { SiteConfig } from "@/types/config";

export async function loadSiteConfig(): Promise<SiteConfig> {
  let config = structuredClone(defaultSiteConfig);

  try {
    const response = await fetch(SITE_CONFIG_URL, {
      cache: "no-store",
    });

    if (response.ok) {
      const remote = (await response.json()) as unknown;
      config = mergeSiteConfigDeep(config, remote);
    }
  } catch {
    // Offline or missing file — defaults are used.
  }

  return applyEnvOverrides(config);
}
