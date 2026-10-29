import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultSiteConfig } from "@/config/defaults";
import { loadSiteConfig } from "@/config/loadSiteConfig";
import { fetchPricing } from "@/api/catalogClient";
import type { SiteConfig } from "@/types/config";

interface ConfigContextValue {
  config: SiteConfig;
  isLoading: boolean;
  pricingError: string | null;
  reloadConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const reloadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loadSiteConfig();
      setConfig(next);
      const pricing = await fetchPricing();
      setConfig({ ...next, pricing });
      setPricingError(null);
    } catch {
      setPricingError("Current pricing is unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadConfig();
    const refresh = () => { void reloadConfig(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [reloadConfig]);

  const value = useMemo(
    () => ({ config, isLoading, pricingError, reloadConfig }),
    [config, isLoading, pricingError, reloadConfig],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useSiteConfig must be used within ConfigProvider");
  }
  return context;
}
