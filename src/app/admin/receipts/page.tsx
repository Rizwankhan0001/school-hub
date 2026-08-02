"use client";

import { Badge, PageHeader, Surface } from "@/components/ui";
import { ReceiptActions } from "@/components/receipt-actions";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR } from "@/lib/format";

export default function ReceiptsPage() {
  const { state, getStudent } = useApp();

  return (
    <div className="animate-rise">
      <PageHeader
        title="Receipts"
        description="Auto-issued fee receipts. Generate, download, or print after any payment."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {state.receipts.map((r) => {
          const student = getStudent(r.studentId);
          const payment = state.payments.find((p) => p.id === r.paymentId);
          const lineItems =
            payment?.dueIds.map((dueId) => {
              const due = state.dues.find((d) => d.id === dueId);
              return {
                name: due?.installmentName ?? "Fee installment",
                amount: due ? due.amount + due.fine : 0,
              };
            }) ?? [];
          const document =
            student && payment
              ? {
                  school: state.school,
                  student,
                  receipt: r,
                  payment,
                  parentName: student.parentName,
                  lineItems: lineItems.filter((i) => i.amount > 0),
                }
              : null;

          return (
            <Surface key={r.id} className="overflow-hidden">
              <div className="flex items-start justify-between border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),rgba(36,91,255,0.08))] px-5 py-4">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                    {r.receiptNo}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{state.school.name}</p>
                </div>
                <Badge tone="success">Issued</Badge>
              </div>
              <div className="space-y-3 px-5 py-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">Student</span>
                  <span className="text-right font-medium">
                    {student?.name}
                    <span className="block text-xs font-normal text-[var(--muted)]">
                      {student?.admissionNo} · {student?.className}-{student?.section}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">Amount</span>
                  <span className="font-semibold">{formatINR(r.amount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">Transaction</span>
                  <span>{payment?.transactionId}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">Payment date</span>
                  <span>{formatDateTime(r.issuedAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">GST</span>
                  <span>
                    {formatINR(r.gstAmount)} · GSTIN {state.school.gstin}
                  </span>
                </div>
                <div className="border-t border-[var(--line)] pt-4">
                  <ReceiptActions document={document} />
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
