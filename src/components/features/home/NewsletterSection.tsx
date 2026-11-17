"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Check, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { FloatingMascot } from "@/components/features/mascots/FloatingMascot";
import { ASSETS } from "@/constants/assets";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Welcome to HEALARGO! A little more goodness is coming your way.");
    }, 600);
  }

  return (
    <section className="py-14 md:py-20">
      <PageContainer>
        <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] border border-[#263D2E]/10 bg-[#FFD45A] p-8 text-[#263D2E] shadow-[var(--shadow-lifted)] sm:p-12 md:p-16">
          {/* Playful Floating SVG Elements */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-6 top-6 h-9 w-9 opacity-80 animate-float sm:left-10 sm:h-11 sm:w-11"
          >
            <Image
              src={ASSETS.ILLUSTRATIONS.LEAF}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute right-6 bottom-6 h-8 w-8 opacity-80 animate-spin-slow sm:right-12 sm:h-10 sm:w-10"
          >
            <Image
              src={ASSETS.ILLUSTRATIONS.SPARKLE}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Cheerful Mascot Interaction */}
          <div className="absolute right-4 top-4 hidden md:block lg:right-8 lg:top-8">
            <FloatingMascot mascot="oil-drop" size="sm" speechBubble="Join our family!" />
          </div>

          {/* Subtle playful peach and aqua auras */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF8066]/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#8EDBD0]/35 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#263D2E] shadow-2xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#4F8A45] animate-spin-slow" />
              HEALARGO Circle
            </span>

            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.12] text-[#263D2E] sm:text-4xl md:text-5xl">
              A Little More Goodness in Your Inbox.
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[#263D2E]/85 sm:text-base">
              Seasonal harvest stories, natural cooking ideas, and early access to fresh HEALARGO cold-pressed batches.
            </p>

            {submitted ? (
              <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-bold text-[#4F8A45] shadow-sm">
                <Check className="h-4 w-4 text-[#4F8A45]" />
                <span>You&apos;re subscribed! Thank you for joining our circle.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
              >
                <div className="relative flex-1 max-w-md">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72776A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-12 w-full rounded-full border border-[#263D2E]/15 bg-white pl-11 pr-4 text-sm text-[#29352B] placeholder-[#72776A] shadow-sm outline-none transition focus:border-[#4F8A45] focus:ring-2 focus:ring-[#4F8A45]/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="h-12 rounded-full bg-[#4F8A45] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#263D2E]"
                >
                  {loading ? "Joining..." : "Join Goodness"}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            )}

            <p className="mt-4 text-[11px] text-[#263D2E]/70 font-medium">
              We respect your privacy. Zero spam, unsubscribe whenever you wish.
            </p>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
