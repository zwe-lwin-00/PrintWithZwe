import my from "@/locales/my.json";

export type TranslationDictionary = typeof my;

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
  return my;
}

export function translate(key: string, params?: TranslationParams): string {
  const value = resolvePath(my, key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  return key;
}

export function translateArray(key: string): string[] {
  const value = resolvePath(my, key);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
