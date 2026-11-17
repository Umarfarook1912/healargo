"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MascotAvatar, type MascotAvatarProps } from "./MascotAvatar";
import { cn } from "@/lib/utils/cn";

export interface FloatingMascotProps extends MascotAvatarProps {
  floatDuration?: number;
  floatY?: number;
  floatRotate?: number;
  speechBubble?: string;
}

export function FloatingMascot({
  mascot,
  size = "md",
  floatDuration = 4,
  floatY = 10,
  floatRotate = 4,
  speechBubble,
  bubbleText,
  className,
  ...props
}: FloatingMascotProps) {
  const reduce = useReducedMotion();
  const effectiveBubble = speechBubble || bubbleText;

  return (
    <motion.div
      animate={
        reduce
          ? undefined
          : {
              y: [0, -floatY, 0],
              rotate: [-floatRotate, floatRotate, -floatRotate],
            }
      }
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }}
      className={cn("relative inline-block", className)}
    >
      <MascotAvatar
        mascot={mascot}
        size={size}
        animation="none"
        bubbleText={effectiveBubble}
        {...props}
      />
    </motion.div>
  );
}
