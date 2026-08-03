"use client";

import { Badge, Button, PageHeader, Surface } from "@/components/ui";
import { FileText } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR, methodLabel } from "@/lib/format";
import { openFeeReceipt } from "@/lib/receipt-document";

export default function ParentHistoryPage() {
  const { user, getParentStudents, state, getStudent } = useApp();
  const ids = new Set(getParentStudents(user?.parentId ?? "").map((s) => s.id));
  const payments = state.payments.filter((p) => ids.has(p.studentId));

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payment history"
        description="All fee transactions. Generate a receipt for any successful payment."
      />

      <div className="space-y-3 md:hidden">
        {payments.map((p) => {
          const student = getStudent(p.studentId);
          const receipt = state.receipts.find((r) => r.paymentId === p.id);
          return (
            <Surface key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{student?.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(p.paidAt)}</p>
                </div>
                <Badge tone={p.status === "success" ? "success" : "danger"}>{p.status}</Badge>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-bold tracking-[-0.02em]">{formatINR(p.amount)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {methodLabel(p.method)} · {p.transactionId}
                  </p>
                </div>
                {p.status === "success" && receipt && student ? (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      openFeeReceipt({
                        school: state.school,
                        student,
                        receipt,
                        payment: p,
                        parentName: user?.name,
                        lineItems: p.dueIds.map((dueId) => {
                          const due = state.dues.find((d) => d.id === dueId);
                          return {
                            name: due?.installmentName ?? "Fee installment",
                            amount: due ? due.amount + due.fine : 0,
                          };
                        }),
                      })
                    }
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Receipt
                  </Button>
                ) : null}
              </div>
            </Surface>
          );
        })}
        {payments.length === 0 ? (
          <Surface className="p-8 text-center text-sm text-[var(--muted)]">No payments yet.</Surface>
        ) : null}
      </div>

      <Surface className="hidden md:block">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const student = getStudent(p.studentId);
                const receipt = state.receipts.find((r) => r.paymentId === p.id);
                return (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.paidAt)}</td>
                    <td>{student?.name}</td>
                    <td className="font-semibold">{formatINR(p.amount)}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td>{p.transactionId}</td>
                    <td>
                      <Badge tone={p.status === "success" ? "success" : "danger"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td>
                      {p.status === "success" && receipt && student ? (
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() =>
                            openFeeReceipt({
                              school: state.school,
                              student,
                              receipt,
                              payment: p,
                              parentName: user?.name,
                              lineItems: p.dueIds.map((dueId) => {
                                const due = state.dues.find((d) => d.id === dueId);
                                return {
                                  name: due?.installmentName ?? "Fee installment",
                                  amount: due ? due.amount + due.fine : 0,
                                };
                              }),
                            })
                          }
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Generate
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--muted-2)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
