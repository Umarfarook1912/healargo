"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MASCOTS, type MascotType } from "@/constants/mascots";
import { cn } from "@/lib/utils/cn";

export interface MascotAvatarProps {
  mascot: MascotType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  bubbleText?: string;
  showBubbleOnHover?: boolean;
  animation?: "bounce" | "float" | "wave" | "peek" | "roll" | "hop" | "none";
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: "w-10 h-10",
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-36 h-36",
};

const PIXEL_MAP = {
  xs: 40,
  sm: 56,
  md: 80,
  lg: 112,
  xl: 144,
};

export function MascotAvatar({
  mascot,
  size = "md",
  interactive = true,
  bubbleText,
  showBubbleOnHover = true,
  animation = "float",
  className,
  onClick,
}: MascotAvatarProps) {
  const info = MASCOTS[mascot];
  const reduce = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const dialogue =
    bubbleText ||
    info.dialogues[clickCount % info.dialogues.length];

  const getAnimationVariants = () => {
    if (reduce || animation === "none") return {};

    switch (animation) {
      case "bounce":
        return {
          animate: {
            y: [0, -10, 0],
            scaleY: [1, 0.95, 1],
            transition: {
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          },
        };
      case "wave":
        return {
          animate: {
            rotate: [-4, 4, -4],
            transition: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          },
        };
      case "roll":
        return {
          animate: {
            rotate: [-6, 6, -6],
            x: [-4, 4, -4],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          },
        };
      case "hop":
        return {
          animate: {
            y: [0, -14, 0],
            scale: [1, 1.05, 0.98, 1],
            transition: {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          },
        };
      case "float":
      default:
        return {
          animate: {
            y: [0, -6, 0],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          },
        };
    }
  };

  function handleClick() {
    if (!interactive) return;
    setClickCount((c) => c + 1);
    setIsHovered(true);
    onClick?.();
  }

  return (
    <div
      className={cn("relative inline-block select-none", className)}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Playful Speech Bubble */}
      {interactive && showBubbleOnHover && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.85 }}
          animate={
            isHovered
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 6, scale: 0.85 }
          }
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-2xl border border-[#263D2E]/10 bg-white/95 px-3 py-1 text-[11px] font-bold text-[#263D2E] shadow-md backdrop-blur-sm"
        >
          <span>{dialogue}</span>
          <span
            aria-hidden
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-b border-r border-[#263D2E]/10 bg-white"
          />
        </motion.div>
      )}

      {/* Mascot Character Image with Hover Spring Reaction */}
      <motion.div
        {...getAnimationVariants()}
        whileHover={
          interactive && !reduce
            ? { scale: 1.12, rotate: [-2, 4, 0], transition: { duration: 0.3 } }
            : undefined
        }
        whileTap={interactive && !reduce ? { scale: 0.92 } : undefined}
        onClick={handleClick}
        className={cn(
          "relative cursor-pointer drop-shadow-[0_8px_16px_rgba(38,61,46,0.14)] transition-transform duration-200",
          SIZE_MAP[size],
        )}
      >
        <Image
          src={info.image}
          alt={info.nickname}
          width={PIXEL_MAP[size]}
          height={PIXEL_MAP[size]}
          unoptimized
          className="h-full w-full object-contain"
        />
      </motion.div>
    </div>
  );
}
