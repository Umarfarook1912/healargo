"use client";

import Image from "next/image";
import { MASCOTS, type MascotType } from "@/constants/mascots";

export interface ProductCardMascotProps {
  productName: string;
}

export function detectMascotFromProductName(name: string): MascotType {
  const s = name.toLowerCase();
  if (s.includes("coconut") || s.includes("thengai")) return "coconut";
  if (s.includes("sesame") || s.includes("gingelly") || s.includes("til")) return "sesame";
  if (s.includes("groundnut") || s.includes("peanut") || s.includes("kadalai")) return "peanut";
  if (s.includes("ghee") || s.includes("mustard") || s.includes("castor") || s.includes("honey")) return "oil-drop";
  return "leaf";
}

export function ProductCardMascot({ productName }: ProductCardMascotProps) {
  const mascotKey = detectMascotFromProductName(productName);
  const mascot = MASCOTS[mascotKey];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-3 -top-5 z-20 h-12 w-12 sm:h-14 sm:w-14 transition-all duration-400 ease-out transform translate-y-3 scale-75 opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 drop-shadow-md"
    >
      <div className="relative h-full w-full animate-bounce-subtle">
        <Image
          src={mascot.image}
          alt={mascot.name}
          width={56}
          height={56}
          unoptimized
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
