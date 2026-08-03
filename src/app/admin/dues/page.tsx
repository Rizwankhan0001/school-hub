"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Mail,
  MessageSquare,
  Search,
  Send,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  dueStatusLabel,
  formatDate,
  formatINR,
  outstanding,
} from "@/lib/format";
import type { DueStatus } from "@/lib/types";

const STATUS_META: Record<
  Exclude<DueStatus, "paid">,
  { tone: "danger" | "warning" | "info" | "neutral"; wash: string }
> = {
  overdue: {
    tone: "danger",
    wash: "from-[rgba(225,29,72,0.12)] via-[rgba(225,29,72,0.04)] to-white",
  },
  due_today: {
    tone: "warning",
    wash: "from-[rgba(212,146,48,0.14)] via-[rgba(212,146,48,0.04)] to-white",
  },
  upcoming: {
    tone: "info",
    wash: "from-[rgba(36,91,255,0.12)] via-[rgba(36,91,255,0.04)] to-white",
  },
  partial: {
    tone: "info",
    wash: "from-[rgba(0,166,126,0.12)] via-[rgba(0,166,126,0.04)] to-white",
  },
};

function classSortKey(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 999;
}

export default function DuesPage() {
  const { state, metrics, getStudent, sendReminder } = useApp();
  const [filter, setFilter] = useState<"all" | DueStatus>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [q, setQ] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const openDues = useMemo(
    () => state.dues.filter((d) => d.status !== "paid"),
    [state.dues],
  );

  const counts = useMemo(() => {
    const base = { overdue: 0, due_today: 0, upcoming: 0, partial: 0 };
    for (const d of openDues) {
      if (d.status in base) base[d.status as keyof typeof base] += 1;
    }
    return base;
  }, [openDues]);

  const classes = useMemo(() => {
    const set = new Set<string>();
    for (const d of openDues) {
      const s = getStudent(d.studentId);
      if (s) set.add(s.className);
    }
    return Array.from(set).sort((a, b) => classSortKey(a) - classSortKey(b));
  }, [openDues, getStudent]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return openDues
      .filter((d) => filter === "all" || d.status === filter)
      .map((d) => ({ due: d, student: getStudent(d.studentId) }))
      .filter(({ due, student }) => {
        if (classFilter !== "all" && student?.className !== classFilter) return false;
        if (!term) return true;
        return (
          (student?.name ?? "").toLowerCase().includes(term) ||
          (student?.admissionNo ?? "").toLowerCase().includes(term) ||
          due.installmentName.toLowerCase().includes(term) ||
          (student?.className ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const rank = (s: string) =>
          s === "overdue" ? 0 : s === "due_today" ? 1 : s === "partial" ? 2 : 3;
        const r = rank(a.due.status) - rank(b.due.status);
        if (r !== 0) return r;
        return a.due.dueDate.localeCompare(b.due.dueDate);
      });
  }, [openDues, filter, classFilter, q, getStudent]);

  function remind(dueId: string, channel: "sms" | "email" | "whatsapp", name?: string) {
    sendReminder(dueId, channel);
    setBanner(`Reminder sent via ${channel.toUpperCase()}${name ? ` to ${name}` : ""}.`);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Who owes"
        description="See overdue, due-today, and upcoming fees — remind parents in one click."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/payments">
              <Button variant="soft">
                Record payment <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/fines">
              <Button variant="ghost">Late fees</Button>
            </Link>
            <Link href="/admin/receipts">
              <Button variant="ghost">Receipts</Button>
            </Link>
          </div>
        }
      />

      {banner ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{banner}</p>
          <button type="button" onClick={() => setBanner(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Still unpaid" value={formatINR(metrics.totalDue)} tone="accent" />
        <Stat label="Overdue" value={formatINR(metrics.overdue)} tone="danger" hint={`${counts.overdue} dues`} />
        <Stat label="Due today" value={formatINR(metrics.dueToday)} hint={`${counts.due_today} dues`} />
        <Stat label="Upcoming" value={formatINR(metrics.upcoming)} tone="success" hint={`${counts.upcoming} dues`} />
      </div>

      {/* Status cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["all", "All open", openDues.length, "from-[rgba(0,166,126,0.1)] to-white"],
            ["overdue", "Overdue", counts.overdue, STATUS_META.overdue.wash],
            ["due_today", "Due today", counts.due_today, STATUS_META.due_today.wash],
            ["upcoming", "Upcoming", counts.upcoming, STATUS_META.upcoming.wash],
          ] as const
        ).map(([key, label, count, wash]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key === "all" ? "all" : key)}
            className={`rounded-[1.25rem] border bg-gradient-to-br ${wash} px-4 py-3.5 text-left transition ${
              filter === key
                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/25"
                : "border-[var(--line)] hover:border-[var(--line-strong)]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
              {count}
            </p>
          </button>
        ))}
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(225,29,72,0.06),rgba(0,166,126,0.05))] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--danger)]" />
            <div>
              <p className="text-sm font-bold">Open dues</p>
              <p className="text-xs text-[var(--muted)]">
                Showing <span className="font-semibold text-[var(--ink)]">{rows.length}</span>
                {filter !== "all" ? ` · ${dueStatusLabel(filter)}` : ""}
                {classFilter !== "all" ? ` · ${classFilter}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[200px] sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                placeholder="Search student, ID, fee…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select
              className="w-full sm:w-40"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              className="w-full sm:w-40"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">All open</option>
              <option value="overdue">Overdue</option>
              <option value="due_today">Due today</option>
              <option value="upcoming">Upcoming</option>
              <option value="partial">Partial</option>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No matching dues" description="Try another filter or search." />
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {rows.map(({ due: d, student }) => {
              const meta =
                d.status === "paid"
                  ? STATUS_META.upcoming
                  : STATUS_META[d.status as Exclude<DueStatus, "paid">];
              const amt = outstanding(d.amount, d.fine, d.paidAmount);
              return (
                <div
                  key={d.id}
                  className={`rounded-[1.25rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[0.65rem] font-bold text-white">
                        {(student?.name ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold tracking-[-0.02em]">{student?.name ?? d.studentId}</p>
                          <Badge tone={meta.tone}>{dueStatusLabel(d.status)}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          {d.installmentName}
                          {student
                            ? ` · ${student.className}-${student.section} · ${student.admissionNo}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Due {formatDate(d.dueDate)} · Base {formatINR(d.amount)}
                          {d.fine > 0 ? ` · Fine ${formatINR(d.fine)}` : ""}
                          {d.paidAmount > 0 ? ` · Paid ${formatINR(d.paidAmount)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-xs font-semibold text-[var(--muted)]">Outstanding</p>
                      <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                        {formatINR(amt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {student ? (
                      <Link href={`/admin/students/${student.id}`}>
                        <Button size="sm" variant="ghost">
                          <Users className="h-3.5 w-3.5" /> Profile
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      size="sm"
                      variant="soft"
                      type="button"
                      onClick={() => remind(d.id, "sms", student?.name)}
                    >
                      <Send className="h-3.5 w-3.5" /> SMS
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => remind(d.id, "email", student?.name)}
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => remind(d.id, "whatsapp", student?.name)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                    <Link href="/admin/payments">
                      <Button size="sm" type="button">
                        Collect
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
