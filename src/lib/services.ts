import { Box, Layers3, Zap } from "lucide-react";
import type { Service } from "@/types/service";

export const services: Service[] = [
  {
    id: "custom-printing",
    title: "Custom 3D Printing",
    description:
      "High-quality prints in PLA, PETG, ABS, and TPU — tuned profiles for strength, finish, and function.",
    icon: Box,
    features: ["PLA · PETG · ABS · TPU", "0.2mm precision layers", "Functional & decorative parts"],
    defaultMaterial: "pla",
  },
  {
    id: "multi-color",    title: "Multi-Color Printing",
    description:
      "Vivid multi-material prints with AMS support — perfect for logos, labels, and eye-catching models.",
    icon: Layers3,
    features: ["AMS multi-filament", "Seamless color swaps", "Brand-ready prototypes"],
    defaultMaterial: "multi-color",
  },
  {
    id: "prototyping",    title: "Rapid Prototyping & CAD",
    description:
      "Fast iteration from idea to physical part, with CAD design support when you need a file built from scratch.",
    icon: Zap,
    features: ["Same-week turnaround", "Design-to-print support", "Iterative fit testing"],
    defaultMaterial: "petg",
  },
];