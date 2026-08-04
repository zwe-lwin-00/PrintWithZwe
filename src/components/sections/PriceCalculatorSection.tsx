import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Info } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useSiteConfig } from "@/context/ConfigProvider";
import {
  calculatePrice,
  formatPrice,
  getDefaultMaterialId,
  getMaterialRate,
  parseMaterialFromQuery,
} from "@/lib/pricing";
import { fadeUp, springTransition } from "@/lib/motion";
import type { MaterialId } from "@/types/pricing";

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none ring-primary transition focus:ring-2 sm:text-sm sm:py-2";

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
  const { config } = useSiteConfig();
  const { pricing, contact } = config;

  const [materialId, setMaterialId] = useState<MaterialId>(() =>
    getDefaultMaterialId(pricing),
  );
  const [weightGrams, setWeightGrams] = useState("");
  const [printHours, setPrintHours] = useState("");

  useEffect(() => {
    setMaterialId((current) => {
      const exists = pricing.materials.some((material) => material.id === current);
      return exists ? current : getDefaultMaterialId(pricing);
    });
  }, [pricing]);

  useEffect(() => {
    const syncMaterial = () => {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = parseMaterialFromQuery(params.get("material"), pricing);
      if (fromQuery) setMaterialId(fromQuery);
    };

    syncMaterial();
    window.addEventListener("popstate", syncMaterial);
    return () => window.removeEventListener("popstate", syncMaterial);
  }, [pricing]);

  const weight = weightGrams === "" ? 0 : Number(weightGrams);
  const hours = printHours === "" ? 0 : Number(printHours);
  const isValid = isValidInput(weight, hours, weightGrams, printHours);

  const breakdown = useMemo(() => {
    if (!isValid) return null;
    return calculatePrice(
      {
        materialId,
        weightGrams: Math.max(weight, 0),
        printHours: Math.max(hours, 0),
      },
      pricing,
    );
  }, [materialId, weight, hours, isValid, pricing]);

  const material = getMaterialRate(pricing, materialId);

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
            Instant Price Estimator
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Rough estimate based on material, weight, and print time. Final price
            may vary with complexity, supports, and infill.
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
              <div className="space-y-2">
                <label htmlFor="calc-material" className="text-sm font-medium">
                  Material
                </label>
                <select
                  id="calc-material"
                  value={materialId}
                  onChange={(event) =>
                    setMaterialId(event.target.value as MaterialId)
                  }
                  className={inputClassName}
                >
                  {pricing.materials.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} — {formatPrice(item.ratePerGram, pricing)}/g
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="calc-weight" className="text-sm font-medium">
                    Weight (grams)
                  </label>
                  <input
                    id="calc-weight"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    placeholder="e.g. 50"
                    value={weightGrams}
                    onChange={(event) => setWeightGrams(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="calc-hours" className="text-sm font-medium">
                    Print time (hours)
                  </label>
                  <input
                    id="calc-hours"
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    placeholder="e.g. 3"
                    value={printHours}
                    onChange={(event) => setPrintHours(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Enter weight, print time, or both for a full estimate.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {breakdown && (
                <motion.div
                  key={`${breakdown.total}-${materialId}-${pricing.baseFee}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={springTransition}
                  className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Estimated total
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatPrice(breakdown.total, pricing)}
                  </p>

                  <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Material ({material.label})
                      </dt>
                      <dd className="font-medium">
                        {formatPrice(breakdown.materialCost, pricing)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Machine ({formatPrice(pricing.machineRatePerHour, pricing)}
                        /hr)
                      </dt>
                      <dd className="font-medium">
                        {formatPrice(breakdown.machineCost, pricing)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Base fee</dt>
                      <dd className="font-medium">
                        {formatPrice(breakdown.baseFee, pricing)}
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Formula: (Weight × Material rate) + (Hours ×{" "}
              {formatPrice(pricing.machineRatePerHour, pricing)}) +{" "}
              {formatPrice(pricing.baseFee, pricing)} base fee. Message us on
              Telegram @{contact.telegramUsername} for an exact quote.
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
