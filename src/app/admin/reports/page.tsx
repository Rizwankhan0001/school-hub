"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChartColumnIncreasing,
  ChevronRight,
  DoorOpen,
  Layers3,
  MessageSquare,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatINR, methodLabel, outstanding } from "@/lib/format";
import type { NotificationChannel, PaymentMethod } from "@/lib/types";

type ReportView =
  | "hub"
  | "overview"
  | "classes"
  | "monthly"
  | "methods"
  | "channels";

const REPORTS: Array<{
  id: Exclude<ReportView, "hub">;
  title: string;
  blurb: string;
  wash: string;
  icon: typeof TrendingUp;
}> = [
  {
    id: "overview",
    title: "Recovery overview",
    blurb: "Collected vs open dues, pending families, and collection rate.",
    wash: "from-[rgba(0,166,126,0.16)] via-[rgba(0,166,126,0.05)] to-white",
    icon: TrendingUp,
  },
  {
    id: "classes",
    title: "Class-wise dues",
    blurb: "Which classes still owe — outstanding amount and pending students.",
    wash: "from-[rgba(36,91,255,0.14)] via-[rgba(36,91,255,0.04)] to-white",
    icon: Layers3,
  },
  {
    id: "monthly",
    title: "Monthly collection",
    blurb: "Successful payments rolled up by month for leadership.",
    wash: "from-[rgba(212,146,48,0.14)] via-[rgba(212,146,48,0.04)] to-white",
    icon: ChartColumnIncreasing,
  },
  {
    id: "methods",
    title: "Payment methods",
    blurb: "How parents paid — UPI, card, cash, netbanking, and more.",
    wash: "from-[rgba(0,166,126,0.1)] via-[rgba(36,91,255,0.06)] to-white",
    icon: Wallet,
  },
  {
    id: "channels",
    title: "Message channels",
    blurb: "SMS, WhatsApp, email, and push volume from the communication log.",
    wash: "from-[rgba(10,12,16,0.08)] via-[rgba(0,166,126,0.05)] to-white",
    icon: MessageSquare,
  },
];

function classSortKey(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 999;
}

function BarRow({
  label,
  valueLabel,
  pct,
  hint,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold">{label}</p>
          {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
        </div>
        <span className="shrink-0 font-bold tabular-nums">{valueLabel}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--ink-soft)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] transition-[width]"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { state, metrics, user } = useApp();
  const [view, setView] = useState<ReportView>("hub");
  const isAccountant = user?.role === "accountant";
  const reportCards = useMemo(
    () => (isAccountant ? REPORTS.filter((r) => r.id !== "channels") : REPORTS),
    [isAccountant],
  );

  const byClass = useMemo(() => {
    const map = new Map<string, { due: number; students: Set<string> }>();
    for (const d of state.dues.filter((x) => x.status !== "paid")) {
      const student = state.students.find((s) => s.id === d.studentId);
      if (!student) continue;
      const row = map.get(student.className) ?? { due: 0, students: new Set() };
      row.due += outstanding(d.amount, d.fine, d.paidAmount);
      row.students.add(student.id);
      map.set(student.className, row);
    }
    return Array.from(map.entries())
      .map(([className, v]) => ({
        className,
        due: v.due,
        students: v.students.size,
      }))
      .sort((a, b) => b.due - a.due || classSortKey(a.className) - classSortKey(b.className));
  }, [state.dues, state.students]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of state.payments.filter((x) => x.status === "success")) {
      const key = new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
      }).format(new Date(p.paidAt));
      map.set(key, (map.get(key) ?? 0) + p.amount);
    }
    return Array.from(map.entries());
  }, [state.payments]);

  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod, { count: number; amount: number }>();
    for (const p of state.payments.filter((x) => x.status === "success")) {
      const row = map.get(p.method) ?? { count: 0, amount: 0 };
      row.count += 1;
      row.amount += p.amount;
      map.set(p.method, row);
    }
    return Array.from(map.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.payments]);

  const byChannel = useMemo(() => {
    const map = new Map<NotificationChannel, number>();
    for (const c of state.communications) {
      map.set(c.channel, (map.get(c.channel) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);
  }, [state.communications]);

  const byGateway = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const p of state.payments.filter((x) => x.status === "success")) {
      const row = map.get(p.gateway) ?? { count: 0, amount: 0 };
      row.count += 1;
      row.amount += p.amount;
      map.set(p.gateway, row);
    }
    return Array.from(map.entries())
      .map(([gateway, v]) => ({ gateway, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.payments]);

  const scholarshipStats = useMemo(() => {
    const pending = state.scholarships.filter((s) => s.status === "pending").length;
    const approved = state.scholarships.filter((s) => s.status === "approved").length;
    const rejected = state.scholarships.filter((s) => s.status === "rejected").length;
    return { pending, approved, rejected, total: state.scholarships.length };
  }, [state.scholarships]);

  const overdueShare =
    metrics.totalDue > 0 ? Math.round((metrics.overdue / metrics.totalDue) * 100) : 0;

  const activeReport = reportCards.find((r) => r.id === view) ?? REPORTS.find((r) => r.id === view);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Reports"
        description="Collection, class dues, payment mix, and messaging volume for school leadership."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/payments">
              <Button variant="soft">
                Payments <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/dues">
              <Button variant="ghost">Who owes</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Collected YTD" value={formatINR(metrics.collected)} tone="success" />
        <Stat label="Open dues" value={formatINR(metrics.totalDue)} tone="danger" />
        <Stat label="Collection rate" value={`${metrics.collectionRate}%`} tone="accent" />
        <Stat
          label="Pending families"
          value={String(metrics.pendingStudents)}
          hint={`${overdueShare}% of open is overdue`}
        />
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),rgba(36,91,255,0.05))] px-4 py-3.5 sm:px-5">
          <ChartColumnIncreasing className="h-4 w-4 text-[var(--accent)]" />
          {view === "hub" ? (
            <p className="text-sm font-bold">Report map</p>
          ) : (
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setView("hub")}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Report map
              </button>
              <span>/</span>
              <span className="font-semibold text-[var(--ink)]">
                {activeReport?.title ?? "Report"}
              </span>
            </nav>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === "hub" ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-5"
            >
              <div className="mb-4">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                  Choose a report
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Open any tile for a focused analytics view.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {reportCards.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div
                      key={r.id}
                      className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${r.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/90 text-[var(--accent)] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                            {r.title}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{r.blurb}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setView(r.id)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                      >
                        <DoorOpen className="h-4 w-4" /> Open
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${activeReport?.wash ?? "from-[rgba(0,166,126,0.1)] to-white"} px-4 py-5 sm:px-6`}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setView("hub")}
                    className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      {activeReport?.title}
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                      {activeReport?.blurb}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {view === "overview" ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4 rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                      <p className="text-sm font-bold">Recovery snapshot</p>
                      <BarRow
                        label="Collected"
                        valueLabel={formatINR(metrics.collected)}
                        pct={metrics.collectionRate}
                        hint={`${metrics.collectionRate}% of billed`}
                      />
                      <BarRow
                        label="Still unpaid"
                        valueLabel={formatINR(metrics.totalDue)}
                        pct={100 - metrics.collectionRate}
                        hint={`${metrics.pendingStudents} families`}
                      />
                      <BarRow
                        label="Overdue share"
                        valueLabel={formatINR(metrics.overdue)}
                        pct={overdueShare}
                        hint={`${overdueShare}% of open dues`}
                      />
                      <BarRow
                        label="Due today"
                        valueLabel={formatINR(metrics.dueToday)}
                        pct={
                          metrics.totalDue > 0
                            ? (metrics.dueToday / metrics.totalDue) * 100
                            : 0
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                        <p className="text-sm font-bold">Scholarship pipeline</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-[var(--bg)] px-2 py-3">
                            <p className="text-xl font-bold">{scholarshipStats.pending}</p>
                            <p className="text-xs text-[var(--muted)]">Pending</p>
                          </div>
                          <div className="rounded-xl bg-[var(--bg)] px-2 py-3">
                            <p className="text-xl font-bold text-[var(--success)]">
                              {scholarshipStats.approved}
                            </p>
                            <p className="text-xs text-[var(--muted)]">Approved</p>
                          </div>
                          <div className="rounded-xl bg-[var(--bg)] px-2 py-3">
                            <p className="text-xl font-bold">{scholarshipStats.rejected}</p>
                            <p className="text-xs text-[var(--muted)]">Rejected</p>
                          </div>
                        </div>
                        <Link
                          href="/admin/scholarships"
                          className="mt-3 inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
                        >
                          Open scholarships →
                        </Link>
                      </div>

                      <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                        <p className="text-sm font-bold">Gateway mix (success)</p>
                        <div className="mt-3 space-y-3">
                          {byGateway.length === 0 ? (
                            <p className="text-sm text-[var(--muted)]">No successful payments yet.</p>
                          ) : (
                            byGateway.map((g) => {
                              const max = Math.max(...byGateway.map((x) => x.amount), 1);
                              return (
                                <BarRow
                                  key={g.gateway}
                                  label={g.gateway}
                                  valueLabel={formatINR(g.amount)}
                                  pct={(g.amount / max) * 100}
                                  hint={`${g.count} payment${g.count === 1 ? "" : "s"}`}
                                />
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {view === "classes" ? (
                  byClass.length === 0 ? (
                    <EmptyState
                      title="No open dues"
                      description="Every class is clear — nothing outstanding to report."
                    />
                  ) : (
                    <div className="space-y-4">
                      {byClass.map((r) => {
                        const max = Math.max(...byClass.map((x) => x.due), 1);
                        return (
                          <div
                            key={r.className}
                            className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4"
                          >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                                  Class {r.className}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                  {r.students} pending student{r.students === 1 ? "" : "s"}
                                </p>
                              </div>
                              <Badge tone="danger">{formatINR(r.due)}</Badge>
                            </div>
                            <BarRow
                              label="Outstanding"
                              valueLabel={formatINR(r.due)}
                              pct={(r.due / max) * 100}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : null}

                {view === "monthly" ? (
                  monthly.length === 0 ? (
                    <EmptyState
                      title="No collections yet"
                      description="Successful payments will appear here by month."
                    />
                  ) : (
                    <div className="space-y-4 rounded-[1.25rem] border border-[var(--line)] bg-white p-5">
                      {monthly.map(([month, amount]) => {
                        const max = Math.max(...monthly.map(([, a]) => a), 1);
                        return (
                          <BarRow
                            key={month}
                            label={month}
                            valueLabel={formatINR(amount)}
                            pct={(amount / max) * 100}
                          />
                        );
                      })}
                    </div>
                  )
                ) : null}

                {view === "methods" ? (
                  byMethod.length === 0 ? (
                    <EmptyState
                      title="No payment methods yet"
                      description="Successful payments will break down by method here."
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {byMethod.map((m) => {
                        const max = Math.max(...byMethod.map((x) => x.amount), 1);
                        return (
                          <div
                            key={m.method}
                            className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <p className="font-bold">{methodLabel(m.method)}</p>
                              <Badge tone="accent">{m.count}</Badge>
                            </div>
                            <BarRow
                              label="Collected"
                              valueLabel={formatINR(m.amount)}
                              pct={(m.amount / max) * 100}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : null}

                {view === "channels" ? (
                  byChannel.length === 0 ? (
                    <EmptyState
                      title="No messages logged"
                      description="Communication sends will show channel volume here."
                    />
                  ) : (
                    <div className="space-y-4 rounded-[1.25rem] border border-[var(--line)] bg-white p-5">
                      {byChannel.map((c) => {
                        const max = Math.max(...byChannel.map((x) => x.count), 1);
                        return (
                          <BarRow
                            key={c.channel}
                            label={c.channel.toUpperCase()}
                            valueLabel={String(c.count)}
                            pct={(c.count / max) * 100}
                            hint="messages logged"
                          />
                        );
                      })}
                      <Link
                        href="/admin/communications"
                        className="inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
                      >
                        Open messages →
                      </Link>
                    </div>
                  )
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
