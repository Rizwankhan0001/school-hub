"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Receipt,
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
import {
  formatDate,
  formatDateTime,
  formatINR,
  methodLabel,
  outstanding,
} from "@/lib/format";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export default function PaymentsPage() {
  const { state, getStudent, getOpenDues, recordPayment } = useApp();
  const activeStudents = useMemo(
    () => state.students.filter((s) => s.status === "active"),
    [state.students],
  );
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");

  const openDues = useMemo(
    () => getOpenDues([studentId]),
    [getOpenDues, studentId],
  );

  const amount = openDues
    .filter((d) => selected.includes(d.id))
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);

  const stats = useMemo(() => {
    const success = state.payments.filter((p) => p.status === "success");
    const collected = success.reduce((s, p) => s + p.amount, 0);
    const failed = state.payments.filter((p) => p.status === "failed").length;
    const pending = state.payments.filter((p) => p.status === "pending").length;
    return {
      count: state.payments.length,
      collected,
      success: success.length,
      failed,
      pending,
    };
  }, [state.payments]);

  const ledger = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...state.payments]
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (methodFilter !== "all" && p.method !== methodFilter) return false;
        if (!term) return true;
        const student = getStudent(p.studentId);
        return (
          (student?.name ?? "").toLowerCase().includes(term) ||
          p.transactionId.toLowerCase().includes(term) ||
          p.gateway.toLowerCase().includes(term) ||
          methodLabel(p.method).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [state.payments, statusFilter, methodFilter, q, getStudent]);

  const selectedStudent = getStudent(studentId);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payments"
        description="Collect fees at the counter or simulate online payments — receipts are issued automatically."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dues">
              <Button variant="soft">
                Who owes <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/receipts">
              <Button variant="ghost">
                Receipts <Receipt className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      {message ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
          </p>
          <button type="button" onClick={() => setMessage(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Payments logged" value={String(stats.count)} tone="accent" />
        <Stat label="Collected" value={formatINR(stats.collected)} tone="success" />
        <Stat label="Successful" value={String(stats.success)} />
        <Stat
          label="Failed / pending"
          value={`${stats.failed} / ${stats.pending}`}
          tone={stats.failed ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
        <Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.06))] px-5 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-bold">Collect payment</p>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Pick a student, select dues, choose method, then collect.
            </p>
          </div>
          <div className="space-y-4 p-5">
            <Field label="Student">
              <Select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setSelected([]);
                  setMessage(null);
                }}
              >
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.className}-{s.section} · {s.admissionNo}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedStudent ? (
              <div className="rounded-2xl bg-[var(--bg)] px-4 py-3 text-sm">
                <p className="font-semibold">{selectedStudent.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {selectedStudent.parentName} · {selectedStudent.mobile}
                </p>
              </div>
            ) : null}

            <Field label="Payment method">
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="upi">UPI</option>
                <option value="card">Credit / Debit Card</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
                <option value="cash">Cash (counter)</option>
              </Select>
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Open dues</p>
                {openDues.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--accent)] hover:underline"
                    onClick={() => setSelected(openDues.map((d) => d.id))}
                  >
                    Select all
                  </button>
                ) : null}
              </div>
              <div className="space-y-2">
                {openDues.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-sm text-[var(--muted)]">
                    No open dues for this student.
                  </p>
                ) : (
                  openDues.map((d) => {
                    const checked = selected.includes(d.id);
                    const amt = outstanding(d.amount, d.fine, d.paidAmount);
                    return (
                      <label
                        key={d.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-3 transition ${
                          checked
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelected((prev) =>
                                e.target.checked
                                  ? [...prev, d.id]
                                  : prev.filter((id) => id !== d.id),
                              );
                            }}
                          />
                          <span>
                            <span className="block text-sm font-semibold">{d.installmentName}</span>
                            <span className="text-xs text-[var(--muted)]">
                              {d.status} · due {formatDate(d.dueDate)}
                            </span>
                          </span>
                        </span>
                        <span className="font-bold tabular-nums">{formatINR(amt)}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--ink)] px-4 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
                Collecting
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                {formatINR(amount || 0)}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {selected.length} installment{selected.length === 1 ? "" : "s"} ·{" "}
                {methodLabel(method)}
              </p>
            </div>

            <Button
              className="w-full"
              disabled={amount <= 0}
              onClick={() => {
                const result = recordPayment({
                  studentId,
                  dueIds: selected,
                  method,
                  amount,
                });
                setSelected([]);
                setMessage(
                  `Payment ${result.payment.transactionId} successful. Receipt ${result.receipt.receiptNo} generated.`,
                );
              }}
            >
              <CreditCard className="h-4 w-4" /> Collect {formatINR(amount || 0)}
            </Button>
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-bold">Payment ledger</p>
              <p className="text-xs text-[var(--muted)]">
                {ledger.length} payment{ledger.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-[180px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  className="pl-9"
                  placeholder="Search txn, student…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select
                className="w-full sm:w-36"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </Select>
              <Select
                className="w-full sm:w-36"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              >
                <option value="all">All methods</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net banking</option>
                <option value="wallet">Wallet</option>
                <option value="cash">Cash</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2 p-4 sm:p-5">
            {ledger.length === 0 ? (
              <EmptyState title="No payments found" description="Try another filter or collect a payment." />
            ) : (
              ledger.map((p) => {
                const student = getStudent(p.studentId);
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{student?.name ?? p.studentId}</p>
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
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatDateTime(p.paidAt)} · {methodLabel(p.method)} · {p.gateway}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.65rem] text-[var(--muted-2)]">
                        {p.transactionId}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p
                        className={`font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em] ${
                          p.status === "success" ? "text-[var(--success)]" : ""
                        }`}
                      >
                        {formatINR(p.amount)}
                      </p>
                      <Link
                        href="/admin/receipts"
                        className="text-xs font-bold text-[var(--accent)] hover:underline"
                      >
                        View receipts →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
