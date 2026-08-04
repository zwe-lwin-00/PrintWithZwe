export type MaterialId = "pla" | "petg" | "abs" | "tpu" | "multi-color";

export interface MaterialRate {
  id: MaterialId;
  label: string;
  ratePerGram: number;
}

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

export interface CalculatorFieldErrors {
  weightGrams?: string;
  printHours?: string;
}
