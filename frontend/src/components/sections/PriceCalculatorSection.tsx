import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, RefreshCw } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import {
  BASE_MATERIAL_IDS,
  calculatePrice,
  effectiveRatePerGram,
  formatPrice,
  getDefaultMaterialId,
  isBaseMaterialId,
  isColorCount,
  parseMaterialFromQuery,
} from "@/lib/pricing";
import { fadeUp, springTransition } from "@/lib/motion";
import type { BaseMaterialId, ColorCount } from "@/types/pricing";

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none ring-primary transition focus:ring-2 sm:text-sm sm:py-2";

const COLOR_OPTIONS: ColorCount[] = [1, 2, 3, 4];

function isValidInput(
  weight: number,
  hours: number,
  weightRaw: string,
  hoursRaw: string,
) {
  if (weightRaw === "" && hoursRaw === "") return false;
  if (weightRaw !== "" && (Number.isNaN(weight) || weight < 0)) return false;
  if (hoursRaw !== "" && (Number.isNaN(hours) || hours < 0)) return false;
  return weight > 0 || hours > 0;
}

export function PriceCalculatorSection() {
  const { config, isLoading, pricingError, reloadConfig } = useSiteConfig();
  const { pricing } = config;
  const { t } = useTranslation();

  const [materialId, setMaterialId] = useState<BaseMaterialId>(() =>
    getDefaultMaterialId(pricing),
  );
  const [colorCount, setColorCount] = useState<ColorCount>(1);
  const [weightGrams, setWeightGrams] = useState("");
  const [printHours, setPrintHours] = useState("");

  const selectableMaterials = useMemo(
    () =>
      pricing.materials.filter((material) => isBaseMaterialId(material.id)),
    [pricing.materials],
  );

  useEffect(() => {
    setMaterialId((current) => {
      const exists = selectableMaterials.some((material) => material.id === current);
      return exists ? current : getDefaultMaterialId(pricing);
    });
  }, [pricing, selectableMaterials]);

  useEffect(() => {
    const syncMaterial = () => {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = parseMaterialFromQuery(params.get("material"), pricing);
      if (fromQuery) {
        setMaterialId(fromQuery.materialId);
        setColorCount(fromQuery.colorCount);
      }
    };

    syncMaterial();
    window.addEventListener("popstate", syncMaterial);
    return () => window.removeEventListener("popstate", syncMaterial);
  }, [pricing]);

  const weight = weightGrams === "" ? 0 : Number(weightGrams);
  const hours = printHours === "" ? 0 : Number(printHours);
  const isValid = !isLoading && !pricingError && isValidInput(weight, hours, weightGrams, printHours);
  const ratePerGram = effectiveRatePerGram(pricing, materialId, colorCount);

  const breakdown = useMemo(() => {
    if (!isValid) return null;
    return calculatePrice(
      {
        materialId,
        colorCount,
        weightGrams: Math.max(weight, 0),
        printHours: Math.max(hours, 0),
      },
      pricing,
    );
  }, [materialId, colorCount, weight, hours, isValid, pricing]);

  const materialLabel = t(`materials.${materialId}`);
  const colorsLabel = t("calculator.colorOption", { count: colorCount });

  return (
    <section
      id="calculator"
      className="relative overflow-hidden border-y border-border/60 py-16 sm:py-24 lg:py-32"
    >
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:h-14 sm:w-14">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl lg:text-4xl">
            {t("calculator.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("calculator.description")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0.1}
          className="mx-auto mt-10 max-w-xl"
        >
          <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-elevated backdrop-blur-sm sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="calc-material" className="text-sm font-medium">
                    {t("calculator.material")}
                  </label>
                  <select
                    id="calc-material"
                    disabled={isLoading || !!pricingError}
                    value={materialId}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (isBaseMaterialId(next)) setMaterialId(next);
                    }}
                    className={inputClassName}
                  >
                    {(selectableMaterials.length > 0
                      ? selectableMaterials
                      : BASE_MATERIAL_IDS.map((id) => ({ id, ratePerGram: 0 }))
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(`materials.${item.id}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="calc-colors" className="text-sm font-medium">
                    {t("calculator.colors")}
                  </label>
                  <select
                    id="calc-colors"
                    disabled={isLoading || !!pricingError}
                    value={colorCount}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (isColorCount(next)) setColorCount(next);
                    }}
                    className={inputClassName}
                  >
                    {COLOR_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {t("calculator.colorOption", { count })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="calc-weight" className="text-sm font-medium">
                    {t("calculator.weight")}
                  </label>
                  <input
                    id="calc-weight"
                    disabled={isLoading || !!pricingError}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    placeholder={t("calculator.weightPlaceholder")}
                    value={weightGrams}
                    onChange={(event) => setWeightGrams(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="calc-hours" className="text-sm font-medium">
                    {t("calculator.printTime")}
                  </label>
                  <input
                    id="calc-hours"
                    disabled={isLoading || !!pricingError}
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    placeholder={t("calculator.hoursPlaceholder")}
                    value={printHours}
                    onChange={(event) => setPrintHours(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t("calculator.hint")}</p>
            </div>

            <AnimatePresence mode="wait">
              {breakdown ? (
                <motion.div
                  key={`${breakdown.total}-${materialId}-${colorCount}-${pricing.baseFee}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={springTransition}
                  className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    {t("calculator.estimatedTotal")}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatPrice(breakdown.total, pricing)}
                  </p>

                  <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                    <div className="flex flex-col gap-0.5 xs:flex-row xs:justify-between xs:gap-4">
                      <dt className="min-w-0 text-muted-foreground">
                        {t("calculator.materialLine", {
                          label: materialLabel,
                          colors: colorsLabel,
                          rate: formatPrice(ratePerGram, pricing),
                        })}
                      </dt>
                      <dd className="shrink-0 font-medium xs:text-right">
                        {formatPrice(breakdown.materialCost, pricing)}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5 xs:flex-row xs:justify-between xs:gap-4">
                      <dt className="min-w-0 text-muted-foreground">
                        {t("calculator.machineLine", {
                          rate: formatPrice(pricing.machineRatePerHour, pricing),
                        })}
                      </dt>
                      <dd className="shrink-0 font-medium xs:text-right">
                        {formatPrice(breakdown.machineCost, pricing)}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5 xs:flex-row xs:justify-between xs:gap-4">
                      <dt className="text-muted-foreground">{t("calculator.baseFee")}</dt>
                      <dd className="shrink-0 font-medium xs:text-right">
                        {formatPrice(breakdown.baseFee, pricing)}
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center"
                >
                  <p className="text-sm font-medium text-foreground">
                    {pricingError ?? (isLoading ? t("calculator.loadingRates") : t("calculator.emptyStateTitle"))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {!pricingError && !isLoading ? t("calculator.emptyStateHint") : ""}
                  </p>
                  {pricingError && <ButtonRetry label={t("calculator.retry")} onRetry={() => void reloadConfig()} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function ButtonRetry({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted/50"><RefreshCw className="h-4 w-4" />{label}</button>;
}
