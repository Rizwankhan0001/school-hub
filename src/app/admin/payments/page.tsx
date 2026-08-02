"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  formatDateTime,
  formatINR,
  methodLabel,
  outstanding,
} from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export default function PaymentsPage() {
  const { state, getStudent, getOpenDues, recordPayment } = useApp();
  const [studentId, setStudentId] = useState(state.students[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const openDues = useMemo(
    () => getOpenDues([studentId]),
    [getOpenDues, studentId],
  );

  const amount = openDues
    .filter((d) => selected.includes(d.id))
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payments"
        description="Record offline collections or simulate online gateway success with auto receipts."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Surface className="p-5">
          <h2 className="font-semibold">Record / simulate payment</h2>
          <div className="mt-4 space-y-4">
            <Field label="Student">
              <Select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setSelected([]);
                  setMessage("");
                }}
              >
                {state.students
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.className}-{s.section}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Method">
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
              <p className="mb-2 text-sm font-medium">Select dues to pay</p>
              <div className="space-y-2">
                {openDues.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No open dues for this student.</p>
                ) : (
                  openDues.map((d) => {
                    const checked = selected.includes(d.id);
                    const amt = outstanding(d.amount, d.fine, d.paidAmount);
                    return (
                      <label
                        key={d.id}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3"
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
                            <span className="block text-sm font-medium">{d.installmentName}</span>
                            <span className="text-xs text-[var(--muted)]">{d.status}</span>
                          </span>
                        </span>
                        <span className="font-semibold">{formatINR(amt)}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <Field label="Amount">
              <Input readOnly value={amount} />
            </Field>
            <Button
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
              Collect {formatINR(amount || 0)}
            </Button>
            {message ? (
              <p className="rounded-xl bg-[#e3f6ea] px-3 py-2 text-sm text-[#067647]">
                {message}
              </p>
            ) : null}
          </div>
        </Surface>

        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">Payment ledger</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Gateway</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.paidAt)}</td>
                    <td>{getStudent(p.studentId)?.name}</td>
                    <td className="font-semibold">{formatINR(p.amount)}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td>
                      <p>{p.gateway}</p>
                      <p className="text-xs text-[var(--muted)]">{p.transactionId}</p>
                    </td>
                    <td>
                      <Badge tone={p.status === "success" ? "success" : "danger"}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
}
