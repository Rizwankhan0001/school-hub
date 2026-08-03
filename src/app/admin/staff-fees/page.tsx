"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  ChevronRight,
  DoorOpen,
  GraduationCap,
  PauseCircle,
  Plus,
  Search,
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
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import type {
  SalaryPayoutMethod,
  SalaryStatus,
  StaffPersonType,
  StaffSalary,
} from "@/lib/types";

type Mode = "hub" | "teachers" | "staff" | "add";

const PAYOUT_LABEL: Record<SalaryPayoutMethod, string> = {
  bank_transfer: "Bank transfer",
  upi: "UPI",
  cheque: "Cheque",
  cash: "Cash",
};

function statusTone(status: SalaryStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "paid") return "success";
  if (status === "due") return "warning";
  if (status === "on_hold") return "danger";
  return "neutral";
}

function statusLabel(status: SalaryStatus) {
  if (status === "due") return "Due to pay";
  if (status === "paid") return "Paid out";
  return "On hold";
}

export default function StaffPayrollPage() {
  const {
    state,
    getStaffPerson,
    recordStaffSalaryPayout,
    holdStaffSalary,
    addStaffSalary,
  } = useApp();

  const [mode, setMode] = useState<Mode>("hub");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SalaryStatus>("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<SalaryPayoutMethod>("bank_transfer");
  const [banner, setBanner] = useState<string | null>(null);
  const [form, setForm] = useState({
    personType: "teacher" as StaffPersonType,
    personId: "",
    periodKey: "2026-08",
    periodLabel: "August 2026",
    grossAmount: "",
    deductions: "0",
    payBy: "2026-08-31",
    notes: "",
  });

  const periods = useMemo(() => {
    const set = new Set(state.staffSalaries.map((s) => s.periodKey));
    return Array.from(set).sort().reverse();
  }, [state.staffSalaries]);

  const stats = useMemo(() => {
    const due = state.staffSalaries.filter((s) => s.status === "due");
    const hold = state.staffSalaries.filter((s) => s.status === "on_hold");
    const paid = state.staffSalaries.filter((s) => s.status === "paid");
    const dueTotal = due.reduce((s, r) => s + r.netAmount, 0);
    const paidTotal = paid.reduce((s, r) => s + r.netAmount, 0);
    const teacherDue = due
      .filter((s) => s.personType === "teacher")
      .reduce((s, r) => s + r.netAmount, 0);
    const staffDue = due
      .filter((s) => s.personType === "staff")
      .reduce((s, r) => s + r.netAmount, 0);
    return {
      dueCount: due.length,
      holdCount: hold.length,
      dueTotal,
      paidTotal,
      teacherDue,
      staffDue,
      teacherDueCount: due.filter((s) => s.personType === "teacher").length,
      staffDueCount: due.filter((s) => s.personType === "staff").length,
    };
  }, [state.staffSalaries]);

  const personType: StaffPersonType | null =
    mode === "teachers" ? "teacher" : mode === "staff" ? "staff" : null;

  const filtered = useMemo(() => {
    if (!personType) return [];
    const term = q.trim().toLowerCase();
    return [...state.staffSalaries]
      .filter((s) => s.personType === personType)
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .filter((s) => periodFilter === "all" || s.periodKey === periodFilter)
      .filter((s) => {
        if (!term) return true;
        const person = getStaffPerson(s.personType, s.personId);
        return (
          (person?.name ?? "").toLowerCase().includes(term) ||
          (person?.subtitle ?? "").toLowerCase().includes(term) ||
          s.periodLabel.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const rank = (s: SalaryStatus) =>
          s === "due" ? 0 : s === "on_hold" ? 1 : 2;
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return b.periodKey.localeCompare(a.periodKey) || a.payBy.localeCompare(b.payBy);
      });
  }, [state.staffSalaries, personType, statusFilter, periodFilter, q, getStaffPerson]);

  const selected =
    filtered.find((s) => s.id === selectedId) ??
    filtered.find((s) => s.status === "due") ??
    filtered[0] ??
    null;

  const recentPaid = useMemo(
    () =>
      [...state.staffSalaries]
        .filter((s) => s.status === "paid")
        .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
        .slice(0, 5),
    [state.staffSalaries],
  );

  function openBucket(next: "teachers" | "staff") {
    setMode(next);
    setQ("");
    setStatusFilter("due");
    setPeriodFilter("all");
    setSelectedId(null);
  }

  function payOut(row: StaffSalary) {
    const result = recordStaffSalaryPayout({
      salaryId: row.id,
      payoutMethod,
    });
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    const person = getStaffPerson(row.personType, row.personId);
    setBanner(
      `Paid ${formatINR(result.salary.netAmount)} to ${person?.name ?? "employee"} via ${PAYOUT_LABEL[payoutMethod]}.`,
    );
  }

  function hold(row: StaffSalary) {
    const result = holdStaffSalary(row.id);
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    const person = getStaffPerson(row.personType, row.personId);
    setBanner(`Salary for ${person?.name ?? "employee"} put on hold.`);
  }

  function createSalary() {
    if (!form.personId || !form.grossAmount || !form.periodKey || !form.payBy) {
      setBanner("Fill person, period, gross amount, and pay-by date.");
      return;
    }
    const gross = Number(form.grossAmount);
    const deductions = Number(form.deductions) || 0;
    if (!Number.isFinite(gross) || gross <= 0) {
      setBanner("Enter a valid gross salary.");
      return;
    }
    addStaffSalary({
      personType: form.personType,
      personId: form.personId,
      periodKey: form.periodKey,
      periodLabel: form.periodLabel || form.periodKey,
      grossAmount: gross,
      deductions,
      payBy: form.payBy,
      notes: form.notes.trim() || undefined,
      status: "due",
    });
    setBanner("Salary line added — school will pay this out.");
    setMode(form.personType === "teacher" ? "teachers" : "staff");
  }

  function onPickPerson(personType: StaffPersonType, personId: string) {
    const person = getStaffPerson(personType, personId);
    setForm((f) => ({
      ...f,
      personType,
      personId,
      grossAmount: person ? String(person.monthlySalary) : f.grossAmount,
    }));
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payroll"
        description="Salaries the school pays teachers and other staff — mark payouts, hold lines, and track monthly payroll."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setMode("add");
                setBanner(null);
              }}
            >
              <Plus className="h-4 w-4" /> Add salary line
            </Button>
            <Link href="/admin/reports">
              <Button variant="soft">
                Reports <ArrowRight className="h-4 w-4" />
              </Button>
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
        <Stat
          label="Due to pay (net)"
          value={formatINR(stats.dueTotal)}
          tone="accent"
          hint={`${stats.dueCount} salary line${stats.dueCount === 1 ? "" : "s"}`}
        />
        <Stat
          label="Teacher payroll due"
          value={formatINR(stats.teacherDue)}
          hint={`${stats.teacherDueCount} due`}
        />
        <Stat
          label="Other staff due"
          value={formatINR(stats.staffDue)}
          hint={`${stats.staffDueCount} due · ${stats.holdCount} on hold`}
        />
        <Stat label="Already paid out" value={formatINR(stats.paidTotal)} tone="success" />
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),rgba(36,91,255,0.05))] px-4 py-3.5 sm:px-5">
          <Banknote className="h-4 w-4 text-[var(--accent)]" />
          {mode === "hub" ? (
            <p className="text-sm font-bold">Payroll map</p>
          ) : (
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setMode("hub")}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Payroll map
              </button>
              <span>/</span>
              <span className="font-semibold text-[var(--ink)]">
                {mode === "teachers"
                  ? "Teachers"
                  : mode === "staff"
                    ? "Other staff"
                    : "Add salary"}
              </span>
            </nav>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "hub" ? (
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
                  Who the school pays
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Open teacher or other-staff payroll, then release salary from school accounts.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-gradient-to-br from-[rgba(0,166,126,0.16)] via-[rgba(0,166,126,0.05)] to-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[var(--accent)] shadow-sm">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        Teachers
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Monthly faculty salaries — bank transfer, UPI, cheque, or cash.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="warning">{formatINR(stats.teacherDue)} due</Badge>
                    <Badge tone="info">{stats.teacherDueCount} to pay</Badge>
                    <Badge tone="neutral">{state.teachers.length} faculty</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBucket("teachers")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                  >
                    <DoorOpen className="h-4 w-4" /> Open teacher payroll
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-gradient-to-br from-[rgba(36,91,255,0.14)] via-[rgba(36,91,255,0.04)] to-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[var(--accent-2)] shadow-sm">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        Other staff
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Office, accounts, transport, library, lab, security, and support wages.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="warning">{formatINR(stats.staffDue)} due</Badge>
                    <Badge tone="info">{stats.staffDueCount} to pay</Badge>
                    <Badge tone="neutral">{state.staffMembers.length} people</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBucket("staff")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                  >
                    <DoorOpen className="h-4 w-4" /> Open staff payroll
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                <p className="text-sm font-bold">Recent payouts</p>
                <div className="mt-3 space-y-2">
                  {recentPaid.map((p) => {
                    const person = getStaffPerson(p.personType, p.personId);
                    return (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold">{person?.name ?? "Employee"}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {p.periodLabel} ·{" "}
                            {p.payoutMethod ? PAYOUT_LABEL[p.payoutMethod] : "Paid"} ·{" "}
                            {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                          </p>
                        </div>
                        <p className="font-bold tabular-nums text-[var(--success)]">
                          {formatINR(p.netAmount)}
                        </p>
                      </div>
                    );
                  })}
                  {recentPaid.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No payouts recorded yet.</p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : mode === "add" ? (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-b border-[var(--line)] bg-gradient-to-br from-[rgba(0,166,126,0.12)] via-[rgba(36,91,255,0.05)] to-white px-4 py-5 sm:px-6">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setMode("hub")}
                    className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      Add salary line
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                      Schedule a monthly salary the school will pay to a teacher or staff member.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
                <Field label="Person type">
                  <Select
                    value={form.personType}
                    onChange={(e) => {
                      const personType = e.target.value as StaffPersonType;
                      setForm((f) => ({ ...f, personType, personId: "", grossAmount: "" }));
                    }}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="staff">Other staff</option>
                  </Select>
                </Field>
                <Field label="Person">
                  <Select
                    value={form.personId}
                    onChange={(e) => onPickPerson(form.personType, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {form.personType === "teacher"
                      ? state.teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} · {formatINR(t.monthlySalary ?? 0)}/mo
                          </option>
                        ))
                      : state.staffMembers
                          .filter((s) => s.status === "active")
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} · {formatINR(s.monthlySalary)}/mo
                            </option>
                          ))}
                  </Select>
                </Field>
                <Field label="Period key (YYYY-MM)">
                  <Input
                    placeholder="2026-08"
                    value={form.periodKey}
                    onChange={(e) => setForm((f) => ({ ...f, periodKey: e.target.value }))}
                  />
                </Field>
                <Field label="Period label">
                  <Input
                    placeholder="August 2026"
                    value={form.periodLabel}
                    onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))}
                  />
                </Field>
                <Field label="Gross amount (₹)">
                  <Input
                    type="number"
                    min={1}
                    value={form.grossAmount}
                    onChange={(e) => setForm((f) => ({ ...f, grossAmount: e.target.value }))}
                  />
                </Field>
                <Field label="Deductions (₹)">
                  <Input
                    type="number"
                    min={0}
                    value={form.deductions}
                    onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
                  />
                </Field>
                <Field label="Pay by">
                  <Input
                    type="date"
                    value={form.payBy}
                    onChange={(e) => setForm((f) => ({ ...f, payBy: e.target.value }))}
                  />
                </Field>
                <Field label="Notes (optional)">
                  <Input
                    placeholder="PF, advance adjustment, etc."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </Field>
                <div className="flex flex-wrap gap-2 lg:col-span-2">
                  <Button type="button" onClick={createSalary}>
                    <Plus className="h-4 w-4" /> Save salary line
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setMode("hub")}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${
                  mode === "teachers"
                    ? "from-[rgba(0,166,126,0.14)] via-[rgba(0,166,126,0.04)] to-white"
                    : "from-[rgba(36,91,255,0.12)] via-[rgba(36,91,255,0.04)] to-white"
                } px-4 py-5 sm:px-6`}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setMode("hub")}
                    className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      {mode === "teachers" ? "Teacher payroll" : "Other staff payroll"}
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                      Select a salary line and pay it out from school accounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 xl:grid-cols-[0.95fr_1.15fr]">
                <div className="border-b border-[var(--line)] xl:border-b-0 xl:border-r">
                  <div className="flex flex-col gap-2 border-b border-[var(--line)] p-3 sm:p-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <Input
                        className="pl-9"
                        placeholder="Search name or period…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        className="w-full sm:flex-1"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as typeof statusFilter)
                        }
                      >
                        <option value="all">All status</option>
                        <option value="due">Due to pay</option>
                        <option value="on_hold">On hold</option>
                        <option value="paid">Paid out</option>
                      </Select>
                      <Select
                        className="w-full sm:flex-1"
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                      >
                        <option value="all">All periods</option>
                        {periods.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="max-h-[34rem] space-y-2 overflow-y-auto p-3 sm:p-4">
                    {filtered.length === 0 ? (
                      <EmptyState
                        title="No salary lines"
                        description="Try another filter or add a salary line."
                      />
                    ) : (
                      filtered.map((s) => {
                        const person = getStaffPerson(s.personType, s.personId);
                        const active = selected?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            className={`w-full rounded-[1.2rem] border p-3.5 text-left transition ${
                              active
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                                : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap gap-1.5">
                                  <Badge tone={statusTone(s.status)}>
                                    {statusLabel(s.status)}
                                  </Badge>
                                  <Badge tone="neutral">{s.periodLabel}</Badge>
                                </div>
                                <p className="mt-2 truncate text-sm font-bold">
                                  {person?.name ?? "Unknown"}
                                </p>
                                <p className="truncate text-xs text-[var(--muted)]">
                                  Pay by {formatDate(s.payBy)} · net {formatINR(s.netAmount)}
                                </p>
                              </div>
                              <p className="shrink-0 font-bold tabular-nums">
                                {formatINR(s.netAmount)}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  {!selected ? (
                    <EmptyState
                      title="Select a salary"
                      description="Pick a line to pay out or put on hold."
                    />
                  ) : (
                    (() => {
                      const person = getStaffPerson(
                        selected.personType,
                        selected.personId,
                      );
                      return (
                        <div>
                          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.1),rgba(36,91,255,0.06))] px-5 py-5">
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={statusTone(selected.status)}>
                                {statusLabel(selected.status)}
                              </Badge>
                              <Badge tone="info">{selected.periodLabel}</Badge>
                              <Badge tone="neutral">
                                {selected.personType === "teacher" ? "Teacher" : "Staff"}
                              </Badge>
                            </div>
                            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                              {person?.name}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {person?.subtitle} · {person?.phone}
                            </p>
                          </div>

                          <div className="space-y-4 p-5">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                                <p className="text-xs text-[var(--muted)]">Gross</p>
                                <p className="mt-1 font-bold tabular-nums">
                                  {formatINR(selected.grossAmount)}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                                <p className="text-xs text-[var(--muted)]">Deductions</p>
                                <p className="mt-1 font-bold tabular-nums">
                                  {formatINR(selected.deductions)}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                                <p className="text-xs text-[var(--muted)]">Net to pay</p>
                                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                                  {formatINR(selected.netAmount)}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm">
                              <div className="flex justify-between gap-3">
                                <span className="text-[var(--muted)]">Pay by</span>
                                <span className="font-semibold">{formatDate(selected.payBy)}</span>
                              </div>
                              {selected.paidAt ? (
                                <div className="mt-2 flex justify-between gap-3">
                                  <span className="text-[var(--muted)]">Paid on</span>
                                  <span className="font-semibold">
                                    {formatDateTime(selected.paidAt)}
                                    {selected.payoutMethod
                                      ? ` · ${PAYOUT_LABEL[selected.payoutMethod]}`
                                      : ""}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            {selected.notes ? (
                              <p className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
                                {selected.notes}
                              </p>
                            ) : null}

                            {selected.status === "paid" ? (
                              <p className="rounded-2xl bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                                Salary paid out — school accounts cleared for this period.
                              </p>
                            ) : (
                              <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                                <p className="mb-3 text-sm font-bold">Release salary</p>
                                <Field label="Payout method">
                                  <Select
                                    value={payoutMethod}
                                    onChange={(e) =>
                                      setPayoutMethod(e.target.value as SalaryPayoutMethod)
                                    }
                                  >
                                    <option value="bank_transfer">Bank transfer</option>
                                    <option value="upi">UPI</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="cash">Cash</option>
                                  </Select>
                                </Field>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button type="button" onClick={() => payOut(selected)}>
                                    <Banknote className="h-4 w-4" />
                                    Pay {formatINR(selected.netAmount)}
                                  </Button>
                                  {selected.status !== "on_hold" ? (
                                    <Button
                                      type="button"
                                      variant="soft"
                                      onClick={() => hold(selected)}
                                    >
                                      <PauseCircle className="h-4 w-4" /> Hold
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
