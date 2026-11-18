import React from "react";
import { Sparkles, Sprout, Wind, Droplet, FlaskConical } from "lucide-react";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Native Seed Sourcing",
    icon: Sprout,
    description:
      "We source premium single-origin seeds: heritage black sesame seeds, sulfur-free dried coconut copra, and natural castor seeds. Each batch is inspected for moisture and quality before pressing.",
  },
  {
    step: "02",
    title: "Slow Cold Pressing",
    icon: Wind,
    description:
      "Traditional cold-press extraction rotates at a gentle low RPM. Extraction temperature stays strictly below 45°C, preserving heat-sensitive tocopherols, vitamin E, and natural polyphenols.",
  },
  {
    step: "03",
    title: "Natural Gravitational Settling",
    icon: Droplet,
    description:
      "Extracted oil rests in food-grade stainless steel settling tanks for 3 to 4 days. Natural plant micro-particles settle by gravity without high-pressure synthetic filtration or chemical bleaching.",
  },
  {
    step: "04",
    title: "Accredited Laboratory Testing",
    icon: FlaskConical,
    description:
      "Batches are periodically tested for FFA, Peroxide Value, Acid Value, and screened to confirm the complete absence of Argemone and mineral oil adulteration.",
  },
];

export function CertificateTestingProcess() {
  return (
    <section className="forest-gradient rounded-3xl border border-black/10 p-8 text-cream shadow-[var(--shadow-lifted)] sm:p-10 lg:p-12">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Cold Pressing Quality Protocol</span>
        </div>

        <h2 className="mt-4 font-display text-2xl tracking-tight text-cream sm:text-3xl md:text-4xl">
          Traditional Cold-Press Standard of Purity
        </h2>

        <p className="mt-3 text-xs leading-relaxed text-cream/80 sm:text-base">
          Unlike industrial refined oils processed with chemical hexane solvents and bleached at 200°C+,
          our traditional low-heat extraction relies entirely on mechanical cold pressing.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.step}
              className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/10 p-5 transition-transform hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-2xl text-dark/80">
                    {step.step}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-semibold text-cream">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-cream/70">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-medium text-accent">
                ✓ 100% Unrefined & Chemical Free
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
