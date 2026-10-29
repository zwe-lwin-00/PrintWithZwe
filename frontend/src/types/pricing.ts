export type MaterialId = "pla" | "petg" | "abs" | "tpu" | "multi-color";

export interface PriceEstimateInput {
  materialId: MaterialId;
  weightGrams: number;
  printHours: number;
}

export interface PriceBreakdown {
  materialCost: number;
  machineCost: number;
  baseFee: number;
  total: number;
}

