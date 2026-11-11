import { useEffect, useState, type FormEvent } from "react";
import { RefreshCw, RotateCcw, Save } from "lucide-react";
import { fetchPricing, savePricing } from "@/api/catalogClient";
import { Button } from "@/components/ui/Button";
import { useSiteConfig } from "@/context/ConfigProvider";
import { BASE_MATERIAL_IDS, isBaseMaterialId } from "@/lib/pricing";
import type { PricingConfig } from "@/types/config";

const inputClassName = "h-11 w-full rounded-lg border border-border bg-background px-3 text-right text-base outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 sm:text-sm";

function fieldsFromPricing(pricing: PricingConfig): Record<string, string> {
  return {
    baseFee: String(pricing.baseFee),
    machineRatePerHour: String(pricing.machineRatePerHour),
    color2: String(pricing.colorSurchargesPerGram["2"]),
    color3: String(pricing.colorSurchargesPerGram["3"]),
    color4: String(pricing.colorSurchargesPerGram["4"]),
    ...Object.fromEntries(
      pricing.materials
        .filter((material) => isBaseMaterialId(material.id))
        .map((material) => [material.id, String(material.ratePerGram)]),
    ),
  };
}

export function AdminPricingPage() {
  const { reloadConfig } = useSiteConfig();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await fetchPricing(true);
      setPricing(current);
      setFields(fieldsFromPricing(current));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateField = (key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pricing) return;
    setSaved(false);
    setError(null);
    const invalid = Object.entries(fields).some(([, value]) => {
      const amount = Number(value);
      return value.trim() === "" || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000;
    });
    if (invalid) {
      setError("Enter a valid, non-negative amount for every rate.");
      return;
    }
    setSaving(true);
    try {
      const color2 = Number(fields.color2);
      const color3 = Number(fields.color3);
      const color4 = Number(fields.color4);
      const plaRate = Number(fields.pla);
      const updated = await savePricing({
        ...pricing,
        baseFee: Number(fields.baseFee),
        machineRatePerHour: Number(fields.machineRatePerHour),
        colorSurchargesPerGram: {
          "1": 0,
          "2": color2,
          "3": color3,
          "4": color4,
        },
        materials: pricing.materials.map((material) => {
          if (material.id === "multi-color") {
            return { ...material, ratePerGram: plaRate + color4 };
          }
          if (isBaseMaterialId(material.id)) {
            return { ...material, ratePerGram: Number(fields[material.id]) };
          }
          return material;
        }),
      });
      setPricing(updated);
      setFields(fieldsFromPricing(updated));
      await reloadConfig();
      setSaved(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save pricing.");
    } finally {
      setSaving(false);
    }
  };

  const changed = pricing !== null && JSON.stringify(fields) !== JSON.stringify(fieldsFromPricing(pricing));
  const baseMaterials = pricing?.materials.filter((material) => isBaseMaterialId(material.id))
    ?? BASE_MATERIAL_IDS.map((id) => ({ id, label: id.toUpperCase(), ratePerGram: 0 }));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold">Estimator pricing</h1>
        {pricing && <span className="text-sm text-muted-foreground">{pricing.currency}</span>}
      </header>

      {error && <p role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading pricing...</p> : !pricing ? (
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Retry</Button>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} className="space-y-8">
            <section>
              <h2 className="mb-4 text-base font-semibold">Printing fees</h2>
              <div className="grid gap-5 border-y border-border py-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="pricing-base-fee" className="mb-2 block text-sm font-medium">Base fee (MMK)</label>
                  <input id="pricing-base-fee" type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" required
                    value={fields.baseFee} onChange={(event) => updateField("baseFee", event.target.value)} className={inputClassName} />
                </div>
                <div>
                  <label htmlFor="pricing-machine-rate" className="mb-2 block text-sm font-medium">Machine rate (MMK/hour)</label>
                  <input id="pricing-machine-rate" type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" required
                    value={fields.machineRatePerHour} onChange={(event) => updateField("machineRatePerHour", event.target.value)} className={inputClassName} />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="text-base font-semibold">1-color material rates</h2>
                <span className="text-xs text-muted-foreground">MMK / gram</span>
              </div>
              <div className="divide-y divide-border border-y border-border">
                {baseMaterials.map((material) => (
                  <div key={material.id} className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,12rem)] items-center gap-4 py-3">
                    <label htmlFor={`pricing-${material.id}`} className="min-w-0 text-sm font-medium">{material.label}</label>
                    <input id={`pricing-${material.id}`} type="number" min="0" max="1000000" step="0.01" inputMode="decimal" required
                      aria-label={`${material.label} rate per gram`} value={fields[material.id] ?? ""}
                      onChange={(event) => updateField(material.id, event.target.value)} className={inputClassName} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <h2 className="text-base font-semibold">AMS color extras</h2>
                <span className="text-xs text-muted-foreground">MMK / gram added</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Added on top of the 1-color material rate. 1-color has no extra.
              </p>
              <div className="divide-y divide-border border-y border-border">
                {([
                  ["color2", "2-color extra"],
                  ["color3", "3-color extra"],
                  ["color4", "4-color extra"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,12rem)] items-center gap-4 py-3">
                    <label htmlFor={`pricing-${key}`} className="min-w-0 text-sm font-medium">{label}</label>
                    <input id={`pricing-${key}`} type="number" min="0" max="1000000" step="0.01" inputMode="decimal" required
                      value={fields[key] ?? ""} onChange={(event) => updateField(key, event.target.value)} className={inputClassName} />
                  </div>
                ))}
              </div>
            </section>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <span role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{saved ? "Pricing saved." : ""}</span>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={saving || !changed} onClick={() => {
                setFields(fieldsFromPricing(pricing)); setError(null); setSaved(false);
              }}><RotateCcw className="h-4 w-4" />Reset changes</Button>
              <Button type="submit" disabled={saving || !changed}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save pricing"}</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
