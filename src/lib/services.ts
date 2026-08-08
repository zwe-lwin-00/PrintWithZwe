import { Box, Layers3, Zap } from "lucide-react";
import type { MaterialId } from "@/types/pricing";

export interface ServiceDefinition {
  id: string;
  icon: typeof Box;
  defaultMaterial: MaterialId;
}

export const serviceDefinitions: ServiceDefinition[] = [
  {
    id: "custom-printing",
    icon: Box,
    defaultMaterial: "pla",
  },
  {
    id: "multi-color",
    icon: Layers3,
    defaultMaterial: "multi-color",
  },
  {
    id: "prototyping",
    icon: Zap,
    defaultMaterial: "petg",
  },
];
