"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { cn } from "@/lib/format";

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    blurb: "For smaller schools getting started",
    features: [
      "Up to 500 students",
      "Fee plans & installments",
      "Online payments",
      "Due tracking",
      "SMS & email",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹7,999",
    blurb: "Most schools choose this",
    features: [
      "Up to 2,000 students",
      "WhatsApp reminders",
      "Scholarships & late fees",
      "AI video calls",
      "Parent portal",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "For multi-campus groups",
    features: [
      "Unlimited students",
      "Full AI suite",
      "Advanced reports",
      "Multi-branch",
      "Dedicated support",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SiteNav tone="light" position="sticky" />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[rgba(0,166,126,0.1)] blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pb-14 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="plain-label text-[var(--accent)]">Pricing</p>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.05em]">
                Simple plans.
                <br />
                Clear value.
              </h1>
              <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-[var(--muted)]">
                Start small. Grow into WhatsApp and AI recovery when your school needs them.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
            {plans.map((p, i) => (
              <motion.article
                key={p.name}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07, duration: 0.5 }}
                className={cn(
                  "relative flex h-full flex-col rounded-[1.75rem] border p-7 sm:p-8",
                  p.highlight
                    ? "border-[var(--accent)] bg-white shadow-[0_28px_60px_-36px_rgba(0,166,126,0.55)] lg:-translate-y-2"
                    : "border-[var(--line)] bg-white/80",
                )}
              >
                {p.highlight ? (
                  <p className="mb-5 inline-flex w-fit rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--accent-hover)]">
                    Recommended
                  </p>
                ) : (
                  <div className="mb-5 h-7" aria-hidden />
                )}

                <p className="text-sm font-semibold text-[var(--muted)]">{p.name}</p>
                <p className="mt-3 flex items-baseline gap-1.5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-[2.65rem]">
                  {p.price}
                  {p.price !== "Custom" ? (
                    <span className="font-[family-name:var(--font-body)] text-base font-medium text-[var(--muted)]">
                      /mo
                    </span>
                  ) : null}
                </p>
                <p className="mt-3 min-h-[2.75rem] text-sm leading-relaxed text-[var(--muted)]">
                  {p.blurb}
                </p>

                <ul className="mt-8 flex-1 space-y-3.5 border-t border-[var(--line)] pt-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-snug">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register?type=school"
                  className={cn(
                    "mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition",
                    p.highlight
                      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                      : "bg-[var(--surface-muted)] text-[var(--ink)] hover:bg-[#e8ebf0]",
                  )}
                >
                  Register school
                  {p.highlight ? <ArrowRight className="h-4 w-4" /> : null}
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="mt-16 grid gap-6 rounded-[1.75rem] border border-[var(--line)] bg-white/70 px-7 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:px-10">
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                Prefer to explore first?
              </p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
                Open the demo as school admin or parent — no commitment, same workspace.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--ink-2)]"
            >
              Try the demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.02em]">
            EduFee360
          </p>
          <p className="text-sm text-[var(--muted)]">Transparent pricing for growing schools</p>
        </div>
      </footer>
    </div>
  );
}
