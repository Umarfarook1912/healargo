"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { MASCOTS, type MascotType } from "@/constants/mascots";
import { cn } from "@/lib/utils/cn";

export interface CornerMascotProps {
  mascot?: MascotType;
  corner?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  delay?: number;
  autoDismissSeconds?: number;
  bubbleText?: string;
  className?: string;
}

const CORNER_INITIAL = {
  "bottom-left": { x: -160, y: 160, rotate: -20 },
  "bottom-right": { x: 160, y: 160, rotate: 20 },
  "top-left": { x: -160, y: -160, rotate: -15 },
  "top-right": { x: 160, y: -160, rotate: 15 },
};

const CORNER_ENTER = {
  "bottom-left": { x: 0, y: 0, rotate: 0 },
  "bottom-right": { x: 0, y: 0, rotate: 0 },
  "top-left": { x: 0, y: 0, rotate: 0 },
  "top-right": { x: 0, y: 0, rotate: 0 },
};

const CORNER_SETTLE = {
  "bottom-left": { x: -30, y: 30, rotate: -5 },
  "bottom-right": { x: 30, y: 30, rotate: 5 },
  "top-left": { x: -30, y: -30, rotate: -5 },
  "top-right": { x: 30, y: -30, rotate: 5 },
};

const CORNER_POSITION_CLASSES = {
  "bottom-left": "bottom-6 left-6 sm:bottom-8 sm:left-8",
  "bottom-right": "bottom-6 right-6 sm:bottom-8 sm:right-8",
  "top-left": "top-24 left-6 sm:top-28 sm:left-8",
  "top-right": "top-24 right-6 sm:top-28 sm:right-8",
};

export function CornerMascot({
  mascot = "coconut",
  corner = "bottom-left",
  delay = 1.2,
  autoDismissSeconds = 12,
  bubbleText,
  className,
}: CornerMascotProps) {
  const info = MASCOTS[mascot];
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<"hidden" | "active" | "settled" | "dismissed">("hidden");
  const [showBubble, setShowBubble] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;

    // 1. Enter after initial delay
    const enterTimer = setTimeout(() => {
      setStage("active");
      setShowBubble(true);
    }, delay * 1000);

    // 2. Hide speech bubble after 4.5s
    const bubbleTimer = setTimeout(() => {
      setShowBubble(false);
    }, (delay + 4.5) * 1000);

    // 3. Settle neatly into the corner after 7s
    const settleTimer = setTimeout(() => {
      setStage("settled");
    }, (delay + 7) * 1000);

    // 4. Auto dismiss if specified
    let dismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissSeconds > 0) {
      dismissTimer = setTimeout(() => {
        setStage("dismissed");
      }, (delay + autoDismissSeconds) * 1000);
    }

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(bubbleTimer);
      clearTimeout(settleTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [delay, autoDismissSeconds, reduce]);

  if (reduce || stage === "hidden" || stage === "dismissed") {
    return null;
  }

  const currentDialogue =
    bubbleText || info.dialogues[dialogueIndex % info.dialogues.length];

  function handleMascotTap() {
    setDialogueIndex((prev) => prev + 1);
    setShowBubble(true);
    setStage("active");
    setTimeout(() => setShowBubble(false), 3500);
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-30 flex items-center justify-center",
        CORNER_POSITION_CLASSES[corner],
        className,
      )}
    >
      <AnimatePresence>
        <motion.div
          key="corner-mascot-box"
          initial={CORNER_INITIAL[corner]}
          animate={
            stage === "settled"
              ? CORNER_SETTLE[corner]
              : CORNER_ENTER[corner]
          }
          exit={CORNER_INITIAL[corner]}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 18,
            mass: 0.9,
          }}
          className="pointer-events-auto relative cursor-pointer group"
          onClick={handleMascotTap}
        >
          {/* Close Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStage("dismissed");
            }}
            aria-label={`Dismiss ${info.name}`}
            className="absolute -top-2 -right-2 z-40 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[#72776A] shadow-md border border-[#263D2E]/10 transition-transform duration-200 hover:scale-110 hover:text-[#263D2E]"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Interactive Speech Bubble */}
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "absolute z-40 whitespace-nowrap rounded-2xl border border-[#263D2E]/10 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-[#263D2E] shadow-xl backdrop-blur-md",
                  corner.includes("bottom")
                    ? "-top-12 left-1/2 -translate-x-1/2"
                    : "-bottom-12 left-1/2 -translate-x-1/2",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#FFD45A]" />
                  <span>{currentDialogue}</span>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border-b border-r border-[#263D2E]/10 bg-white",
                    corner.includes("bottom") ? "-bottom-1.5" : "-top-1.5",
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mascot Toy Container */}
          <motion.div
            animate={
              stage === "active"
                ? {
                    y: [0, -8, 0],
                    rotate: [-3, 3, -3],
                    transition: {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
                : {
                    rotate: [0, 2, 0],
                    transition: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
            whileHover={{ scale: 1.1, rotate: [-2, 4, 0] }}
            whileTap={{ scale: 0.95 }}
            className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 drop-shadow-[0_12px_24px_rgba(38,61,46,0.2)]"
          >
            <Image
              src={info.image}
              alt={info.nickname}
              fill
              unoptimized
              className="h-full w-full object-contain"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
