"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  LogIn,
  Shield,
  Users,
} from "lucide-react";
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

const paths = [
  {
    href: "/register?type=school",
    icon: Building2,
    title: "Register as School",
    audience: "School admin / campus",
    blurb:
      "Create your school account. You’ll get a School Admin workspace to manage students, fees, dues, and receipts.",
    cta: "Create school account",
    tone: "accent" as const,
  },
  {
    href: "/register?type=parent",
    icon: Users,
    title: "Register as Parent",
    audience: "Parent / guardian",
    blurb:
      "Create a parent account linked to your child’s school. Pay fees, download receipts, and book teacher meetings.",
    cta: "Create parent account",
    tone: "ink" as const,
  },
  {
    href: "/login",
    icon: LogIn,
    title: "Already registered? Sign in",
    audience: "School admin · Parent · Accountant · Platform",
    blurb:
      "Use your email and password. Demo roles are also available if you just want to explore.",
    cta: "Go to sign in",
    tone: "soft" as const,
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
              <h1 className="mt-8 max-w-xl text-[1.55rem] font-medium leading-[1.25] tracking-[-0.025em] text-white sm:text-[2rem]">
                Fee collection that feels effortless.
              </h1>
              <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-white/58 sm:text-lg">
                New here? Register as a school or parent. Already with us? Sign in below.
              </p>
              <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href="#get-started"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-[0.95rem] font-semibold text-white transition hover:bg-[var(--accent-hover)] sm:w-auto"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-6 text-[0.95rem] font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="get-started" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="plain-label text-[var(--accent)]">New customer?</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
              Choose how you want to join
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-[var(--muted)]">
              Pick the option that matches you. Registration is for schools and parents. Staff
              roles like accountant or platform admin sign in with an existing account.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {paths.map((path, i) => (
              <motion.div
                key={path.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={path.href}
                  className={`group flex h-full flex-col rounded-[1.6rem] border p-6 transition hover:-translate-y-0.5 sm:p-7 ${
                    path.tone === "accent"
                      ? "border-[var(--accent)]/35 bg-white shadow-[0_22px_50px_-34px_rgba(0,166,126,0.55)] hover:border-[var(--accent)]"
                      : path.tone === "ink"
                        ? "border-[var(--line)] bg-white hover:border-[var(--ink)]/25"
                        : "border-[var(--line)] bg-[var(--surface-muted)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${
                      path.tone === "accent"
                        ? "bg-[var(--accent)]"
                        : path.tone === "ink"
                          ? "bg-[var(--ink)]"
                          : "bg-[var(--ink-2)]"
                    }`}
                  >
                    <path.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                    {path.audience}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.03em]">{path.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {path.blurb}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition group-hover:gap-2.5">
                    {path.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.4rem] border border-[var(--line)] bg-white/70 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-2-soft)] text-[var(--accent-2)]">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold tracking-[-0.02em]">
                    Accountant, support, or platform admin?
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Those roles don’t self-register. Sign in with your school/platform credentials,
                    or try the demo role cards on the login page.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ink)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--ink-2)]"
              >
                Open sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 sm:pb-28">
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
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.02em]">
              EduFee360
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">School fee management, made clear</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/register?type=school" className="text-[var(--ink)] hover:text-[var(--accent)]">
              Register school
            </Link>
            <Link href="/register?type=parent" className="text-[var(--ink)] hover:text-[var(--accent)]">
              Register parent
            </Link>
            <Link href="/login" className="text-[var(--ink)] hover:text-[var(--accent)]">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
