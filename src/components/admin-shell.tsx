"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  Bot,
  Briefcase,
  Cable,
  CalendarRange,
  ChartColumnIncreasing,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Percent,
  Receipt,
  GraduationCap,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, roleLabel } from "@/lib/format";
import { Button } from "@/components/ui";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

/** Keep accountant on money workflows only. */
const allNav: NavItem[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, roles: ["school_admin", "accountant", "support_agent"] },
  { href: "/admin/students", label: "Students", icon: Users, roles: ["school_admin"] },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap, roles: ["school_admin", "support_agent"] },
  { href: "/admin/dues", label: "Who owes", icon: Bell, roles: ["school_admin", "accountant", "support_agent"] },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, roles: ["school_admin", "accountant"] },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt, roles: ["school_admin", "accountant", "support_agent"] },
  { href: "/admin/staff-fees", label: "Payroll", icon: Briefcase, roles: ["school_admin", "accountant"] },
  { href: "/admin/fines", label: "Late fees", icon: Percent, roles: ["school_admin", "accountant"] },
  { href: "/admin/fees", label: "Fee plans", icon: Wallet, roles: ["school_admin", "accountant"] },
  { href: "/admin/installments", label: "Installments", icon: CalendarRange, roles: ["school_admin", "accountant"] },
  { href: "/admin/scholarships", label: "Scholarships", icon: Award, roles: ["school_admin", "accountant"] },
  { href: "/admin/gateways", label: "Payment apps", icon: Cable, roles: ["school_admin"] },
  { href: "/admin/communications", label: "Messages", icon: MessageSquare, roles: ["school_admin", "support_agent"] },
  { href: "/admin/ai-collection", label: "AI video & nudges", icon: Bot, roles: ["school_admin"] },
  { href: "/admin/support", label: "Help desk", icon: Headphones, roles: ["school_admin", "support_agent"] },
  { href: "/admin/reports", label: "Reports", icon: ChartColumnIncreasing, roles: ["school_admin", "accountant"] },
];

function pathAllowed(pathname: string, nav: NavItem[]) {
  if (pathname === "/admin") return true;
  return nav.some(
    (item) =>
      item.href !== "/admin" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout, state } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "parent" || user.role === "student") {
      router.replace("/parent");
      return;
    }
    if (user.role === "super_admin") router.replace("/platform");
  }, [ready, user, router]);

  const nav = useMemo(
    () => allNav.filter((item) => user && item.roles.includes(user.role)),
    [user],
  );

  const isAccountant = user?.role === "accountant";

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "parent" || user.role === "student" || user.role === "super_admin") {
      return;
    }
    if (!pathAllowed(pathname, nav)) {
      router.replace("/admin");
    }
  }, [ready, user, pathname, nav, router]);

  function handleLogout() {
    setOpen(false);
    logout();
    router.push("/login");
  }

  if (
    !ready ||
    !user ||
    user.role === "parent" ||
    user.role === "student" ||
    user.role === "super_admin"
  ) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  if (!pathAllowed(pathname, nav)) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  const NavLinks = (
    <nav className="space-y-1 px-3">
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            data-active={active}
            className={cn(
              "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[var(--sidebar-active)] text-white shadow-[0_12px_24px_-16px_rgba(0,166,126,0.9)]"
                : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden bg-[var(--sidebar)] text-white lg:flex lg:flex-col">
        <div className="relative overflow-hidden px-5 py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[rgba(0,166,126,0.28)] blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="brand-mark grid h-11 w-11 place-items-center rounded-2xl text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              E3
            </span>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.04em]">
                EduFee360
              </p>
              <p className="mt-1 text-xs text-white/40">
                {isAccountant ? "Finance workspace" : "School workspace"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">{NavLinks}</div>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-sm font-semibold">{state.school.name}</p>
            <p className="mt-1 text-xs capitalize text-white/40">
              {isAccountant
                ? `Accountant · ${state.school.academicSession}`
                : `${state.school.plan} · ${state.school.academicSession}`}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="app-topbar sticky top-0 z-20 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-white shadow-sm lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-hover)]">
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-[var(--muted)]">{roleLabel(user.role)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--muted)] md:inline-flex">
                {isAccountant ? "Finance desk" : state.school.name}
              </span>
              <Button variant="soft" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,300px)] flex-col bg-[var(--sidebar)] text-white">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                EduFee360
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{NavLinks}</div>
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 px-1 text-xs text-white/40">{user.name}</p>
              <Button
                variant="ghost"
                className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
