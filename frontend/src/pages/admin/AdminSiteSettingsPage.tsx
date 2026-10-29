import { useEffect, useState, type FormEvent } from "react";
import { RefreshCw, RotateCcw, Save } from "lucide-react";
import { fetchSiteConfig, saveSiteConfig } from "@/api/catalogClient";
import { Button } from "@/components/ui/Button";
import { useSiteConfig } from "@/context/ConfigProvider";
import type { SiteConfig } from "@/types/config";

const inputClassName = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-primary sm:text-sm";
type EditableConfig = Pick<SiteConfig, "brand" | "contact">;

function fieldsFromConfig(config: EditableConfig): Record<string, string> {
  return {
    brandName: config.brand.name,
    brandTagline: config.brand.tagline,
    heroBadge: config.brand.heroBadge,
    heroBadgeShort: config.brand.heroBadgeShort,
    phoneNumber: config.contact.phoneNumber,
    telegramUsername: config.contact.telegramUsername,
    whatsappNumber: config.contact.whatsappNumber,
    messengerPageId: config.contact.messengerPageId,
    locationUrl: config.contact.locationUrl,
  };
}

export function AdminSiteSettingsPage() {
  const { reloadConfig } = useSiteConfig();
  const [savedConfig, setSavedConfig] = useState<EditableConfig | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const current = await fetchSiteConfig(true);
      setSavedConfig(current); setFields(fieldsFromConfig(current));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load site settings.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const update = (key: string, value: string) => { setFields(current => ({ ...current, [key]: value })); setSaved(false); };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setSaved(false);
    if (!fields.brandName?.trim() || !fields.brandTagline?.trim() || !fields.heroBadge?.trim() || !fields.heroBadgeShort?.trim() || !fields.phoneNumber?.trim() || !fields.telegramUsername?.trim()) {
      setError("Complete the required brand and contact fields."); return;
    }
    setSaving(true);
    try {
      const updated = await saveSiteConfig({
        brand: { name: fields.brandName.trim(), tagline: fields.brandTagline.trim(), heroBadge: fields.heroBadge.trim(), heroBadgeShort: fields.heroBadgeShort.trim() },
        contact: { phoneNumber: fields.phoneNumber.trim(), telegramUsername: fields.telegramUsername.trim().replace(/^@/, ""), whatsappNumber: fields.whatsappNumber.trim(), messengerPageId: fields.messengerPageId.trim(), locationUrl: fields.locationUrl.trim() },
      });
      setSavedConfig(updated); setFields(fieldsFromConfig(updated)); await reloadConfig(); setSaved(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save site settings."); }
    finally { setSaving(false); }
  };

  const changed = savedConfig !== null && JSON.stringify(fields) !== JSON.stringify(fieldsFromConfig(savedConfig));
  const field = (key: string, label: string, options: { maxLength: number; required?: boolean; help?: string } = { maxLength: 80 }) => (
    <div key={key}>
      <label htmlFor={`setting-${key}`} className="mb-2 block text-sm font-medium">{label}</label>
      <input id={`setting-${key}`} value={fields[key] ?? ""} onChange={event => update(key, event.target.value)} maxLength={options.maxLength} required={options.required} className={inputClassName} />
      {options.help && <p className="mt-1 text-xs text-muted-foreground">{options.help}</p>}
    </div>
  );

  return <div className="mx-auto max-w-3xl">
    <header className="mb-8"><h1 className="text-2xl font-bold">Site information</h1><p className="mt-1 text-sm text-muted-foreground">Public brand and contact details.</p></header>
    {error && <p role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    {loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading site information...</p> : (
      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={saving} className="space-y-5"><section><h2 className="mb-4 text-base font-semibold">Brand</h2><div className="space-y-5 border-y border-border py-5">
          {field("brandName", "Brand name", { maxLength: 80, required: true })}
          {field("brandTagline", "Tagline", { maxLength: 180, required: true })}
          {field("heroBadge", "Hero badge", { maxLength: 140, required: true })}
          {field("heroBadgeShort", "Short hero badge", { maxLength: 80, required: true })}
        </div></section><section><h2 className="mb-4 text-base font-semibold">Contact channels</h2><div className="space-y-5 border-y border-border py-5">
          {field("phoneNumber", "Phone number", { maxLength: 30, required: true })}
          {field("telegramUsername", "Telegram username", { maxLength: 40, required: true, help: "Enter the username without @." })}
          {field("whatsappNumber", "WhatsApp number", { maxLength: 30, help: "Include country code, without + or spaces." })}
          {field("messengerPageId", "Messenger page ID", { maxLength: 80 })}
          {field("locationUrl", "Shop location map URL", { maxLength: 2048, required: true, help: "Use a Google Maps link." })}
        </div></section></fieldset>
        <div className="flex flex-wrap items-center justify-between gap-4"><span role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{saved ? "Site information saved." : ""}</span><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={saving || !changed} onClick={() => { if (savedConfig) setFields(fieldsFromConfig(savedConfig)); setError(null); setSaved(false); }}><RotateCcw className="h-4 w-4" />Reset changes</Button><Button type="submit" disabled={saving || !changed}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save information"}</Button></div></div>
      </form>
    )}
    {!loading && !savedConfig && <Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Retry</Button>}
  </div>;
}