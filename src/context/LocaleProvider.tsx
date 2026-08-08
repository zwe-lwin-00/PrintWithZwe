import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDictionary,
  translate,
  translateArray,
  type TranslationParams,
} from "@/lib/i18n";
import {
  LOCALE_HTML_LANG,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/types/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
  tArray: (key: string) => string[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "mm" ? stored : null;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("my") || lang.startsWith("mm")) return "mm";
  return "en";
}

function applyLocale(locale: Locale) {
  const htmlLang = LOCALE_HTML_LANG[locale];
  document.documentElement.lang = htmlLang;
  document.documentElement.dataset.locale = locale;

  const dict = getDictionary(locale);
  document.title = dict.meta.title;

  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", dict.meta.description);
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => getStoredLocale() ?? detectBrowserLocale(),
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    applyLocale(next);
  }, []);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      tArray: (key) => translateArray(locale, key),
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useTranslation() {
  return useLocale();
}
