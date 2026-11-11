export type MaterialId = "pla" | "petg" | "abs" | "tpu" | "multi-color";

/** Base filament materials shown in the estimator (same-material AMS colors). */
export type BaseMaterialId = Exclude<MaterialId, "multi-color">;

export type ColorCount = 1 | 2 | 3 | 4;

export interface PriceEstimateInput {
  materialId: BaseMaterialId;
  colorCount: ColorCount;
  weightGrams: number;
  printHours: number;
}

export interface PriceBreakdown {
  materialCost: number;
  machineCost: number;
  baseFee: number;
  ratePerGram: number;
  total: number;
}
