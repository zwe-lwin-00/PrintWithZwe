import type { LucideIcon } from "lucide-react";
import type { MaterialId } from "@/types/pricing";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  defaultMaterial: MaterialId;
}