"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, CheckCircle2 } from "lucide-react";
import { ReceiptActions } from "@/components/receipt-actions";
import {
  Badge,
  Button,
  Field,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { computeFeePaymentBreakdown, formatINR, outstanding } from "@/lib/format";
import type { PaymentMethod, Receipt } from "@/lib/types";
import type { ReceiptDocumentInput } from "@/lib/receipt-document";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "wallet", label: "Wallet" },
];

function selectionForPlan(dues: { id: string }[], code?: string) {
  if (!code || dues.length === 0) return [];
  if (code === "annual_full") return dues.map((d) => d.id);
  if (code === "half_yearly") {
    return dues.slice(0, Math.min(2, dues.length)).map((d) => d.id);
  }
  return [dues[0].id];
}

export default function ParentPayPage() {
  const { user, getParentStudents, getOpenDues, recordPayment, state, getStudent } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const paymentOptions = state.feePaymentOptions ?? [];
  const initialStudentId = students[0]?.id ?? "";
  const initialPlan = paymentOptions.find((p) => p.highlight) ?? paymentOptions[0] ?? null;
  const [studentId, setStudentId] = useState(initialStudentId);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [selected, setSelected] = useState<string[]>(() =>
    selectionForPlan(getOpenDues([initialStudentId]), initialPlan?.code),
  );
  const [busy, setBusy] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState<Receipt | null>(null);
  const [planId, setPlanId] = useState(() => initialPlan?.id ?? "");
  const router = useRouter();

  const student = students.find((s) => s.id === studentId);
  const dues = getOpenDues([studentId]);
  const selectedPlan =
    paymentOptions.find((p) => p.id === planId) ?? paymentOptions[0] ?? null;

  const classAnnualTotal = student
    ? state.feeStructures
        .filter((f) => f.className === student.className)
        .reduce((s, f) => s + f.amount, 0)
    : 0;

  const rawAmount = dues
    .filter((d) => selected.includes(d.id))
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);

  const payingAllOpen =
    dues.length > 0 && selected.length === dues.length && selected.every((id) => dues.some((d) => d.id === id));

  const breakdown = selectedPlan
    ? computeFeePaymentBreakdown(
        selectedPlan.code === "annual_full" && classAnnualTotal > 0
          ? classAnnualTotal
          : rawAmount,
        selectedPlan,
      )
    : null;

  // Apply plan pricing when paying all open dues under annual, or when using EMI surcharge on selected amount
  const amount = (() => {
    if (!selectedPlan || rawAmount <= 0) return 0;
    if (selectedPlan.code === "annual_full" && payingAllOpen) {
      // Discount on outstanding open dues (demo-friendly)
      return Math.round(rawAmount * (1 - selectedPlan.discountPercent / 100));
    }
    if (selectedPlan.surchargePercent > 0) {
      return Math.round(rawAmount * (1 + selectedPlan.surchargePercent / 100));
    }
    if (selectedPlan.discountPercent > 0 && payingAllOpen) {
      return Math.round(rawAmount * (1 - selectedPlan.discountPercent / 100));
    }
    return rawAmount;
  })();

  const savings = rawAmount > amount ? rawAmount - amount : 0;
  const extra = amount > rawAmount ? amount - rawAmount : 0;

  const receiptDocument = useMemo((): ReceiptDocumentInput | null => {
    if (!issuedReceipt) return null;
    const stu = getStudent(issuedReceipt.studentId);
    const payment = state.payments.find((p) => p.id === issuedReceipt.paymentId);
    if (!stu || !payment) return null;
    const lineItems = payment.dueIds.map((dueId) => {
      const due = state.dues.find((d) => d.id === dueId);
      return {
        name: due?.installmentName ?? "Fee installment",
        amount: due ? due.amount + due.fine : 0,
      };
    });
    return {
      school: state.school,
      student: stu,
      receipt: issuedReceipt,
      payment,
      parentName: user?.name,
      lineItems: lineItems.filter((i) => i.amount > 0),
    };
  }, [issuedReceipt, getStudent, state.payments, state.dues, state.school, user?.name]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Pay fees"
        description="Choose a payment plan (one-time discount or EMI), select dues, and pay securely."
      />

      <Surface className="mx-auto max-w-2xl p-5 sm:p-6">
        <Field label="Child">
          <Select
            value={studentId}
            onChange={(e) => {
              const nextStudentId = e.target.value;
              setStudentId(nextStudentId);
              setSelected(selectionForPlan(getOpenDues([nextStudentId]), selectedPlan?.code));
              setIssuedReceipt(null);
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.className}-{s.section}
              </option>
            ))}
          </Select>
        </Field>

        {paymentOptions.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm font-medium">Choose how you want to pay</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tap a plan — pay in full for a discount, or pick an EMI style for smaller parts.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {paymentOptions.map((opt) => {
                const active = selectedPlan?.id === opt.id;
                const preview = computeFeePaymentBreakdown(
                  classAnnualTotal || rawAmount || 0,
                  opt,
                );
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPlanId(opt.id);
                      setSelected(selectionForPlan(dues, opt.code));
                      setIssuedReceipt(null);
                    }}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/30"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold tracking-[-0.02em]">{opt.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">{opt.tagline}</p>
                      </div>
                      {active ? <Badge tone="accent">Selected</Badge> : null}
                      {!active && opt.highlight ? <Badge tone="success">Best</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--ink-2)]">
                      {opt.description}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[var(--ink)]">
                      {opt.discountPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[var(--success)]">
                          <BadgePercent className="h-3.5 w-3.5" />
                          {opt.discountPercent}% off
                        </span>
                      ) : opt.surchargePercent > 0 ? (
                        <span>+{opt.surchargePercent}% convenience</span>
                      ) : (
                        <span>No extra charge</span>
                      )}
                      <span className="text-[var(--muted)]">
                        {" "}
                        ·{" "}
                        {opt.installments === 1
                          ? `~${formatINR(preview.payable)}`
                          : `${opt.installments} × ~${formatINR(preview.perInstallment)}`}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Outstanding installments</p>
            {dues.length > 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
                onClick={() => setSelected(dues.map((d) => d.id))}
              >
                Select all
              </button>
            ) : null}
          </div>
          {dues.length === 0 ? (
            <p className="rounded-xl bg-[var(--ink-soft)] px-4 py-6 text-sm text-[var(--muted)]">
              No dues pending for this student.
            </p>
          ) : (
            dues.map((d) => {
              const amt = outstanding(d.amount, d.fine, d.paidAmount);
              return (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(d.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, d.id]
                            : prev.filter((id) => id !== d.id),
                        )
                      }
                    />
                    <span>
                      <span className="block font-medium">{d.installmentName}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {d.status}
                        {d.fine > 0 ? ` · fine ${formatINR(d.fine)}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold">{formatINR(amt)}</span>
                </label>
              );
            })
          )}
        </div>

        <div className="mt-5">
          <Field label="Payment method">
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {selectedPlan && rawAmount > 0 ? (
          <div className="mt-4 rounded-2xl bg-[var(--bg)] px-4 py-3 text-sm">
            <p className="font-semibold">{selectedPlan.name} summary</p>
            <p className="mt-1 text-[var(--muted)]">
              Selected dues: {formatINR(rawAmount)}
              {savings > 0 ? (
                <span className="text-[var(--success)]">
                  {" "}
                  · you save {formatINR(savings)}
                </span>
              ) : null}
              {extra > 0 ? (
                <span className="text-[var(--muted)]">
                  {" "}
                  · includes {formatINR(extra)} convenience fee
                </span>
              ) : null}
            </p>
            {selectedPlan.code === "annual_full" && !payingAllOpen ? (
              <p className="mt-1 text-xs text-[var(--accent-hover)]">
                Select all open dues to unlock the {selectedPlan.discountPercent}% full-payment
                discount.
              </p>
            ) : null}
            {breakdown && classAnnualTotal > 0 && selectedPlan.code === "annual_full" ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Full-year structure for {student?.className}: {formatINR(classAnnualTotal)} →{" "}
                {formatINR(breakdown.payable)} after plan pricing.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--ink)] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">Payable</p>
            <p className="font-[family-name:var(--font-display)] text-3xl">
              {formatINR(amount)}
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={amount <= 0 || busy}
            onClick={() => {
              setBusy(true);
              window.setTimeout(() => {
                const result = recordPayment({
                  studentId,
                  dueIds: selected,
                  method,
                  amount,
                });
                setBusy(false);
                setSelected([]);
                setIssuedReceipt(result.receipt);
              }, 900);
            }}
          >
            {busy ? "Processing…" : "Pay securely"}
          </Button>
        </div>

        {issuedReceipt && receiptDocument ? (
          <div className="mt-5 rounded-2xl border border-[var(--success)]/25 bg-[var(--success-soft)] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--success)]">Payment successful</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">
                  Receipt <span className="font-semibold">{issuedReceipt.receiptNo}</span> is ready.
                  Generate it now to view, download, or print as PDF.
                </p>
                <div className="mt-4">
                  <ReceiptActions document={receiptDocument} emphasize size="md" />
                </div>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-[var(--accent)] hover:underline"
                  onClick={() => router.push("/parent/receipts")}
                >
                  Go to all receipts
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Surface>
    </div>
  );
}
