"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bell,
  Bot,
  Cable,
  CalendarDays,
  CreditCard,
  GraduationCap,
  Headphones,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Button, Input, Select, Surface } from "@/components/ui";
import { AccountantHome } from "@/components/accountant-home";
import { useApp } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/seed";
import { dueStatusLabel, formatDate, formatINR, outstanding } from "@/lib/format";

type PeriodKey = "today" | "yesterday" | "7" | "14" | "30" | "90" | "custom" | "all";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom last N days" },
  { value: "all", label: "All time" },
];

function shiftDay(ymd: string, delta: number) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function dayOf(iso: string) {
  return iso.slice(0, 10);
}

function resolveRange(
  period: PeriodKey,
  customDays: number,
  today = DEMO_TODAY,
): { start: string | null; end: string | null; label: string } {
  if (period === "all") return { start: null, end: null, label: "All time" };
  if (period === "today") return { start: today, end: today, label: "Today" };
  if (period === "yesterday") {
    const y = shiftDay(today, -1);
    return { start: y, end: y, label: "Yesterday" };
  }
  const days =
    period === "custom" ? Math.max(1, Math.min(365, customDays || 1)) : Number(period);
  const start = shiftDay(today, -(days - 1));
  return {
    start,
    end: today,
    label: `Last ${days} days`,
  };
}

function inRange(iso: string, start: string | null, end: string | null) {
  if (!start || !end) return true;
  const d = dayOf(iso);
  return d >= start && d <= end;
}

function ProgressRing({
  value,
  size = 112,
  stroke = 10,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(10,12,16,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

const QUICK_LINKS = [
  { href: "/admin/students", label: "Students", hint: "Class & section roster", icon: Users },
  { href: "/admin/teachers", label: "Teachers", hint: "Faculty directory", icon: GraduationCap },
  { href: "/admin/dues", label: "Who owes", hint: "Open fee dues", icon: Bell },
  { href: "/admin/payments", label: "Payments", hint: "Collection ledger", icon: CreditCard },
  { href: "/admin/scholarships", label: "Scholarships", hint: "Applications", icon: Award },
  { href: "/admin/ai-collection", label: "AI nudges", hint: "Video & reminders", icon: Bot },
] as const;

export default function AdminOverviewPage() {
  const { metrics, state, sendReminder, getStudent, user } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("30");
  const [customDays, setCustomDays] = useState(7);

  const range = useMemo(
    () => resolveRange(period, customDays, DEMO_TODAY),
    [period, customDays],
  );

  const insight = useMemo(() => {
    const { start, end } = range;
    const activeStudents = state.students.filter((s) => s.status === "active").length;
    const classes = new Set(state.students.map((s) => s.className)).size;
    const sections = new Set(state.students.map((s) => `${s.className}-${s.section}`)).size;
    const teachers = state.teachers.length;

    const openDues = state.dues.filter((d) => d.status !== "paid");
    const overdueCount = openDues.filter((d) => d.status === "overdue").length;
    const dueTodayCount = openDues.filter((d) => d.status === "due_today").length;
    const upcomingCount = openDues.filter((d) => d.status === "upcoming").length;
    const partialCount = openDues.filter((d) => d.status === "partial").length;

    const pendingScholarships = state.scholarships.filter((s) => s.status === "pending").length;
    const approvedScholarships = state.scholarships.filter((s) => s.status === "approved").length;
    const openTickets = state.tickets.filter(
      (t) => t.status === "open" || t.status === "in_progress",
    ).length;
    const ticketsInPeriod = state.tickets.filter((t) => inRange(t.createdAt, start, end)).length;
    const aiInPeriod = state.aiCalls.filter((c) => inRange(c.calledAt, start, end));
    const aiQueued = state.aiCalls.filter(
      (c) => c.status === "queued" || c.status === "ringing" || c.status === "in_progress",
    ).length;
    const aiDoneInPeriod = aiInPeriod.filter((c) => c.status === "completed").length;
    const liveGateways = state.gateways.filter((g) => g.enabled).length;

    const periodMessages = state.communications
      .filter((c) => inRange(c.sentAt, start, end))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    const recentMessages = periodMessages.slice(0, 4);
    const messagesInPeriod = periodMessages.length;

    const dueMixTotal = Math.max(1, metrics.overdue + metrics.dueToday + metrics.upcoming);

    const periodPays = state.payments
      .filter((p) => inRange(p.paidAt, start, end))
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const collectedInPeriod = periodPays
      .filter((p) => p.status === "success")
      .reduce((s, p) => s + p.amount, 0);
    const paymentCountInPeriod = periodPays.length;
    const recentPays = periodPays.slice(0, 6);

    const byClass = new Map<string, { amount: number; students: Set<string> }>();
    for (const d of openDues) {
      const st = state.students.find((x) => x.id === d.studentId);
      const cls = st?.className ?? "Unknown";
      const entry = byClass.get(cls) ?? { amount: 0, students: new Set() };
      entry.amount += outstanding(d.amount, d.fine, d.paidAmount);
      entry.students.add(d.studentId);
      byClass.set(cls, entry);
    }
    const classPressure = Array.from(byClass.entries())
      .map(([className, v]) => ({
        className,
        amount: v.amount,
        students: v.students.size,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const attentionPool = openDues.filter(
      (d) => d.status === "overdue" || inRange(d.dueDate, start, end),
    );
    const attention = [...attentionPool]
      .sort((a, b) => {
        const rank = (s: string) =>
          s === "overdue" ? 0 : s === "due_today" ? 1 : s === "partial" ? 2 : 3;
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 7);

    const pendingApps = state.scholarships
      .filter((s) => s.status === "pending")
      .slice(0, 4);

    const rangeHint =
      start && end
        ? start === end
          ? formatDate(start)
          : `${formatDate(start)} – ${formatDate(end)}`
        : "All recorded activity";

    return {
      activeStudents,
      classes,
      sections,
      teachers,
      overdueCount,
      dueTodayCount,
      upcomingCount,
      partialCount,
      pendingScholarships,
      approvedScholarships,
      openTickets,
      ticketsInPeriod,
      aiQueued,
      aiDoneInPeriod,
      aiInPeriod: aiInPeriod.length,
      liveGateways,
      recentMessages,
      messagesInPeriod,
      dueMixTotal,
      collectedInPeriod,
      paymentCountInPeriod,
      classPressure,
      attention,
      recentPays,
      pendingApps,
      rangeHint,
      maxClassAmount: Math.max(1, ...classPressure.map((c) => c.amount)),
    };
  }, [state, metrics, range]);

  const greet =
    user?.name?.split(" ")[0] ??
    (user?.role === "accountant" ? "Accountant" : "Admin");

  if (user?.role === "accountant") {
    return <AccountantHome />;
  }

  return (
    <div className="animate-rise">
      <div className="relative mb-4 overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[linear-gradient(135deg,#0a0c10_0%,#14352c_48%,#0a0c10_100%)] text-white shadow-[0_28px_60px_-36px_rgba(10,12,16,0.7)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(0,166,126,0.45), transparent 42%), radial-gradient(circle at 88% 10%, rgba(36,91,255,0.28), transparent 36%)",
          }}
        />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/75 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              {state.school.academicSession} · {state.school.plan} plan
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[2.45rem]">
              Good day, {greet}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-[0.98rem]">
              {state.school.name}, {state.school.city} — filter activity by day range to see
              collections, messages, and queues for that window.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/admin/dues">
                <Button>
                  Review unpaid fees <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/students">
                <Button
                  variant="ghost"
                  className="bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Browse students
                </Button>
              </Link>
              <Link href="/admin/ai-collection">
                <Button
                  variant="ghost"
                  className="bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Run AI nudges
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl bg-white/8 p-3.5 ring-1 ring-white/12">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.07em] text-white/55">
                Still unpaid
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                {formatINR(metrics.totalDue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 p-3.5 ring-1 ring-white/12">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.07em] text-white/55">
                In period
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em] text-[var(--accent)]">
                {formatINR(insight.collectedInPeriod)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 p-3.5 ring-1 ring-white/12">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.07em] text-white/55">
                Overdue
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em] text-[#ff8a9a]">
                {formatINR(metrics.overdue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 p-3.5 ring-1 ring-white/12">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.07em] text-white/55">
                Payments
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                {insight.paymentCountInPeriod}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Surface className="mb-6 overflow-hidden p-0">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-[-0.01em]">Activity period</p>
              <p className="text-xs text-[var(--muted)]">
                Showing records for{" "}
                <span className="font-semibold text-[var(--ink)]">{range.label}</span>
                {" · "}
                {insight.rangeHint}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              className="w-full sm:w-48"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              aria-label="Activity period"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            {period === "custom" ? (
              <div className="flex items-center gap-2">
                <Input
                  className="w-24"
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value) || 1)}
                  aria-label="Number of days"
                />
                <span className="text-xs font-semibold text-[var(--muted)]">days</span>
              </div>
            ) : null}
            <div className="hidden items-center gap-1 md:flex">
              {(["today", "yesterday", "7", "30"] as PeriodKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    period === key
                      ? "bg-[var(--ink)] text-white"
                      : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {PERIOD_OPTIONS.find((o) => o.value === key)?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.05))] px-5 py-4">
            <p className="text-sm font-bold tracking-[-0.01em]">Collection health</p>
            <p className="text-xs text-[var(--muted)]">
              Lifetime rate · period inflow {formatINR(insight.collectedInPeriod)}
            </p>
          </div>
          <div className="flex items-center gap-5 p-5">
            <div className="relative shrink-0">
              <ProgressRing value={metrics.collectionRate} />
              <div className="absolute inset-0 grid place-items-center rotate-0">
                <div className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.04em]">
                    {metrics.collectionRate}%
                  </p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                    rate
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold text-[var(--muted)]">Lifetime received</span>
                  <span className="font-bold text-[var(--success)]">{formatINR(metrics.collected)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.collectionRate}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                  <p className="text-[var(--muted)]">Due today</p>
                  <p className="mt-0.5 font-bold">{formatINR(metrics.dueToday)}</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                  <p className="text-[var(--muted)]">Collected in period</p>
                  <p className="mt-0.5 font-bold text-[var(--success)]">
                    {formatINR(insight.collectedInPeriod)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <p className="text-sm font-bold tracking-[-0.01em]">Open dues mix</p>
            <p className="text-xs text-[var(--muted)]">
              Live snapshot ·{" "}
              {insight.overdueCount +
                insight.dueTodayCount +
                insight.upcomingCount +
                insight.partialCount}{" "}
              open installments across {metrics.pendingStudents} students
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[
              {
                label: "Overdue",
                amount: metrics.overdue,
                count: insight.overdueCount,
                tone: "bg-[var(--danger-soft)] text-[var(--danger)]",
                bar: "bg-[var(--danger)]",
                share: metrics.overdue / insight.dueMixTotal,
              },
              {
                label: "Due today",
                amount: metrics.dueToday,
                count: insight.dueTodayCount,
                tone: "bg-[var(--warn-soft)] text-[var(--warn)]",
                bar: "bg-[var(--warn)]",
                share: metrics.dueToday / insight.dueMixTotal,
              },
              {
                label: "Upcoming",
                amount: metrics.upcoming,
                count: insight.upcomingCount,
                tone: "bg-[var(--info-soft)] text-[var(--info)]",
                bar: "bg-[var(--info)]",
                share: metrics.upcoming / insight.dueMixTotal,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--line)] p-3.5">
                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${item.tone}`}>
                  {item.label}
                </span>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                  {formatINR(item.amount)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{item.count} dues</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{ width: `${Math.max(8, item.share * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* School pulse */}
      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-[-0.01em]">School pulse</p>
            <p className="text-sm text-[var(--muted)]">People, applications, and ops at a glance</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {[
            {
              label: "Students",
              value: String(insight.activeStudents),
              hint: `${state.students.length} total`,
              href: "/admin/students",
              icon: Users,
            },
            {
              label: "Teachers",
              value: String(insight.teachers),
              hint: "Faculty live",
              href: "/admin/teachers",
              icon: GraduationCap,
            },
            {
              label: "Classes",
              value: String(insight.classes),
              hint: `${insight.sections} sections`,
              href: "/admin/students",
              icon: Wallet,
            },
            {
              label: "Pending fees",
              value: String(metrics.pendingStudents),
              hint: "Students with dues",
              href: "/admin/dues",
              icon: Bell,
            },
            {
              label: "Scholarships",
              value: String(insight.pendingScholarships),
              hint: `${insight.approvedScholarships} approved`,
              href: "/admin/scholarships",
              icon: Award,
            },
            {
              label: "Tickets (period)",
              value: String(insight.ticketsInPeriod),
              hint: `${insight.openTickets} still open`,
              href: "/admin/support",
              icon: Headphones,
            },
            {
              label: "AI in period",
              value: String(insight.aiInPeriod),
              hint: `${insight.aiDoneInPeriod} completed`,
              href: "/admin/ai-collection",
              icon: Bot,
            },
            {
              label: "Gateways",
              value: String(insight.liveGateways),
              hint: `of ${state.gateways.length} live`,
              href: "/admin/gateways",
              icon: Cable,
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-[1.2rem] border border-[var(--line)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[0_18px_40px_-28px_rgba(10,12,16,0.4)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--bg)] text-[var(--accent)] transition group-hover:bg-[var(--accent-soft)]">
                  <card.icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-2)] opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.04em]">
                {card.value}
              </p>
              <p className="mt-0.5 text-sm font-semibold">{card.label}</p>
              <p className="text-xs text-[var(--muted)]">{card.hint}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[linear-gradient(160deg,white,rgba(243,245,248,0.85))] px-3.5 py-3 transition hover:border-[var(--line-strong)]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-white">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <p className="truncate text-sm font-bold">{item.label}</p>
              <p className="truncate text-[0.7rem] text-[var(--muted)]">{item.hint}</p>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Needs attention */}
        <Surface className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-sm font-bold tracking-[-0.01em]">Needs attention first</p>
              <p className="text-xs text-[var(--muted)]">Overdue plus dues in selected period</p>
            </div>
            <Link
              href="/admin/dues"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Fee</th>
                  <th>Due on</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {insight.attention.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                      No dues matching this period
                    </td>
                  </tr>
                ) : null}
                {insight.attention.map((d) => {
                  const student = getStudent(d.studentId);
                  return (
                    <tr key={d.id}>
                      <td>
                        <p className="font-semibold tracking-[-0.01em]">{student?.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {student?.admissionNo} · {student?.className}-{student?.section}
                        </p>
                      </td>
                      <td>{d.installmentName}</td>
                      <td>{formatDate(d.dueDate)}</td>
                      <td className="font-semibold">
                        {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                      </td>
                      <td>
                        <Badge
                          tone={
                            d.status === "overdue"
                              ? "danger"
                              : d.status === "due_today"
                                ? "warning"
                                : d.status === "partial"
                                  ? "info"
                                  : "neutral"
                          }
                        >
                          {dueStatusLabel(d.status)}
                        </Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => sendReminder(d.id, "sms")}>
                          <Send className="h-3.5 w-3.5" /> Remind
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>

        {/* Right column stack */}
        <div className="space-y-6">
          <Surface className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-sm font-bold tracking-[-0.01em]">Payments in period</p>
                <p className="text-xs text-[var(--muted)]">
                  {insight.paymentCountInPeriod} payment{insight.paymentCountInPeriod === 1 ? "" : "s"} · {formatINR(insight.collectedInPeriod)} collected
                </p>
              </div>
              <Link
                href="/admin/payments"
                className="text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Ledger
              </Link>
            </div>
            <div className="space-y-2 p-4">
              {insight.recentPays.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-[var(--muted)]">
                  No payments in this period
                </p>
              ) : (
                insight.recentPays.map((p) => {
                  const student = getStudent(p.studentId);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{student?.name}</p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {formatDate(p.paidAt)} · {p.method.toUpperCase()} · {p.transactionId}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-[var(--success)]">{formatINR(p.amount)}</p>
                        <Badge tone={p.status === "success" ? "success" : "warning"}>{p.status}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Surface>

          <Surface className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-sm font-bold tracking-[-0.01em]">Scholarship queue</p>
                <p className="text-xs text-[var(--muted)]">
                  {insight.pendingScholarships} awaiting review
                </p>
              </div>
              <Link
                href="/admin/scholarships"
                className="text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Review
              </Link>
            </div>
            <div className="space-y-2 p-4">
              {insight.pendingApps.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-[var(--muted)]">
                  No pending applications
                </p>
              ) : (
                insight.pendingApps.map((s) => {
                  const student = getStudent(s.studentId);
                  const program = state.scholarshipPrograms.find((p) => p.id === s.programId);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {student?.name ?? s.studentId}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {program?.name ?? s.type}
                          {student ? ` · ${student.className}-${student.section}` : ""}
                        </p>
                      </div>
                      <Badge tone="warning">pending</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Surface>
        </div>
      </div>

      {/* Lower insight row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),transparent)] px-5 py-4">
            <p className="text-sm font-bold">Class fee pressure</p>
            <p className="text-xs text-[var(--muted)]">Where open dues concentrate</p>
          </div>
          <div className="space-y-3 p-4">
            {insight.classPressure.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--muted)]">No open dues</p>
            ) : (
              insight.classPressure.map((row) => (
                <div key={row.className}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{row.className}</span>
                    <span className="font-bold tabular-nums">{formatINR(row.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${Math.max(8, (row.amount / insight.maxClassAmount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[0.7rem] text-[var(--muted)]">
                    {row.students} student{row.students === 1 ? "" : "s"} with open dues
                  </p>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">Messages in period</p>
                <p className="text-xs text-[var(--muted)]">
                  {insight.messagesInPeriod} send{insight.messagesInPeriod === 1 ? "" : "s"}
                </p>
              </div>
              <Link href="/admin/communications">
                <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {insight.recentMessages.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">No messages in this period</p>
            ) : (
              insight.recentMessages.map((m) => (
                <div key={m.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={m.status === "sent" ? "success" : m.status === "failed" ? "danger" : "neutral"}>
                      {m.channel}
                    </Badge>
                    <span className="text-[0.65rem] text-[var(--muted)]">{formatDate(m.sentAt)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--ink-2)]">{m.message}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{m.recipient}</p>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">Ops checklist</p>
                <p className="text-xs text-[var(--muted)]">Live systems & queues</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4">
            {[
              {
                label: "Payment apps live",
                value: `${insight.liveGateways}/${state.gateways.length}`,
                href: "/admin/gateways",
                ok: insight.liveGateways > 0,
              },
              {
                label: "Open help tickets",
                value: String(insight.openTickets),
                href: "/admin/support",
                ok: insight.openTickets === 0,
              },
              {
                label: "AI activity in period",
                value: String(insight.aiInPeriod),
                href: "/admin/ai-collection",
                ok: true,
              },
              {
                label: "AI still queued",
                value: String(insight.aiQueued),
                href: "/admin/ai-collection",
                ok: insight.aiQueued === 0,
              },
              {
                label: "Scholarship reviews",
                value: String(insight.pendingScholarships),
                href: "/admin/scholarships",
                ok: insight.pendingScholarships === 0,
              },
              {
                label: "Gentle reminders",
                value: state.gentleReminders.enabled ? "On" : "Off",
                href: "/admin/ai-collection",
                ok: state.gentleReminders.enabled,
              },
            ].map((row) => (
              <Link
                key={row.label}
                href={row.href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 transition hover:bg-[var(--bg)]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      row.ok ? "bg-[var(--success)]" : "bg-[var(--warn)]"
                    }`}
                  />
                  <span className="text-sm font-semibold">{row.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-[var(--ink-2)]">{row.value}</span>
              </Link>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
