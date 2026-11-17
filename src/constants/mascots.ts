export type MascotType = "coconut" | "oil-drop" | "peanut" | "sesame" | "leaf";

export interface MascotInfo {
  id: MascotType;
  name: string;
  nickname: string;
  title: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgPastel: string;
  image: string;
  svgFallback: string;
  dialogues: string[];
}

export const MASCOTS: Record<MascotType, MascotInfo> = {
  coconut: {
    id: "coconut",
    name: "Coco",
    nickname: "Coco the Coconut",
    title: "Fresh & Nourishing",
    description: "Sun-dried in coastal groves, pressed gently for pure tropical clarity.",
    primaryColor: "#2F5A32",
    accentColor: "#8EDBD0",
    bgPastel: "#D8F3EC",
    image: "/assets/healargo/mascots/coconut-mascot.webp",
    svgFallback: "/assets/healargo/mascots/coconut-mascot.svg",
    dialogues: [
      "Pure sunshine in every drop!",
      "Naturally cold-pressed with love!",
      "Fresh coconut goodness!",
    ],
  },
  "oil-drop": {
    id: "oil-drop",
    name: "Droppy",
    nickname: "Droppy the Golden Drop",
    title: "Pure Golden Essence",
    description: "Cold-pressed golden drop full of natural vitamins and wholesome aroma.",
    primaryColor: "#C4921A",
    accentColor: "#FFD45A",
    bgPastel: "#FFF0B8",
    image: "/assets/healargo/mascots/oil-drop-mascot.webp",
    svgFallback: "/assets/healargo/mascots/oil-drop-mascot.svg",
    dialogues: [
      "Goodness, naturally!",
      "100% pure cold-pressed!",
      "Happy everyday cooking!",
    ],
  },
  peanut: {
    id: "peanut",
    name: "Nutty",
    nickname: "Nutty the Groundnut",
    title: "Rich & Nutty",
    description: "Selected farm-grown groundnuts delivering rich golden traditional flavor.",
    primaryColor: "#FF8066",
    accentColor: "#FFE0D4",
    bgPastel: "#FFE0D4",
    image: "/assets/healargo/mascots/peanut-mascot.webp",
    svgFallback: "/assets/healargo/mascots/peanut-mascot.svg",
    dialogues: [
      "Nutty and full of energy!",
      "Traditional aroma for your kitchen!",
      "Farm-fresh harvest!",
    ],
  },
  sesame: {
    id: "sesame",
    name: "Sesamy",
    nickname: "Sesamy the Sesame Seed",
    title: "Authentic & Pure",
    description: "Tiny ancient seeds pressed with natural palm jaggery for authentic sweetness.",
    primaryColor: "#4F8A45",
    accentColor: "#FFD45A",
    bgPastel: "#FFF8E9",
    image: "/assets/healargo/mascots/sesame-mascot.webp",
    svgFallback: "/assets/healargo/mascots/sesame-mascot.svg",
    dialogues: [
      "Small seed, giant nutrition!",
      "Grandmother's secret aroma!",
      "Honest cold-pressed purity!",
    ],
  },
  leaf: {
    id: "leaf",
    name: "Leafy",
    nickname: "Leafy the Nature Sprout",
    title: "Goodness Guardian",
    description: "The playful spirit of farm-grown harvests and organic agro care.",
    primaryColor: "#4F8A45",
    accentColor: "#DDECCF",
    bgPastel: "#DDECCF",
    image: "/assets/healargo/mascots/leaf-mascot.webp",
    svgFallback: "/assets/healargo/mascots/leaf-mascot.svg",
    dialogues: [
      "Bring nature into every day!",
      "Zero chemical shortcuts!",
      "Pure botanical wellness!",
    ],
  },
};
