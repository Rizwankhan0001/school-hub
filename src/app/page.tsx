"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

const steps = [
  {
    n: "01",
    t: "Plan fees once",
    d: "Class structures, installments, scholarships, and late fees — set and forget.",
  },
  {
    n: "02",
    t: "Collect without chaos",
    d: "Parents pay online. Receipts issue instantly. Accountants stay in control.",
  },
  {
    n: "03",
    t: "Remind with care",
    d: "Gentle random nudges and AI video calls help recover dues without pressure.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SiteNav tone="dark" />

      <main>
        <section className="hero-plane relative flex min-h-[100svh] items-end overflow-hidden">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-[6%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-[rgba(0,166,126,0.28)] blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.32, 0.52, 0.32] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[8%] top-[38%] h-52 w-52 rounded-full bg-[rgba(36,91,255,0.22)] blur-3xl"
            animate={{ y: [0, -24, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-[18%] right-[28%] h-28 w-28 rounded-full border border-white/10"
            animate={{ rotate: [0, 12, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32 sm:pb-20 sm:pt-36">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl"
            >
              <p className="font-[family-name:var(--font-display)] text-[clamp(3.4rem,12vw,7.5rem)] font-extrabold leading-[0.88] tracking-[-0.055em] text-white">
                EduFee360
              </p>
              <h1 className="mt-8 max-w-[22rem] text-[1.55rem] font-medium leading-[1.25] tracking-[-0.025em] text-white sm:max-w-xl sm:text-[2rem]">
                Fee collection that feels effortless.
              </h1>
              <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-white/58 sm:text-lg">
                Schools set plans. Parents pay clearly. Reminders stay gentle.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/register?type=school"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-[0.95rem] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                >
                  Register your school
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-2xl border border-white/15 bg-white/[0.04] px-6 text-[0.95rem] font-semibold text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
            <div>
              <p className="plain-label text-[var(--accent)]">Simple by design</p>
              <h2 className="mt-3 max-w-md font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
                Built for real school days
              </h2>
            </div>
            <p className="max-w-lg text-[1.05rem] leading-relaxed text-[var(--muted)] lg:justify-self-end lg:text-right">
              One calm flow from fee plan to payment to receipt — without chasing people through
              spreadsheets.
            </p>
          </div>

          <div className="mt-16 border-t border-[var(--line)]">
            {steps.map((item, i) => (
              <motion.div
                key={item.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="grid gap-4 border-b border-[var(--line)] py-8 sm:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-baseline sm:gap-8 sm:py-10"
              >
                <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.08em] text-[var(--accent)]">
                  {item.n}
                </p>
                <h3 className="text-2xl font-bold tracking-[-0.03em]">{item.t}</h3>
                <p className="text-[0.98rem] leading-relaxed text-[var(--muted)] sm:max-w-md sm:justify-self-end sm:text-right">
                  {item.d}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24 sm:pb-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[var(--ink)] px-8 py-14 text-white sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[rgba(0,166,126,0.28)] blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[rgba(36,91,255,0.2)] blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_auto] lg:items-center lg:gap-16">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
                  Start in minutes
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl">
                  The right workspace for every role
                </h2>
                <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-white/55">
                  School admin, accountant, parent, or platform — each login opens a clear job, not
                  a crowded dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                >
                  Register
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-2xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.02em]">
            EduFee360
          </p>
          <p className="text-sm text-[var(--muted)]">School fee management, made clear</p>
        </div>
      </footer>
    </div>
  );
}
