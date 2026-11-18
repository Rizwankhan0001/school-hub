"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DoorOpen,
  LayoutGrid,
  Plus,
  Search,
  Smartphone,
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
import {
  computeFeePaymentBreakdown,
  formatDate,
  formatINR,
  planLabel,
} from "@/lib/format";
import type { FeeStructureItem, FeeType } from "@/lib/types";

const FEE_TYPES: FeeType[] = [
  "Admission Fee",
  "Tuition Fee",
  "Transport Fee",
  "Hostel Fee",
  "Library Fee",
  "Laboratory Fee",
  "Examination Fee",
  "Sports Fee",
  "Annual Fee",
  "Miscellaneous Fee",
];

const CLASS_ORDER = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

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

export default function FeesPage() {
  const { state, addFeeItem } = useApp();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [focusFeeType, setFocusFeeType] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    className: "Class 1",
    feeType: "Tuition Fee" as FeeType,
    amount: 10000,
  });

  const paymentOptions = state.feePaymentOptions ?? [];
  const selectedPlan =
    paymentOptions.find((p) => p.id === selectedPlanId) ??
    paymentOptions.find((p) => p.highlight) ??
    paymentOptions[0] ??
    null;

  const classTotals = useMemo(() => {
    const map = new Map<string, { total: number; count: number; items: FeeStructureItem[] }>();
    for (const f of state.feeStructures) {
      const entry = map.get(f.className) ?? { total: 0, count: 0, items: [] };
      entry.total += f.amount;
      entry.count += 1;
      entry.items.push(f);
      map.set(f.className, entry);
    }
    return CLASS_ORDER.map((className) => {
      const data = map.get(className) ?? { total: 0, count: 0, items: [] };
      return {
        className,
        stage: stageForClass(className),
        total: data.total,
        count: data.count,
        items: [...data.items].sort((a, b) => b.amount - a.amount),
      };
    });
  }, [state.feeStructures]);

  const avgAnnual = useMemo(() => {
    const withFees = classTotals.filter((c) => c.count > 0);
    if (!withFees.length) return 0;
    return Math.round(withFees.reduce((s, c) => s + c.total, 0) / withFees.length);
  }, [classTotals]);

  const byStage = useMemo(() => {
    const out = { Primary: 0, Middle: 0, Senior: 0 };
    for (const c of classTotals) {
      if (c.count) out[c.stage] += c.total;
    }
    return out;
  }, [classTotals]);

  const classMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    return classTotals.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!term) return true;
      return (
        c.className.toLowerCase().includes(term) ||
        c.items.some((i) => i.feeType.toLowerCase().includes(term))
      );
    });
  }, [classTotals, stageFilter, q]);

  const detail = useMemo(() => {
    if (!selectedClass) return null;
    const base = classTotals.find((c) => c.className === selectedClass);
    if (!base) return null;
    const term = q.trim().toLowerCase();
    const items = base.items.filter((f) => {
      if (focusFeeType && f.feeType !== focusFeeType) return false;
      if (!term) return true;
      return f.feeType.toLowerCase().includes(term) || f.id.toLowerCase().includes(term);
    });
    const installments = state.installments
      .filter((i) => i.className === selectedClass)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return {
      ...base,
      items,
      viewTotal: items.reduce((s, f) => s + f.amount, 0),
      installments,
    };
  }, [selectedClass, classTotals, focusFeeType, q, state.installments]);

  const previewTotal = detail?.total || avgAnnual;
  const selectedMeta = selectedClass ? STAGE_META[stageForClass(selectedClass)] : null;

  function openClass(className: string, feeType?: string) {
    setSelectedClass(className);
    setFocusFeeType(feeType ?? null);
  }

  function backToMap() {
    setSelectedClass(null);
    setFocusFeeType(null);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Fee plans"
        description="Browse class fee structures like a map — open fee heads, compare payment plans, and see installment calendars."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/installments">
              <Button variant="soft">
                Installments <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button type="button" onClick={() => setOpen((v) => !v)}>
              <Plus className="h-4 w-4" /> Add fee item
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Classes covered" value="1–12" tone="accent" />
        <Stat label="Fee line items" value={String(state.feeStructures.length)} />
        <Stat label="Avg annual fee" value={formatINR(avgAnnual)} tone="success" />
        <Stat label="Payment plans" value={String(paymentOptions.length)} />
      </div>

      {/* Stage cards */}
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
                  {formatINR(byStage[stage])}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* How parents pay */}
      <Surface className="mb-5 overflow-hidden p-0">
        <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.08),transparent)] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-white">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                Parent Portal · Pay fees
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                How parents can pay
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                Select a plan to preview savings and EMI amounts
                {selectedClass ? ` for ${selectedClass}` : " (uses selected class or school average)"}.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 ring-1 ring-[var(--line)]">
              <Smartphone className="h-3.5 w-3.5 text-[var(--accent)]" /> UPI
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 ring-1 ring-[var(--line)]">
              <CreditCard className="h-3.5 w-3.5 text-[var(--accent)]" /> Card
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 ring-1 ring-[var(--line)]">
              Net banking
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 ring-1 ring-[var(--line)]">
              Wallet
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          {paymentOptions.map((opt) => {
            const sample = computeFeePaymentBreakdown(previewTotal, opt);
            const active = selectedPlan?.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPlanId(opt.id)}
                className={`rounded-[1.35rem] border p-4 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_18px_36px_-28px_rgba(0,166,126,0.55)] ring-2 ring-[var(--accent)]/30"
                    : "border-[var(--line)] bg-white hover:border-[var(--line-strong)] hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold tracking-[-0.02em]">{opt.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{opt.tagline}</p>
                  </div>
                  {active ? <Badge tone="accent">Selected</Badge> : null}
                  {!active && opt.highlight ? <Badge tone="success">Best value</Badge> : null}
                  {!active && opt.discountPercent > 0 && !opt.highlight ? (
                    <Badge tone="success">{opt.discountPercent}% off</Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{opt.description}</p>
                <div className="mt-3 space-y-1.5 text-xs">
                  {opt.discountPercent > 0 ? (
                    <p className="inline-flex items-center gap-1 font-semibold text-[var(--success)]">
                      <BadgePercent className="h-3.5 w-3.5" />
                      {opt.discountPercent}% off annual total
                    </p>
                  ) : null}
                  <p className="font-semibold text-[var(--ink)]">
                    {opt.installments === 1
                      ? `One payment · ~${formatINR(sample.payable)}`
                      : `${opt.installments} EMIs · ~${formatINR(sample.perInstallment)} each`}
                  </p>
                </div>
                {active ? (
                  <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
                    {opt.howItWorks.map((step) => (
                      <li key={step} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-[var(--accent)]">Tap to select →</p>
                )}
              </button>
            );
          })}
        </div>
      </Surface>

      {open ? (
        <Surface className="mb-5 overflow-hidden p-0">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <p className="text-sm font-bold">Add fee line item</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
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
            <Field label="Fee type">
              <Select
                value={form.feeType}
                onChange={(e) => setForm({ ...form, feeType: e.target.value as FeeType })}
              >
                {FEE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="flex gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button
              type="button"
              onClick={() => {
                addFeeItem(form);
                setOpen(false);
                openClass(form.className, form.feeType);
              }}
            >
              Save fee item
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

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
                {focusFeeType ? (
                  <>
                    <span>/</span>
                    <span className="text-[var(--ink)]">{focusFeeType}</span>
                  </>
                ) : null}
              </nav>
            ) : (
              <span>Class fee map</span>
            )}
          </div>
          <div className="relative min-w-[220px] sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-9"
              placeholder="Search class or fee head…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
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
              <div className="mb-4">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                  Choose a class
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Use <span className="font-semibold text-[var(--ink)]">Open</span> on a fee head, or
                  open the full class structure.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {classMap.map((item) => {
                  const meta = STAGE_META[item.stage];
                  const maxAmt = Math.max(1, ...item.items.map((i) => i.amount));
                  return (
                    <div
                      key={item.className}
                      className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
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
                          <p className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums tracking-[-0.03em]">
                            {formatINR(item.total)}
                          </p>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                            annual
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                          Open a fee head
                        </p>
                        {item.items.length === 0 ? (
                          <p className="text-xs text-[var(--muted)]">No fee items yet</p>
                        ) : (
                          item.items.slice(0, 4).map((fee) => (
                            <div
                              key={fee.id}
                              className="flex items-center gap-2 rounded-2xl bg-white/70 p-1.5 ring-1 ring-[var(--line)]"
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-[0.55rem] font-bold leading-tight text-white">
                                {fee.feeType.split(" ")[0].slice(0, 3)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-xs font-bold">{fee.feeType}</p>
                                  <p className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-[var(--muted)]">
                                    {formatINR(fee.amount)}
                                  </p>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                                  <div
                                    className={`h-full rounded-full ${meta.bar}`}
                                    style={{
                                      width: `${Math.max(12, (fee.amount / maxAmt) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openClass(item.className, fee.feeType)}
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-2 text-[0.7rem] font-bold text-white transition hover:bg-[var(--accent-hover)]"
                              >
                                Open
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                        {item.items.length > 4 ? (
                          <p className="text-[0.65rem] font-semibold text-[var(--muted)]">
                            +{item.items.length - 4} more fee heads
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => openClass(item.className)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                      >
                        Open full fee structure
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : detail ? (
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                          {detail.className}
                        </p>
                        {selectedMeta ? (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${selectedMeta.tone}`}
                          >
                            {selectedMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Session {state.school.academicSession} · {detail.items.length} fee head
                        {detail.items.length === 1 ? "" : "s"} · annual{" "}
                        <span className="font-semibold text-[var(--ink)]">
                          {formatINR(detail.total)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/90 px-4 py-3 text-right shadow-sm ring-1 ring-[var(--line)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      In this view
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                      {formatINR(detail.viewTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                    <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Open fee head
                  </p>
                  <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setFocusFeeType(null)}
                      className={`rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                        !focusFeeType
                          ? "bg-[var(--ink)] text-white"
                          : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                      }`}
                    >
                      All heads
                      <span className="ml-1.5 tabular-nums opacity-70">{detail.count}</span>
                    </button>
                    {(classTotals.find((c) => c.className === selectedClass)?.items ?? []).map(
                      (fee) => (
                        <button
                          key={fee.id}
                          type="button"
                          onClick={() => setFocusFeeType(fee.feeType)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                            focusFeeType === fee.feeType
                              ? "bg-[var(--accent)] text-white"
                              : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {fee.feeType.split(" ")[0]}
                          <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="mb-3 text-sm font-bold">Fee structure</p>
                  {detail.items.length === 0 ? (
                    <EmptyState
                      title="No fee heads in this view"
                      description="Clear filters or add a fee item."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-muted)]/60 p-1.5 sm:p-2">
                      <div className="divide-y divide-[var(--line)] rounded-[1rem] bg-white">
                        {detail.items.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between gap-3 px-4 py-3.5"
                          >
                            <div>
                              <p className="font-semibold">{f.feeType}</p>
                              <p className="text-xs text-[var(--muted)]">
                                {f.academicSession} · {f.id}
                              </p>
                            </div>
                            <p className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums tracking-[-0.03em]">
                              {formatINR(f.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Surface className="p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                      <h3 className="font-semibold">What parents pay</h3>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Based on {detail.className} annual total ({formatINR(detail.total)}).
                    </p>
                    <div className="mt-4 space-y-2">
                      {paymentOptions.map((opt) => {
                        const b = computeFeePaymentBreakdown(detail.total, opt);
                        const active = selectedPlan?.id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedPlanId(opt.id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              active
                                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--line-strong)]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">{opt.name}</p>
                                <p className="text-xs text-[var(--muted)]">
                                  {opt.installments === 1
                                    ? "Single payment"
                                    : `${opt.installments} EMIs`}
                                  {opt.discountPercent > 0
                                    ? ` · save ${formatINR(b.saved)}`
                                    : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold tabular-nums">{formatINR(b.payable)}</p>
                                {opt.installments > 1 ? (
                                  <p className="text-xs text-[var(--muted)]">
                                    {formatINR(b.perInstallment)} / EMI
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Surface>

                  <Surface className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-[var(--accent)]" />
                        <h3 className="font-semibold">Installment calendar</h3>
                      </div>
                      <Link
                        href="/admin/installments"
                        className="text-xs font-bold text-[var(--accent)] hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>
                    <div className="mt-4 space-y-2">
                      {detail.installments.map((ins) => (
                        <div
                          key={ins.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {ins.name}{" "}
                              <span className="font-medium text-[var(--muted)]">
                                · {planLabel(ins.plan)}
                              </span>
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              Due {formatDate(ins.dueDate)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatINR(ins.amount)}
                          </p>
                        </div>
                      ))}
                      {detail.installments.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">
                          No installment schedule for this class.
                        </p>
                      ) : null}
                    </div>
                  </Surface>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
