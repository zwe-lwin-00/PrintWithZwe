import en from "@/locales/en.json";

export type TranslationDictionary = typeof en;

export type TranslationParams = Record<string, string | number>;

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(params[key] ?? `{{${key}}}`),
  );
}

export function getDictionary(): TranslationDictionary {
  return en;
}

export function translate(key: string, params?: TranslationParams): string {
  const value = resolvePath(en, key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  return key;
}

export function translateArray(key: string): string[] {
  const value = resolvePath(en, key);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function translateObject<T extends Record<string, unknown>>(
  key: string,
): T | undefined {
  const value = resolvePath(en, key);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return undefined;
}
