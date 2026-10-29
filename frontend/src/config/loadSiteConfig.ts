import { defaultSiteConfig, SITE_CONFIG_URL } from "@/config/defaults";
import { applyEnvOverrides } from "@/config/envOverrides";
import { mergeSiteConfigDeep } from "@/config/mergeConfig";
import type { SiteConfig } from "@/types/config";
import { fetchSiteConfig } from "@/api/catalogClient";

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

  try {
    const remote = await fetchSiteConfig();
    config = { ...config, brand: remote.brand, contact: remote.contact };
  } catch {
    // The API is unavailable during static/offline development; defaults remain visible.
  }
  return applyEnvOverrides(config);
}
