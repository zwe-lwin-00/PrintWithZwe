import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  getDictionary,
  translate,
  translateArray,
  type TranslationParams,
} from "@/lib/i18n";

interface LocaleContextValue {
  t: (key: string, params?: TranslationParams) => string;
  tArray: (key: string) => string[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentMeta() {
  const dict = getDictionary();
  document.documentElement.lang = "en";
  document.documentElement.dataset.locale = "en";
  document.title = dict.meta.title;

  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", dict.meta.description);
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyDocumentMeta();
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      t: (key, params) => translate(key, params),
      tArray: (key) => translateArray(key),
    }),
    [],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useTranslation must be used within LocaleProvider");
  }
  return context;
}
