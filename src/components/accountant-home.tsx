"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  CalendarDays,
  CreditCard,
  Percent,
  Receipt,
  Wallet,
} from "lucide-react";
import { Badge, Button, Input, Select, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/seed";
import {
  dueStatusLabel,
  formatDate,
  formatDateTime,
  formatINR,
  methodLabel,
  outstanding,
} from "@/lib/format";

type PeriodKey = "today" | "yesterday" | "7" | "14" | "30" | "custom" | "all";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom last N days" },
  { value: "all", label: "All time" },
];

const MONEY_LINKS = [
  { href: "/admin/dues", label: "Who owes", hint: "Chase open dues", icon: Bell },
  { href: "/admin/payments", label: "Payments", hint: "Collect & ledger", icon: CreditCard },
  { href: "/admin/receipts", label: "Receipts", hint: "Issue & download", icon: Receipt },
  { href: "/admin/staff-fees", label: "Payroll", hint: "Pay teachers & staff", icon: Briefcase },
  { href: "/admin/fines", label: "Late fees", hint: "Rules & overdue", icon: Percent },
  { href: "/admin/fees", label: "Fee plans", hint: "Heads & amounts", icon: Wallet },
  { href: "/admin/scholarships", label: "Scholarships", hint: "Fee waivers", icon: Award },
] as const;

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
  return { start, end: today, label: `Last ${days} days` };
}

function inRange(iso: string, start: string | null, end: string | null) {
  if (!start || !end) return true;
  const d = dayOf(iso);
  return d >= start && d <= end;
}

function ProgressRing({
  value,
  size = 108,
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

export function AccountantHome() {
  const { metrics, state, sendReminder, getStudent, user } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("30");
  const [customDays, setCustomDays] = useState(7);
  const [banner, setBanner] = useState<string | null>(null);

  const range = useMemo(
    () => resolveRange(period, customDays, DEMO_TODAY),
    [period, customDays],
  );

  const data = useMemo(() => {
    const { start, end } = range;
    const openDues = state.dues.filter((d) => d.status !== "paid");
    const overdueCount = openDues.filter((d) => d.status === "overdue").length;
    const dueTodayCount = openDues.filter((d) => d.status === "due_today").length;

    const periodPays = state.payments
      .filter((p) => inRange(p.paidAt, start, end))
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const successPays = periodPays.filter((p) => p.status === "success");
    const collectedInPeriod = successPays.reduce((s, p) => s + p.amount, 0);
    const failedInPeriod = periodPays.filter((p) => p.status === "failed").length;
    const recentPays = periodPays.slice(0, 8);

    const receiptsInPeriod = state.receipts.filter((r) => inRange(r.issuedAt, start, end));
    const receiptTotal = receiptsInPeriod.reduce((s, r) => s + r.amount, 0);

    const byClass = new Map<string, { amount: number; students: Set<string> }>();
    for (const d of openDues) {
      const st = getStudent(d.studentId);
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

    const attention = [...openDues]
      .filter((d) => d.status === "overdue" || d.status === "due_today" || d.status === "partial")
      .sort((a, b) => {
        const rank = (s: string) =>
          s === "overdue" ? 0 : s === "due_today" ? 1 : s === "partial" ? 2 : 3;
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 8);

    const pendingScholarships = state.scholarships.filter((s) => s.status === "pending").length;
    const fineOnOpen = openDues.reduce((s, d) => s + d.fine, 0);
    const staffDue = state.staffSalaries.filter((d) => d.status === "due");
    const staffOwed = staffDue.reduce((s, d) => s + d.netAmount, 0);

    const rangeHint =
      start && end
        ? start === end
          ? formatDate(start)
          : `${formatDate(start)} – ${formatDate(end)}`
        : "All recorded activity";

    return {
      overdueCount,
      dueTodayCount,
      collectedInPeriod,
      paymentCountInPeriod: periodPays.length,
      successCount: successPays.length,
      failedInPeriod,
      recentPays,
      receiptsInPeriod: receiptsInPeriod.length,
      receiptTotal,
      classPressure,
      attention,
      pendingScholarships,
      fineOnOpen,
      staffOwed,
      staffOpenCount: staffDue.length,
      rangeHint,
      maxClassAmount: Math.max(1, ...classPressure.map((c) => c.amount)),
    };
  }, [state, range, getStudent]);

  const greet = user?.name?.split(" ")[0] ?? "Accountant";

  return (
    <div className="animate-rise">
      <div className="relative mb-4 overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[linear-gradient(135deg,#0a0c10_0%,#0f2f3a_45%,#0a0c10_100%)] text-white shadow-[0_28px_60px_-36px_rgba(10,12,16,0.7)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 14% 18%, rgba(0,166,126,0.42), transparent 42%), radial-gradient(circle at 90% 12%, rgba(36,91,255,0.22), transparent 34%)",
          }}
        />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/75 ring-1 ring-white/15">
              Finance desk · {state.school.academicSession}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[2.45rem]">
              Good day, {greet}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-[0.98rem]">
              Money only — collect fees, clear dues, issue receipts, and watch collection health for{" "}
              {state.school.name}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/admin/payments">
                <Button>
                  Record payment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/dues">
                <Button
                  variant="ghost"
                  className="bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Who owes
                </Button>
              </Link>
              <Link href="/admin/staff-fees">
                <Button
                  variant="ghost"
                  className="bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Payroll
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
                Collected in period
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em] text-[var(--accent)]">
                {formatINR(data.collectedInPeriod)}
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
                Receipts in period
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                {data.receiptsInPeriod}
              </p>
            </div>
          </div>
        </div>
      </div>

      {banner ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{banner}</p>
          <button type="button" onClick={() => setBanner(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <Surface className="mb-6 overflow-hidden p-0">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-[-0.01em]">Money period</p>
              <p className="text-xs text-[var(--muted)]">
                Showing collections for{" "}
                <span className="font-semibold text-[var(--ink)]">{range.label}</span>
                {" · "}
                {data.rangeHint}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              className="w-full sm:w-48"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              aria-label="Money period"
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

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MONEY_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[1.25rem] border border-[var(--line)] bg-white p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_18px_40px_-28px_rgba(10,12,16,0.4)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-bold tracking-[-0.01em]">{item.label}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{item.hint}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_1.35fr]">
        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.05))] px-5 py-4">
            <p className="text-sm font-bold">Collection health</p>
            <p className="text-xs text-[var(--muted)]">
              Lifetime rate · {data.successCount} successful payments in period
            </p>
          </div>
          <div className="flex items-center gap-5 p-5">
            <div className="relative shrink-0">
              <ProgressRing value={metrics.collectionRate} />
              <div className="absolute inset-0 grid place-items-center">
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
                  <span className="font-bold text-[var(--success)]">
                    {formatINR(metrics.collected)}
                  </span>
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
                  <p className="text-[var(--muted)]">Fines on open</p>
                  <p className="mt-0.5 font-bold">{formatINR(data.fineOnOpen)}</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                  <p className="text-[var(--muted)]">Receipt total</p>
                  <p className="mt-0.5 font-bold text-[var(--success)]">
                    {formatINR(data.receiptTotal)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                  <p className="text-[var(--muted)]">Payroll due</p>
                  <p className="mt-0.5 font-bold">{formatINR(data.staffOwed)}</p>
                </div>
                <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                  <p className="text-[var(--muted)]">Failed pays</p>
                  <p className="mt-0.5 font-bold">{data.failedInPeriod}</p>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Class pressure</p>
              <p className="text-xs text-[var(--muted)]">Outstanding by class</p>
            </div>
            <Link href="/admin/reports" className="text-xs font-bold text-[var(--accent)] hover:underline">
              Full reports →
            </Link>
          </div>
          <div className="space-y-3 p-5">
            {data.classPressure.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--muted)]">No open dues — clear books.</p>
            ) : (
              data.classPressure.map((c) => (
                <div key={c.className}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="font-semibold">
                      Class {c.className}
                      <span className="ml-2 text-xs font-medium text-[var(--muted)]">
                        {c.students} student{c.students === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="font-bold tabular-nums">{formatINR(c.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))]"
                      style={{ width: `${(c.amount / data.maxClassAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Needs attention</p>
              <p className="text-xs text-[var(--muted)]">
                {data.overdueCount} overdue · {data.dueTodayCount} due today
              </p>
            </div>
            <Link href="/admin/dues">
              <Button size="sm" variant="soft">
                Open queue
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.attention.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                Nothing urgent — all clear for now.
              </p>
            ) : (
              data.attention.map((d) => {
                const student = getStudent(d.studentId);
                const owed = outstanding(d.amount, d.fine, d.paidAmount);
                return (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{student?.name ?? "Student"}</p>
                        <Badge
                          tone={
                            d.status === "overdue"
                              ? "danger"
                              : d.status === "due_today"
                                ? "warning"
                                : "info"
                          }
                        >
                          {dueStatusLabel(d.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {student?.className}-{student?.section} · {d.installmentName} · due{" "}
                        {formatDate(d.dueDate)} · {formatINR(owed)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => {
                          sendReminder(d.id, "whatsapp");
                          setBanner(`WhatsApp reminder sent for ${student?.name ?? "parent"}.`);
                        }}
                      >
                        Remind
                      </Button>
                      <Link href="/admin/payments">
                        <Button size="sm">Collect</Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Recent payments</p>
              <p className="text-xs text-[var(--muted)]">
                {data.paymentCountInPeriod} in period · {formatINR(data.collectedInPeriod)} collected
              </p>
            </div>
            <Link href="/admin/payments">
              <Button size="sm" variant="soft">
                Ledger
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.recentPays.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                No payments in this period.
              </p>
            ) : (
              data.recentPays.map((p) => {
                const student = getStudent(p.studentId);
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{student?.name ?? "Student"}</p>
                        <Badge
                          tone={
                            p.status === "success"
                              ? "success"
                              : p.status === "failed"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {methodLabel(p.method)} · {p.gateway} · {formatDateTime(p.paidAt)}
                      </p>
                    </div>
                    <p className="font-bold tabular-nums">{formatINR(p.amount)}</p>
                  </div>
                );
              })
            )}
          </div>
          {data.pendingScholarships > 0 || data.staffOpenCount > 0 ? (
            <div className="space-y-2 border-t border-[var(--line)] bg-[var(--bg)] px-5 py-3 text-sm">
              {data.staffOpenCount > 0 ? (
                <Link
                  href="/admin/staff-fees"
                  className="block font-bold text-[var(--accent)] hover:underline"
                >
                  {data.staffOpenCount} salary line
                  {data.staffOpenCount === 1 ? "" : "s"} due · {formatINR(data.staffOwed)} →
                </Link>
              ) : null}
              {data.pendingScholarships > 0 ? (
                <Link
                  href="/admin/scholarships"
                  className="block font-bold text-[var(--accent)] hover:underline"
                >
                  {data.pendingScholarships} scholarship application
                  {data.pendingScholarships === 1 ? "" : "s"} awaiting review →
                </Link>
              ) : null}
            </div>
          ) : null}
        </Surface>
      </div>
    </div>
  );
}
