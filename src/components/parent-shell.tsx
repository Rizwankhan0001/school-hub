"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  CalendarClock,
  CreditCard,
  History,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  Receipt,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/format";
import { Button } from "@/components/ui";

const nav = [
  { href: "/parent", label: "Home", icon: Home },
  { href: "/parent/pay", label: "Pay now", icon: CreditCard },
  { href: "/parent/scholarships", label: "Scholarships", icon: Award },
  { href: "/parent/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/parent/receipts", label: "Receipts", icon: Receipt },
  { href: "/parent/history", label: "History", icon: History },
  { href: "/parent/notifications", label: "Alerts", icon: Bell },
  { href: "/parent/support", label: "Help", icon: LifeBuoy },
];

const mobileNav = [
  { href: "/parent", label: "Home", icon: Home },
  { href: "/parent/pay", label: "Pay", icon: CreditCard },
  { href: "/parent/scholarships", label: "Aid", icon: Award },
  { href: "/parent/meetings", label: "Meet", icon: CalendarClock },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ParentShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout, state } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?role=parent");
      return;
    }
    if (user.role !== "parent" && user.role !== "student") router.replace("/admin");
  }, [ready, user, router]);

  if (!ready || !user || (user.role !== "parent" && user.role !== "student")) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="app-topbar sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-white shadow-sm lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link href="/parent" className="flex min-w-0 items-center gap-2.5">
              <span className="brand-mark grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white sm:h-10 sm:w-10">
                E3
              </span>
              <span className="min-w-0">
                <span className="block truncate font-[family-name:var(--font-display)] text-base font-bold leading-none tracking-[-0.03em] sm:text-lg">
                  EduFee360
                </span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                  {state.school.name}
                </span>
              </span>
            </Link>
          </div>

          <nav className="nav-rail hidden lg:inline-flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} data-active={active}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/80 px-2.5 py-1.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-hover)]">
                {initials(user.name)}
              </span>
              <span className="pr-1">
                <span className="block text-xs font-semibold leading-none">{user.name.split(" ")[0]}</span>
                <span className="mt-1 block text-[0.65rem] text-[var(--muted)]">Parent</span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-3 z-20 px-3 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mobile-dock mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-[1.35rem] p-1.5">
          {mobileNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[1.1rem] px-1 py-2.5 text-[0.65rem] font-bold transition sm:px-2 sm:text-[0.68rem]",
                  active
                    ? "bg-[var(--ink)] text-white shadow-[0_10px_20px_-12px_rgba(10,12,16,0.55)]"
                    : "text-[var(--muted)]",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,290px)] flex-col bg-white p-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="brand-mark grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white">
                  E3
                </span>
                <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em]">
                  Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-muted)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-[var(--ink)] text-white"
                        : "hover:bg-[var(--surface-muted)]",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto border-t border-[var(--line)] pt-4">
              <Button
                variant="soft"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-24 md:hidden" />
    </div>
  );
}
