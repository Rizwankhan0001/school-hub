"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";

const links = [
  { href: "/#get-started", label: "Get started" },
  { href: "/pricing", label: "Pricing" },
  { href: "/register?type=school", label: "Register school" },
  { href: "/register?type=parent", label: "Register parent" },
];

export function SiteNav({
  tone = "dark",
  position = "absolute",
}: {
  tone?: "dark" | "light";
  position?: "absolute" | "sticky";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dark = tone === "dark";

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-30",
        position === "absolute" ? "absolute" : "sticky bg-transparent",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-5"
      >
        <div
          className={cn(
            "site-nav flex items-center justify-between gap-3 rounded-[1.35rem] px-3 py-2.5 sm:px-4",
            dark
              ? "border border-white/10 bg-white/[0.06] text-white shadow-[0_18px_50px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl"
              : "border border-[var(--line)] bg-white/90 text-[var(--ink)] shadow-[0_18px_40px_-30px_rgba(10,12,16,0.35)] backdrop-blur-xl",
          )}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2.5 pl-0.5">
            <span className="brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              E3
            </span>
            <span className="min-w-0">
              <span className="block font-[family-name:var(--font-display)] text-[1.05rem] font-bold leading-none tracking-[-0.04em] sm:text-lg">
                EduFee360
              </span>
              <span
                className={cn(
                  "mt-1 hidden text-[0.68rem] font-medium tracking-[0.02em] sm:block",
                  dark ? "text-white/45" : "text-[var(--muted)]",
                )}
              >
                School fee workspace
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((item) => {
              const active =
                (item.href === "/pricing" && pathname === "/pricing") ||
                (item.href.includes("type=school") && pathname === "/register") ||
                (item.href.includes("type=parent") && pathname === "/register");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-xl px-3 py-2 text-sm font-semibold transition",
                    dark
                      ? active
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:bg-white/8 hover:text-white"
                      : active
                        ? "bg-[var(--ink)] text-white"
                        : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className={cn(
                "inline-flex h-10 items-center rounded-2xl px-3 text-sm font-semibold transition sm:px-4",
                dark
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]",
              )}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold transition sm:px-4",
                dark
                  ? "bg-white text-[var(--ink)] hover:bg-white/90"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
              )}
            >
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Register</span>
              <ArrowRight className="hidden h-3.5 w-3.5 sm:block" />
            </Link>
            <button
              type="button"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl lg:hidden",
                dark ? "bg-white/10 text-white" : "border border-[var(--line)] bg-white",
              )}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col bg-[var(--ink)] p-5 text-white"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="brand-mark grid h-9 w-9 place-items-center rounded-xl text-xs font-bold">
                  E3
                </span>
                <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.04em]">
                  EduFee360
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="px-1 text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              New customer
            </p>
            <div className="mt-2 space-y-1">
              <Link
                href="/register?type=school"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3.5 text-base font-semibold hover:bg-white/8"
              >
                Register as School
              </Link>
              <Link
                href="/register?type=parent"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3.5 text-base font-semibold hover:bg-white/8"
              >
                Register as Parent
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3.5 text-base font-semibold text-white/75 hover:bg-white/8 hover:text-white"
              >
                Pricing
              </Link>
            </div>

            <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
              <p className="px-1 text-xs text-white/45">Already have an account?</p>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-2xl border border-white/15 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-semibold"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </header>
  );
}
