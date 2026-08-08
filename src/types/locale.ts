export type Locale = "en" | "mm";

export const LOCALE_STORAGE_KEY = "print-with-zwe-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  mm: "MM",
};

/** ISO 639-1 code for document `lang` attribute */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  mm: "my",
};
