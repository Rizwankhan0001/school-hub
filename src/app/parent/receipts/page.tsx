"use client";

import { Badge, PageHeader, Surface } from "@/components/ui";
import { ReceiptActions } from "@/components/receipt-actions";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR } from "@/lib/format";

export default function ParentReceiptsPage() {
  const { user, getParentStudents, state, getStudent } = useApp();
  const ids = new Set(getParentStudents(user?.parentId ?? "").map((s) => s.id));
  const receipts = state.receipts.filter((r) => ids.has(r.studentId));

  return (
    <div className="animate-rise">
      <PageHeader
        title="Receipts"
        description="Generate, download, or print fee receipts after each successful payment."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {receipts.map((r) => {
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
                  parentName: user?.name,
                  lineItems: lineItems.filter((i) => i.amount > 0),
                }
              : null;

          return (
            <Surface key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl">{r.receiptNo}</p>
                  <p className="text-sm text-[var(--muted)]">{student?.name}</p>
                </div>
                <Badge tone="success">Ready</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Amount</span>
                  <span className="font-semibold">{formatINR(r.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Transaction</span>
                  <span>{payment?.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Date</span>
                  <span>{formatDateTime(r.issuedAt)}</span>
                </div>
              </div>
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <ReceiptActions document={document} />
              </div>
            </Surface>
          );
        })}
        {receipts.length === 0 ? (
          <Surface className="p-8 text-center text-sm text-[var(--muted)] md:col-span-2">
            No receipts yet. Complete a payment to generate one.
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
