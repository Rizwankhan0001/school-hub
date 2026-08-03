"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DoorOpen,
  LayoutGrid,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/seed";
import { formatDate, formatINR, planLabel } from "@/lib/format";
import type { Installment, InstallmentPlan } from "@/lib/types";

const CLASS_ORDER = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const PLANS: InstallmentPlan[] = ["monthly", "quarterly", "half_yearly", "annual"];

const STAGE_META = {
  Primary: {
    label: "Primary",
    range: "1 – 5",
    tone: "bg-[var(--accent-soft)] text-[var(--teal-deep)]",
    bar: "bg-[var(--accent)]",
    wash: "from-[rgba(0,166,126,0.18)] via-[rgba(0,166,126,0.05)] to-white",
    ring: "ring-[var(--accent)]",
    number: "text-[var(--accent)]",
  },
  Middle: {
    label: "Middle",
    range: "6 – 8",
    tone: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
    bar: "bg-[var(--accent-2)]",
    wash: "from-[rgba(36,91,255,0.16)] via-[rgba(36,91,255,0.04)] to-white",
    ring: "ring-[var(--accent-2)]",
    number: "text-[var(--accent-2)]",
  },
  Senior: {
    label: "Senior",
    range: "9 – 12",
    tone: "bg-[var(--ink-soft)] text-[var(--ink)]",
    bar: "bg-[var(--ink)]",
    wash: "from-[rgba(10,12,16,0.1)] via-[rgba(0,166,126,0.05)] to-white",
    ring: "ring-[var(--ink)]",
    number: "text-[var(--ink)]",
  },
} as const;

type Stage = keyof typeof STAGE_META;

function classSortKey(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 999;
}

function stageForClass(className: string): Stage {
  const n = classSortKey(className);
  if (n <= 5) return "Primary";
  if (n <= 8) return "Middle";
  return "Senior";
}

function dueState(dueDate: string): "past" | "today" | "upcoming" {
  if (dueDate === DEMO_TODAY) return "today";
  return dueDate < DEMO_TODAY ? "past" : "upcoming";
}

function dueBadge(dueDate: string) {
  const s = dueState(dueDate);
  if (s === "today") return { label: "Due today", tone: "warning" as const };
  if (s === "past") return { label: "Past due date", tone: "neutral" as const };
  return { label: "Upcoming", tone: "success" as const };
}

function InstallmentRow({ item }: { item: Installment }) {
  const badge = dueBadge(item.dueDate);
  const state = dueState(item.dueDate);
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-transparent bg-white px-3 py-3 sm:gap-4 sm:px-4">
      <span
        className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${
          state === "upcoming"
            ? "bg-[var(--ink)]"
            : state === "today"
              ? "bg-[var(--warn)]"
              : "bg-[var(--muted-2)]"
        }`}
      >
        {state === "past" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : state === "today" ? (
          <Clock3 className="h-4 w-4" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold tracking-[-0.02em]">{item.name}</p>
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <Badge tone="info">{planLabel(item.plan)}</Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
          Due {formatDate(item.dueDate)}
          <span className="mx-1.5 text-[var(--line-strong)]">·</span>
          Session {item.academicSession}
          <span className="mx-1.5 text-[var(--line-strong)]">·</span>
          <span className="font-mono">{item.id}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em]">
          {formatINR(item.amount)}
        </p>
        <Link
          href="/admin/dues"
          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
        >
          Related dues <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function InstallmentsPage() {
  const { state, addInstallment } = useApp();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<"all" | InstallmentPlan>("all");
  const [timingFilter, setTimingFilter] = useState<"all" | "upcoming" | "past" | "today">("all");
  const [focusInstallmentId, setFocusInstallmentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    className: "Class 1",
    plan: "quarterly" as InstallmentPlan,
    name: "Q1",
    amount: 10000,
    dueDate: "2026-04-10",
  });

  const stats = useMemo(() => {
    const total = state.installments.length;
    const classes = new Set(state.installments.map((i) => i.className)).size;
    const scheduled = state.installments.reduce((s, i) => s + i.amount, 0);
    const upcoming = state.installments
      .filter((i) => i.dueDate >= DEMO_TODAY)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const byStage = { Primary: 0, Middle: 0, Senior: 0 };
    for (const i of state.installments) byStage[stageForClass(i.className)] += 1;
    return {
      total,
      classes,
      scheduled,
      next: upcoming[0] ?? null,
      upcomingCount: upcoming.length,
      byStage,
    };
  }, [state.installments]);

  const classMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<
      string,
      { items: Installment[]; totalAmount: number; plans: Set<InstallmentPlan> }
    >();

    for (const i of state.installments) {
      const stage = stageForClass(i.className);
      if (stageFilter !== "all" && stage !== stageFilter) continue;
      if (planFilter !== "all" && i.plan !== planFilter) continue;
      if (timingFilter !== "all" && dueState(i.dueDate) !== timingFilter) continue;
      if (term) {
        const hay = [i.name, i.className, i.id, planLabel(i.plan)].join(" ").toLowerCase();
        if (!hay.includes(term)) continue;
      }
      const entry = map.get(i.className) ?? {
        items: [],
        totalAmount: 0,
        plans: new Set<InstallmentPlan>(),
      };
      entry.items.push(i);
      entry.totalAmount += i.amount;
      entry.plans.add(i.plan);
      map.set(i.className, entry);
    }

    return CLASS_ORDER.filter((c) => {
      if (stageFilter !== "all" && stageForClass(c) !== stageFilter) return false;
      if (term || planFilter !== "all" || timingFilter !== "all") return map.has(c);
      return true;
    }).map((className) => {
      const data = map.get(className);
      const items = [...(data?.items ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return {
        className,
        stage: stageForClass(className),
        items,
        count: items.length,
        totalAmount: data?.totalAmount ?? 0,
        plan: items[0]?.plan ?? ("quarterly" as InstallmentPlan),
        next: items.find((i) => i.dueDate >= DEMO_TODAY) ?? null,
      };
    });
  }, [state.installments, stageFilter, planFilter, timingFilter, q]);

  const classDetail = useMemo(() => {
    if (!selectedClass) return null;
    const term = q.trim().toLowerCase();
    const items = state.installments
      .filter((i) => {
        if (i.className !== selectedClass) return false;
        if (planFilter !== "all" && i.plan !== planFilter) return false;
        if (timingFilter !== "all" && dueState(i.dueDate) !== timingFilter) return false;
        if (focusInstallmentId && i.id !== focusInstallmentId) return false;
        if (!term) return true;
        return (
          i.name.toLowerCase().includes(term) ||
          i.id.toLowerCase().includes(term) ||
          planLabel(i.plan).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const allInClass = state.installments
      .filter((i) => i.className === selectedClass)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      className: selectedClass,
      stage: stageForClass(selectedClass),
      items,
      allInClass,
      totalAmount: items.reduce((s, i) => s + i.amount, 0),
      plan: allInClass[0]?.plan ?? ("quarterly" as InstallmentPlan),
    };
  }, [selectedClass, state.installments, planFilter, timingFilter, focusInstallmentId, q]);

  const selectedMeta = selectedClass ? STAGE_META[stageForClass(selectedClass)] : null;
  const openDues = state.dues.filter((d) => d.status !== "paid").length;

  function openClass(className: string, installmentId?: string) {
    setSelectedClass(className);
    setFocusInstallmentId(installmentId ?? null);
  }

  function backToMap() {
    setSelectedClass(null);
    setFocusInstallmentId(null);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Installments"
        description="Browse fee schedules the same way as students — by stage, class, then open each installment."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dues">
              <Button variant="soft">
                Who owes <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button type="button" onClick={() => setOpen((v) => !v)}>
              <Plus className="h-4 w-4" /> Add installment
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Schedules" value={String(stats.total)} tone="accent" hint="Across all classes" />
        <Stat label="Classes covered" value={String(stats.classes)} />
        <Stat label="Scheduled total" value={formatINR(stats.scheduled)} tone="success" />
        <Stat
          label="Next due"
          value={stats.next ? formatDate(stats.next.dueDate) : "—"}
          hint={
            stats.next
              ? `${stats.next.className} · ${stats.next.name}`
              : `${stats.upcomingCount} upcoming`
          }
        />
      </div>

      {/* Stage cards — same pattern as students */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(STAGE_META) as Stage[]).map((stage) => {
          const meta = STAGE_META[stage];
          const on = stageFilter === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => {
                setStageFilter(on ? "all" : stage);
                backToMap();
              }}
              className={`rounded-[1.25rem] border px-4 py-3.5 text-left transition ${
                on
                  ? `border-transparent bg-gradient-to-br ${meta.wash} ring-2 ${meta.ring}`
                  : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em]">
                    {meta.label}
                  </p>
                  <p className="text-xs font-semibold text-[var(--muted)]">Classes {meta.range}</p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums ${meta.tone}`}>
                  {stats.byStage[stage]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {stats.next ? (
        <Surface className="mb-5 overflow-hidden p-0">
          <div className="flex flex-col gap-3 bg-[linear-gradient(120deg,rgba(0,166,126,0.1),rgba(36,91,255,0.05))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[var(--accent)] shadow-sm">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Coming up next</p>
                <p className="text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">{stats.next.className}</span>
                  {" · "}
                  {stats.next.name} · {formatDate(stats.next.dueDate)} ·{" "}
                  {formatINR(stats.next.amount)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openClass(stats.next!.className, stats.next!.id)}
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
            >
              Open installment <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Surface>
      ) : null}

      {open ? (
        <Surface className="mb-5 overflow-hidden p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <p className="text-sm font-bold">New installment</p>
            <p className="text-xs text-[var(--muted)]">
              Creates a due schedule for {state.school.academicSession}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Field label="Class">
              <Select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {CLASS_ORDER.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Plan">
              <Select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as InstallmentPlan })}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {planLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Installment name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Q1 / Semester 1"
              />
            </Field>
            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim() || !form.amount) return;
                addInstallment(form);
                setOpen(false);
                openClass(form.className);
              }}
            >
              Save installment
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      {/* Class map / detail — student-section pattern */}
      <Surface className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.07),rgba(36,91,255,0.04))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-[var(--accent)]" />
            {selectedClass ? (
              <nav className="flex flex-wrap items-center gap-1.5 text-[var(--muted)]">
                <button
                  type="button"
                  onClick={backToMap}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  All classes
                </button>
                <span>/</span>
                <span className="text-[var(--ink)]">{selectedClass}</span>
                {focusInstallmentId ? (
                  <>
                    <span>/</span>
                    <span className="text-[var(--ink)]">
                      {classDetail?.items[0]?.name ?? "Installment"}
                    </span>
                  </>
                ) : null}
              </nav>
            ) : (
              <span>Class schedule map</span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[200px] flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                placeholder="Search installment, class…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select
              className="w-full sm:w-40"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as "all" | InstallmentPlan)}
            >
              <option value="all">All plans</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {planLabel(p)}
                </option>
              ))}
            </Select>
            <Select
              className="w-full sm:w-40"
              value={timingFilter}
              onChange={(e) =>
                setTimingFilter(e.target.value as "all" | "upcoming" | "past" | "today")
              }
            >
              <option value="all">All dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Due today</option>
              <option value="past">Past dates</option>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedClass ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-5"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                    Choose a class
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Use <span className="font-semibold text-[var(--ink)]">Open</span> on an
                    installment, or open the full class schedule.
                  </p>
                </div>
                {stageFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setStageFilter("all")}
                    className="text-xs font-bold text-[var(--accent)] hover:underline"
                  >
                    Clear stage filter
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {classMap.map((item) => {
                  const meta = STAGE_META[item.stage];
                  const maxAmt = Math.max(1, ...item.items.map((i) => i.amount));
                  return (
                    <div
                      key={item.className}
                      className={`relative overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/90 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.04em] shadow-sm ${meta.number}`}
                          >
                            {classSortKey(item.className)}
                          </span>
                          <div>
                            <p className="font-bold tracking-[-0.02em]">{item.className}</p>
                            <span
                              className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${meta.tone}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums tracking-[-0.04em]">
                            {item.count}
                          </p>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                            dues
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone="info">{planLabel(item.plan)}</Badge>
                        <span className="text-xs font-semibold text-[var(--muted)]">
                          {formatINR(item.totalAmount)} total
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                          Open an installment
                        </p>
                        {item.items.length === 0 ? (
                          <p className="text-xs text-[var(--muted)]">No schedules in this filter</p>
                        ) : (
                          item.items.map((ins) => {
                            const s = dueState(ins.dueDate);
                            return (
                              <div
                                key={ins.id}
                                className="flex items-center gap-2 rounded-2xl bg-white/70 p-1.5 ring-1 ring-[var(--line)]"
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] px-1 text-center text-[0.6rem] font-bold leading-tight text-white">
                                  {ins.name}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-bold text-[var(--ink)]">
                                      {ins.name}
                                    </p>
                                    <p className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-[var(--muted)]">
                                      {formatINR(ins.amount)}
                                    </p>
                                  </div>
                                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                                    <div
                                      className={`h-full rounded-full ${
                                        s === "past"
                                          ? "bg-[var(--line-strong)]"
                                          : s === "today"
                                            ? "bg-[var(--warn)]"
                                            : meta.bar
                                      }`}
                                      style={{
                                        width: `${Math.max(12, (ins.amount / maxAmt) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="mt-1 text-[0.6rem] font-semibold text-[var(--muted)]">
                                    {formatDate(ins.dueDate)} ·{" "}
                                    {s === "past" ? "Past" : s === "today" ? "Today" : "Upcoming"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openClass(item.className, ins.id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-2 text-[0.7rem] font-bold text-white shadow-[0_10px_22px_-14px_rgba(0,166,126,0.85)] transition hover:bg-[var(--accent-hover)]"
                                  aria-label={`Open ${item.className} ${ins.name}`}
                                >
                                  Open
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openClass(item.className)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                      >
                        Open full schedule
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : classDetail ? (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${selectedMeta?.wash} px-4 py-5 sm:px-6`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={backToMap}
                      className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                      aria-label="Back to class map"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                          {classDetail.className}
                        </p>
                        {selectedMeta ? (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${selectedMeta.tone}`}
                          >
                            {selectedMeta.label}
                          </span>
                        ) : null}
                        <Badge tone="info">{planLabel(classDetail.plan)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        <span className="font-semibold text-[var(--ink-2)]">
                          {classDetail.items.length} installment
                          {classDetail.items.length === 1 ? "" : "s"}
                        </span>
                        {" · "}
                        {formatINR(classDetail.totalAmount)} in view
                        {" · "}
                        {openDues} open student dues school-wide
                      </p>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                      <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                      Open installment
                    </p>
                    <div className="inline-flex flex-wrap gap-1.5 rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-[var(--line)]">
                      <button
                        type="button"
                        onClick={() => setFocusInstallmentId(null)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                          !focusInstallmentId
                            ? "bg-[var(--ink)] text-white"
                            : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                        }`}
                      >
                        Full schedule
                        <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[0.65rem] tabular-nums">
                          {classDetail.allInClass.length}
                        </span>
                      </button>
                      {classDetail.allInClass.map((ins) => (
                        <button
                          key={ins.id}
                          type="button"
                          onClick={() => setFocusInstallmentId(ins.id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                            focusInstallmentId === ins.id
                              ? "bg-[var(--accent)] text-white shadow-[0_10px_24px_-14px_rgba(0,166,126,0.8)]"
                              : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                          }`}
                        >
                          Open {ins.name}
                          <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-5 flex gap-1.5">
                  {classDetail.allInClass.map((ins) => {
                    const s = dueState(ins.dueDate);
                    const focused = !focusInstallmentId || focusInstallmentId === ins.id;
                    return (
                      <button
                        key={ins.id}
                        type="button"
                        onClick={() => setFocusInstallmentId(ins.id)}
                        className={`min-w-0 flex-1 rounded-xl p-1 transition ${
                          focused ? "bg-white/70" : "opacity-45"
                        }`}
                      >
                        <div
                          className={`h-2 rounded-full ${
                            s === "past"
                              ? "bg-[var(--line-strong)]"
                              : s === "today"
                                ? "bg-[var(--warn)]"
                                : selectedMeta?.bar ?? "bg-[var(--accent)]"
                          }`}
                        />
                        <p className="mt-1 truncate text-center text-[0.6rem] font-bold text-[var(--muted)]">
                          {ins.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {classDetail.items.length === 0 ? (
                  <EmptyState
                    title="No installments in this view"
                    description="Try clearing search, plan, or timing filters."
                  />
                ) : (
                  <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-muted)]/60 p-1.5 sm:p-2">
                    <div className="divide-y divide-[var(--line)] rounded-[1rem] bg-white">
                      {classDetail.items.map((item) => (
                        <InstallmentRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {focusInstallmentId ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setFocusInstallmentId(null)}
                      className="rounded-xl bg-[var(--bg)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      Show full class schedule
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
