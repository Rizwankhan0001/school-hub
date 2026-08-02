"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ReceiptActions } from "@/components/receipt-actions";
import {
  Button,
  Field,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatINR, outstanding } from "@/lib/format";
import type { PaymentMethod, Receipt } from "@/lib/types";
import type { ReceiptDocumentInput } from "@/lib/receipt-document";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "wallet", label: "Wallet" },
];

export default function ParentPayPage() {
  const { user, getParentStudents, getOpenDues, recordPayment, state, getStudent } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState<Receipt | null>(null);
  const router = useRouter();

  const dues = useMemo(() => getOpenDues([studentId]), [getOpenDues, studentId]);
  const amount = dues
    .filter((d) => selected.includes(d.id))
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);

  const receiptDocument = useMemo((): ReceiptDocumentInput | null => {
    if (!issuedReceipt) return null;
    const student = getStudent(issuedReceipt.studentId);
    const payment = state.payments.find((p) => p.id === issuedReceipt.paymentId);
    if (!student || !payment) return null;
    const lineItems = payment.dueIds.map((dueId) => {
      const due = state.dues.find((d) => d.id === dueId);
      return {
        name: due?.installmentName ?? "Fee installment",
        amount: due ? due.amount + due.fine : 0,
      };
    });
    return {
      school: state.school,
      student,
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
        description="Select dues and complete payment. A fee receipt is ready to generate right after payment."
      />

      <Surface className="mx-auto max-w-2xl p-6">
        <Field label="Child">
          <Select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setSelected([]);
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

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium">Outstanding installments</p>
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

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--ink)] px-5 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">Payable</p>
            <p className="font-[family-name:var(--font-display)] text-3xl">
              {formatINR(amount)}
            </p>
          </div>
          <Button
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
