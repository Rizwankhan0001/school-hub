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
  DoorOpen,
  LayoutGrid,
  Percent,
  Plus,
  Search,
  Send,
  Sparkles,
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
import { formatDate, formatINR, outstanding, uid } from "@/lib/format";
import type { FineMode, FineRule } from "@/lib/types";

const MODE_META: Record<
  FineMode,
  { label: string; wash: string; tone: string; bar: string; hint: string }
> = {
  fixed: {
    label: "Fixed",
    wash: "from-[rgba(225,29,72,0.12)] via-[rgba(225,29,72,0.04)] to-white",
    tone: "bg-[var(--danger-soft)] text-[var(--danger)]",
    bar: "bg-[var(--danger)]",
    hint: "One-time ₹ amount after grace",
  },
  daily: {
    label: "Daily",
    wash: "from-[rgba(212,146,48,0.16)] via-[rgba(212,146,48,0.05)] to-white",
    tone: "bg-[var(--warn-soft)] text-[var(--warn)]",
    bar: "bg-[var(--warn)]",
    hint: "₹ per day after grace",
  },
  percentage: {
    label: "Percentage",
    wash: "from-[rgba(36,91,255,0.14)] via-[rgba(36,91,255,0.04)] to-white",
    tone: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
    bar: "bg-[var(--accent-2)]",
    hint: "% of pending amount",
  },
};

function modeValueLabel(rule: FineRule) {
  if (rule.mode === "percentage") return `${rule.value}%`;
  if (rule.mode === "daily") return `${formatINR(rule.value)}/day`;
  return formatINR(rule.value);
}

function daysOverdue(dueDate: string, today = DEMO_TODAY) {
  const a = new Date(`${dueDate}T12:00:00`).getTime();
  const b = new Date(`${today}T12:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function previewFine(rule: FineRule, baseAmount: number, delayDays: number) {
  const chargeable = Math.max(0, delayDays - rule.graceDays);
  if (chargeable <= 0) return 0;
  if (rule.mode === "fixed") return rule.value;
  if (rule.mode === "daily") return rule.value * chargeable;
  return Math.round((baseAmount * rule.value) / 100);
}

export default function FinesPage() {
  const { state, upsertFineRule, applyFinesToOverdue, metrics, getStudent, sendReminder } =
    useApp();
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | FineMode>("all");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [view, setView] = useState<"rules" | "overdue">("rules");
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Custom late fee",
    mode: "fixed" as FineMode,
    value: 100,
    graceDays: 3,
    active: true,
  });
  const [calc, setCalc] = useState({ amount: 10000, delayDays: 15 });

  const selected = state.fineRules.find((f) => f.id === selectedRuleId) ?? null;

  const stats = useMemo(() => {
    const active = state.fineRules.filter((f) => f.active).length;
    const totalFines = state.dues.reduce((s, d) => s + d.fine, 0);
    const overdue = state.dues.filter((d) => d.status === "overdue");
    const overdueWithFine = overdue.filter((d) => d.fine > 0).length;
    const overdueFineSum = overdue.reduce((s, d) => s + d.fine, 0);
    return {
      active,
      totalRules: state.fineRules.length,
      totalFines,
      overdueCount: overdue.length,
      overdueWithFine,
      overdueFineSum,
    };
  }, [state.fineRules, state.dues]);

  const ruleMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.fineRules.filter((f) => {
      if (modeFilter !== "all" && f.mode !== modeFilter) return false;
      if (!term) return true;
      return f.name.toLowerCase().includes(term) || f.mode.toLowerCase().includes(term);
    });
  }, [state.fineRules, modeFilter, q]);

  const overdueList = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.dues
      .filter((d) => d.status === "overdue")
      .map((d) => {
        const student = getStudent(d.studentId);
        const delay = daysOverdue(d.dueDate);
        return { due: d, student, delay };
      })
      .filter(({ due, student }) => {
        if (!term) return true;
        return (
          due.installmentName.toLowerCase().includes(term) ||
          (student?.name ?? "").toLowerCase().includes(term) ||
          (student?.admissionNo ?? "").toLowerCase().includes(term) ||
          (student?.className ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.delay - a.delay || b.due.fine - a.due.fine);
  }, [state.dues, q, getStudent]);

  const calcPreview = useMemo(() => {
    const activeRules = state.fineRules.filter((f) => f.active);
    const parts = activeRules.map((r) => ({
      rule: r,
      fine: previewFine(r, calc.amount, calc.delayDays),
    }));
    const total = parts.reduce((s, p) => s + p.fine, 0);
    return { parts, total, payable: calc.amount + total };
  }, [state.fineRules, calc]);

  function openRule(id: string) {
    setSelectedRuleId(id);
    setView("rules");
  }

  function backToMap() {
    setSelectedRuleId(null);
  }

  function startCreate() {
    setEditingId(null);
    setForm({
      name: "Custom late fee",
      mode: "fixed",
      value: 100,
      graceDays: 3,
      active: true,
    });
    setOpenForm(true);
  }

  function startEdit(rule: FineRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      mode: rule.mode,
      value: rule.value,
      graceDays: rule.graceDays,
      active: rule.active,
    });
    setOpenForm(true);
    setSelectedRuleId(rule.id);
  }

  function saveRule() {
    if (!form.name.trim()) return;
    const id = editingId ?? uid("fine");
    upsertFineRule({
      id,
      name: form.name.trim(),
      mode: form.mode,
      value: form.value,
      graceDays: form.graceDays,
      active: form.active,
    });
    setOpenForm(false);
    setEditingId(null);
    setSelectedRuleId(id);
    setMsg(editingId ? "Late fee rule updated." : "Late fee rule saved.");
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Late fees"
        description="Configure fixed, daily, or percentage late-fee rules — then apply them to overdue installments."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                const n = applyFinesToOverdue();
                setMsg(
                  n > 0
                    ? `Applied late-fee rules to ${n} overdue installment${n === 1 ? "" : "s"}.`
                    : "No overdue installments needed a fine update.",
                );
                setView("overdue");
              }}
            >
              <Sparkles className="h-4 w-4" /> Apply to overdue
            </Button>
            <Button type="button" onClick={startCreate}>
              <Plus className="h-4 w-4" /> Add rule
            </Button>
          </div>
        }
      />

      {msg ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{msg}</p>
          <button type="button" onClick={() => setMsg(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active rules"
          value={String(stats.active)}
          tone="accent"
          hint={`${stats.totalRules} total`}
        />
        <Stat label="Fines accrued" value={formatINR(stats.totalFines)} tone="danger" />
        <Stat
          label="Overdue installments"
          value={String(stats.overdueCount)}
          hint={`${stats.overdueWithFine} already fined`}
        />
        <Stat
          label="Overdue balance"
          value={formatINR(metrics.overdue)}
          tone="danger"
          hint={`Fines on them ${formatINR(stats.overdueFineSum)}`}
        />
      </div>

      <div className="mb-5 inline-flex rounded-2xl border border-[var(--line)] bg-white p-1">
        <button
          type="button"
          onClick={() => {
            setView("rules");
            setQ("");
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "rules" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Late-fee rules
        </button>
        <button
          type="button"
          onClick={() => {
            setView("overdue");
            setSelectedRuleId(null);
            setQ("");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "overdue"
              ? "bg-[var(--ink)] text-white"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Overdue queue
          {stats.overdueCount > 0 ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                view === "overdue" ? "bg-white/20" : "bg-[var(--danger-soft)] text-[var(--danger)]"
              }`}
            >
              {stats.overdueCount}
            </span>
          ) : null}
        </button>
      </div>

      {openForm ? (
        <Surface className="mb-5 overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(225,29,72,0.08),rgba(212,146,48,0.06))] px-5 py-4">
            <p className="text-sm font-bold">
              {editingId ? "Edit late-fee rule" : "New late-fee rule"}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Choose fixed, daily, or percentage — set grace days before charging.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Rule name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Daily delay fine"
              />
            </Field>
            <Field label="Mode">
              <Select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as FineMode })}
              >
                <option value="fixed">Fixed (₹ after grace)</option>
                <option value="daily">Daily (₹/day)</option>
                <option value="percentage">Percentage of pending</option>
              </Select>
            </Field>
            <Field
              label={
                form.mode === "percentage"
                  ? "Percentage value"
                  : form.mode === "daily"
                    ? "Amount per day (₹)"
                    : "Fixed amount (₹)"
              }
            >
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </Field>
            <Field label="Grace days" hint="No fine until this many days after due date">
              <Input
                type="number"
                value={form.graceDays}
                onChange={(e) => setForm({ ...form, graceDays: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.active ? "active" : "off"}
                onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
              >
                <option value="active">Active</option>
                <option value="off">Off</option>
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="button" onClick={saveRule}>
              {editingId ? "Update rule" : "Save rule"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpenForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      {view === "rules" ? (
        <>
          {/* Calculator */}
          <Surface className="mb-5 overflow-hidden p-0">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-[var(--danger)]" />
                <p className="text-sm font-bold">Late-fee calculator</p>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Preview what active rules would charge for a sample overdue fee.
              </p>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fee amount (₹)">
                  <Input
                    type="number"
                    value={calc.amount}
                    onChange={(e) => setCalc({ ...calc, amount: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Days delayed">
                  <Input
                    type="number"
                    value={calc.delayDays}
                    onChange={(e) => setCalc({ ...calc, delayDays: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                {calcPreview.parts.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Enable at least one rule to preview.</p>
                ) : (
                  <div className="space-y-2">
                    {calcPreview.parts.map(({ rule, fine }) => (
                      <div key={rule.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-[var(--muted)]">
                          {rule.name}{" "}
                          <span className="text-xs">({modeValueLabel(rule)})</span>
                        </span>
                        <span className="font-semibold">{formatINR(fine)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 text-sm font-bold">
                      <span>Total fine</span>
                      <span className="text-[var(--danger)]">{formatINR(calcPreview.total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Payable</span>
                      <span>{formatINR(calcPreview.payable)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(225,29,72,0.07),rgba(212,146,48,0.05))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <LayoutGrid className="h-4 w-4 text-[var(--danger)]" />
                {selected ? (
                  <nav className="flex flex-wrap items-center gap-1.5 text-[var(--muted)]">
                    <button
                      type="button"
                      onClick={backToMap}
                      className="font-semibold text-[var(--accent)] hover:underline"
                    >
                      All rules
                    </button>
                    <span>/</span>
                    <span className="text-[var(--ink)]">{selected.name}</span>
                  </nav>
                ) : (
                  <span>Late-fee rules map</span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-[200px] sm:w-52">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <Input
                    className="pl-9"
                    placeholder="Search rules…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                {!selected ? (
                  <Select
                    className="w-full sm:w-40"
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value as "all" | FineMode)}
                  >
                    <option value="all">All modes</option>
                    <option value="fixed">Fixed</option>
                    <option value="daily">Daily</option>
                    <option value="percentage">Percentage</option>
                  </Select>
                ) : null}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 sm:p-5"
                >
                  <div className="mb-4">
                    <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                      Choose a rule
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Use <span className="font-semibold text-[var(--ink)]">Open</span> to review or
                      edit, then apply rules to overdue dues.
                    </p>
                  </div>

                  {ruleMap.length === 0 ? (
                    <EmptyState
                      title="No late-fee rules"
                      description="Add a rule or clear filters."
                    />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {ruleMap.map((rule) => {
                        const meta = MODE_META[rule.mode];
                        const sample = previewFine(rule, 10000, 15);
                        return (
                          <div
                            key={rule.id}
                            className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[var(--danger)] shadow-sm">
                                  {rule.mode === "percentage" ? (
                                    <Percent className="h-5 w-5" />
                                  ) : rule.mode === "daily" ? (
                                    <CalendarClock className="h-5 w-5" />
                                  ) : (
                                    <Wallet className="h-5 w-5" />
                                  )}
                                </span>
                                <div>
                                  <p className="font-bold tracking-[-0.02em]">{rule.name}</p>
                                  <span
                                    className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${meta.tone}`}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                              </div>
                              <Badge tone={rule.active ? "success" : "neutral"}>
                                {rule.active ? "active" : "off"}
                              </Badge>
                            </div>

                            <p className="mt-3 text-sm text-[var(--muted)]">{meta.hint}</p>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-lg bg-white/80 px-2 py-1 font-bold text-[var(--ink)]">
                                {modeValueLabel(rule)}
                              </span>
                              <span className="rounded-lg bg-white/80 px-2 py-1 font-semibold text-[var(--muted)]">
                                {rule.graceDays}d grace
                              </span>
                              <span className="rounded-lg bg-white/80 px-2 py-1 font-semibold text-[var(--muted)]">
                                Sample 15d → {formatINR(sample)}
                              </span>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => openRule(rule.id)}
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                              >
                                <DoorOpen className="h-4 w-4" />
                                Open
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => upsertFineRule({ ...rule, active: !rule.active })}
                                className="rounded-xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                              >
                                {rule.active ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className={`border-b border-[var(--line)] bg-gradient-to-br ${MODE_META[selected.mode].wash} px-4 py-5 sm:px-6`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={backToMap}
                          className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                          aria-label="Back to rules"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                              {selected.name}
                            </p>
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${MODE_META[selected.mode].tone}`}
                            >
                              {MODE_META[selected.mode].label}
                            </span>
                            <Badge tone={selected.active ? "success" : "neutral"}>
                              {selected.active ? "active" : "off"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {MODE_META[selected.mode].hint} · {modeValueLabel(selected)} ·{" "}
                            {selected.graceDays} grace day{selected.graceDays === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => startEdit(selected)}>
                          Edit rule
                        </Button>
                        <Button
                          type="button"
                          variant="soft"
                          onClick={() =>
                            upsertFineRule({ ...selected, active: !selected.active })
                          }
                        >
                          {selected.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setView("overdue")}
                        >
                          Overdue queue <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
                    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                      <p className="text-xs font-semibold text-[var(--muted)]">Charge value</p>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        {modeValueLabel(selected)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                      <p className="text-xs font-semibold text-[var(--muted)]">Grace period</p>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        {selected.graceDays} days
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                      <p className="text-xs font-semibold text-[var(--muted)]">
                        Sample (₹10,000 · 15 days late)
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em] text-[var(--danger)]">
                        {formatINR(previewFine(selected, 10000, 15))}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--line)] px-4 py-5 sm:px-6">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                      <p className="font-semibold">How this rule works</p>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--muted)]">
                      <li className="flex gap-2">
                        <span className="font-bold text-[var(--ink)]">1.</span>
                        Wait {selected.graceDays} day{selected.graceDays === 1 ? "" : "s"} after
                        the due date (grace).
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-[var(--ink)]">2.</span>
                        {selected.mode === "fixed"
                          ? `Charge a fixed ${formatINR(selected.value)} once.`
                          : selected.mode === "daily"
                            ? `Charge ${formatINR(selected.value)} for every day past grace.`
                            : `Charge ${selected.value}% of the pending installment amount.`}
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-[var(--ink)]">3.</span>
                        Use <span className="font-semibold text-[var(--ink)]">Apply to overdue</span>{" "}
                        to push active rules onto overdue student dues.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Surface>
        </>
      ) : (
        <Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-bold">Overdue queue</p>
              <p className="text-xs text-[var(--muted)]">
                {overdueList.length} overdue installment{overdueList.length === 1 ? "" : "s"} ·
                fines already on file {formatINR(stats.overdueFineSum)}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px] sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  className="pl-9"
                  placeholder="Search student, class, fee…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  const n = applyFinesToOverdue();
                  setMsg(
                    n > 0
                      ? `Applied late-fee rules to ${n} overdue installment${n === 1 ? "" : "s"}.`
                      : "No overdue installments needed a fine update.",
                  );
                }}
              >
                <Sparkles className="h-4 w-4" /> Apply rules now
              </Button>
              <Link href="/admin/dues">
                <Button type="button" variant="soft">
                  Who owes <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {overdueList.length === 0 ? (
              <EmptyState
                title="No overdue installments"
                description="Great — nothing needs a late fee right now."
              />
            ) : (
              overdueList.map(({ due, student, delay }) => (
                <div
                  key={due.id}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 transition hover:border-[var(--line-strong)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--danger-soft)] text-xs font-bold text-[var(--danger)]">
                        {delay}d
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold tracking-[-0.02em]">
                            {student?.name ?? due.studentId}
                          </p>
                          <Badge tone="danger">overdue</Badge>
                          {due.fine > 0 ? (
                            <Badge tone="warning">fine {formatINR(due.fine)}</Badge>
                          ) : (
                            <Badge tone="neutral">no fine yet</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          {due.installmentName}
                          {student
                            ? ` · ${student.className}-${student.section} · ${student.admissionNo}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Due {formatDate(due.dueDate)} · {delay} day{delay === 1 ? "" : "s"} late
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-semibold text-[var(--muted)]">Outstanding</p>
                      <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                        {formatINR(outstanding(due.amount, due.fine, due.paidAmount))}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Base {formatINR(due.amount)}
                        {due.fine > 0 ? ` + fine ${formatINR(due.fine)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {student ? (
                      <Link href={`/admin/students/${student.id}`}>
                        <Button size="sm" variant="ghost">
                          Student profile
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      size="sm"
                      variant="soft"
                      type="button"
                      onClick={() => {
                        sendReminder(due.id, "sms");
                        setMsg(`Reminder queued for ${student?.name ?? "parent"}.`);
                      }}
                    >
                      <Send className="h-3.5 w-3.5" /> Remind
                    </Button>
                    <Link href="/admin/dues">
                      <Button size="sm" variant="ghost">
                        Open dues
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>
      )}
    </div>
  );
}
