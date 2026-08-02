"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, formatINR } from "@/lib/format";
import { Button, PageHeader, Stat, Surface, Badge, Select } from "@/components/ui";
import type { SubscriptionPlan } from "@/lib/types";

const nav = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/schools", label: "Schools", icon: Building2 },
  { href: "/platform/plans", label: "Plans", icon: CreditCard },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?role=super_admin");
      return;
    }
    if (user.role !== "super_admin") {
      if (user.role === "parent" || user.role === "student") router.replace("/parent");
      else router.replace("/admin");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "super_admin") {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden bg-[var(--sidebar)] text-white lg:flex lg:flex-col">
        <div className="relative overflow-hidden px-5 py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[rgba(36,91,255,0.28)] blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="brand-mark grid h-11 w-11 place-items-center rounded-2xl text-sm font-bold text-white">
              E3
            </span>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.04em]">
                EduFee360
              </p>
              <p className="mt-1.5 text-xs text-white/40">Platform console</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={pathname === item.href}
              className={cn(
                "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                pathname === item.href
                  ? "bg-[var(--sidebar-active)] text-white shadow-[0_12px_24px_-16px_rgba(0,166,126,0.9)]"
                  : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div>
        <header className="app-topbar sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:px-6">
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
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-2-soft)] text-xs font-bold text-[var(--accent-2)]">
                {user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-[var(--muted)]">Super Admin</p>
              </div>
            </div>
          </div>
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] bg-[#f7fbfc] p-4">
            <div className="mb-4 flex justify-between">
              <span className="font-[family-name:var(--font-display)] text-xl">Platform</span>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PlatformOverview() {
  const { platformMetrics, state } = useApp();
  return (
    <div className="animate-rise">
      <PageHeader
        title="Multi-tenant platform"
        description="Tenant isolation, subscription plans, and SaaS revenue for EduFee360."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Schools" value={String(platformMetrics.schools)} />
        <Stat label="Active tenants" value={String(platformMetrics.activeSchools)} tone="success" />
        <Stat label="MRR" value={formatINR(platformMetrics.mrr)} tone="accent" />
        <Stat label="Enterprise" value={String(platformMetrics.enterprise)} />
      </div>
      <Surface className="mt-6">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>School</th>
                <th>City</th>
                <th>Plan</th>
                <th>Branches</th>
                <th>MRR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.tenantSchools.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.city}</td>
                  <td className="capitalize">{s.plan}</td>
                  <td>{s.branches}</td>
                  <td>{formatINR(s.mrr)}</td>
                  <td>
                    <Badge
                      tone={
                        s.status === "active"
                          ? "success"
                          : s.status === "trial"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function PlatformSchools() {
  const { state, updateTenant } = useApp();
  return (
    <div className="animate-rise">
      <PageHeader title="Tenant schools" description="Manage subscriptions and tenant status." />
      <div className="grid gap-4">
        {state.tenantSchools.map((s) => (
          <Surface key={s.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                {s.name}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {s.city} · {s.studentsLimit === 99999 ? "Unlimited" : s.studentsLimit} students ·{" "}
                {s.branches} branches
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                className="w-40"
                value={s.plan}
                onChange={(e) => {
                  const plan = e.target.value as SubscriptionPlan;
                  const mrr = plan === "starter" ? 2999 : plan === "growth" ? 7999 : 24999;
                  const studentsLimit =
                    plan === "starter" ? 500 : plan === "growth" ? 2000 : 99999;
                  updateTenant(s.id, { plan, mrr, studentsLimit });
                }}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
              <Select
                className="w-36"
                value={s.status}
                onChange={(e) =>
                  updateTenant(s.id, {
                    status: e.target.value as SchoolStatus,
                  })
                }
              >
                <option value="active">active</option>
                <option value="trial">trial</option>
                <option value="suspended">suspended</option>
              </Select>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

type SchoolStatus = "active" | "trial" | "suspended";

export function PlatformPlans() {
  const plans = [
    {
      name: "Starter",
      price: "₹2,999/mo",
      points: ["Up to 500 students", "Core fee + receipts", "SMS/Email reminders"],
    },
    {
      name: "Growth",
      price: "₹7,999/mo",
      points: ["Up to 2,000 students", "WhatsApp integration", "Scholarships & fines"],
    },
    {
      name: "Enterprise",
      price: "Custom",
      points: ["Unlimited students", "AI voice calling", "Multi-branch + SSO"],
    },
  ];
  return (
    <div className="animate-rise">
      <PageHeader
        title="Commercial plans"
        description="SaaS pricing aligned to school size and recovery features."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Surface key={p.name} className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {p.name}
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl">{p.price}</p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
              {p.points.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Surface>
        ))}
      </div>
    </div>
  );
}
