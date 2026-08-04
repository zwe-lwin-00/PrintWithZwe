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
import type { SiteConfig } from "@/types/config";

interface ConfigContextValue {
  config: SiteConfig;
  isLoading: boolean;
  reloadConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [isLoading, setIsLoading] = useState(true);

  const reloadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loadSiteConfig();
      setConfig(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadConfig();
  }, [reloadConfig]);

  const value = useMemo(
    () => ({ config, isLoading, reloadConfig }),
    [config, isLoading, reloadConfig],
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
