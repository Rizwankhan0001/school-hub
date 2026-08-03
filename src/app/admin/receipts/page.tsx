"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Search } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { ReceiptActions } from "@/components/receipt-actions";
import { useApp } from "@/lib/store";
import { formatDate, formatDateTime, formatINR, methodLabel } from "@/lib/format";

export default function ReceiptsPage() {
  const { state, getStudent } = useApp();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.receipts[0]?.id ?? null);

  const stats = useMemo(() => {
    const total = state.receipts.reduce((s, r) => s + r.amount, 0);
    const gst = state.receipts.reduce((s, r) => s + r.gstAmount, 0);
    return { count: state.receipts.length, total, gst };
  }, [state.receipts]);

  const classes = useMemo(() => {
    const set = new Set<string>();
    for (const r of state.receipts) {
      const s = getStudent(r.studentId);
      if (s) set.add(s.className);
    }
    return Array.from(set).sort();
  }, [state.receipts, getStudent]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...state.receipts]
      .filter((r) => {
        const student = getStudent(r.studentId);
        if (classFilter !== "all" && student?.className !== classFilter) return false;
        if (!term) return true;
        const payment = state.payments.find((p) => p.id === r.paymentId);
        return (
          r.receiptNo.toLowerCase().includes(term) ||
          (student?.name ?? "").toLowerCase().includes(term) ||
          (student?.admissionNo ?? "").toLowerCase().includes(term) ||
          (payment?.transactionId ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [state.receipts, state.payments, classFilter, q, getStudent]);

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const selectedDoc = useMemo(() => {
    if (!selected) return null;
    const student = getStudent(selected.studentId);
    const payment = state.payments.find((p) => p.id === selected.paymentId);
    if (!student || !payment) return null;
    const lineItems =
      payment.dueIds.map((dueId) => {
        const due = state.dues.find((d) => d.id === dueId);
        return {
          name: due?.installmentName ?? "Fee installment",
          amount: due ? due.amount + due.fine : 0,
        };
      }) ?? [];
    return {
      school: state.school,
      student,
      receipt: selected,
      payment,
      parentName: student.parentName,
      lineItems: lineItems.filter((i) => i.amount > 0),
    };
  }, [selected, getStudent, state.payments, state.dues, state.school]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Receipts"
        description="Auto-issued fee receipts — search, open, download, or print any payment receipt."
        actions={
          <Link href="/admin/payments">
            <Button variant="soft">
              Payments <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Receipts issued" value={String(stats.count)} tone="accent" />
        <Stat label="Receipt total" value={formatINR(stats.total)} tone="success" />
        <Stat label="GST collected" value={formatINR(stats.gst)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
        <Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-bold">Receipt list</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  className="pl-9"
                  placeholder="Search receipt no, student, txn…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select
                className="w-full sm:w-40"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">All classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="max-h-[34rem] space-y-2 overflow-y-auto p-3 sm:p-4">
            {filtered.length === 0 ? (
              <EmptyState title="No receipts found" description="Try another search or class filter." />
            ) : (
              filtered.map((r) => {
                const student = getStudent(r.studentId);
                const active = (selected?.id ?? selectedId) === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-[1.2rem] border p-3.5 text-left transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold tracking-tight">{r.receiptNo}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold">{student?.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {student?.className}-{student?.section} · {formatDate(r.issuedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums">{formatINR(r.amount)}</p>
                        <Badge tone="success">Issued</Badge>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          {!selected || !selectedDoc ? (
            <EmptyState
              title="Select a receipt"
              description="Pick a receipt from the list to preview and download."
            />
          ) : (
            <>
              <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.08))] px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                      {state.school.name}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      {selected.receiptNo}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Issued {formatDateTime(selected.issuedAt)}
                    </p>
                  </div>
                  <Badge tone="success">Issued</Badge>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Student</p>
                    <p className="mt-1 font-semibold">{selectedDoc.student.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedDoc.student.admissionNo} · {selectedDoc.student.className}-
                      {selectedDoc.student.section}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Parent</p>
                    <p className="mt-1 font-semibold">{selectedDoc.parentName}</p>
                    <p className="text-xs text-[var(--muted)]">{selectedDoc.student.mobile}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Amount</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                      {formatINR(selected.amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Payment</p>
                    <p className="mt-1 font-semibold">
                      {methodLabel(selectedDoc.payment.method)} · {selectedDoc.payment.gateway}
                    </p>
                    <p className="font-mono text-[0.65rem] text-[var(--muted)]">
                      {selectedDoc.payment.transactionId}
                    </p>
                  </div>
                </div>

                {selectedDoc.lineItems.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold">Line items</p>
                    <div className="overflow-hidden rounded-[1.15rem] border border-[var(--line)]">
                      {selectedDoc.lineItems.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 text-sm last:border-b-0"
                        >
                          <span>{item.name}</span>
                          <span className="font-semibold tabular-nums">
                            {formatINR(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[var(--muted)]">GST</span>
                    <span className="font-semibold">
                      {formatINR(selected.gstAmount)} · GSTIN {state.school.gstin}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[var(--line)] pt-4">
                  <ReceiptActions document={selectedDoc} size="md" emphasize />
                </div>

                <Link
                  href={`/admin/students/${selectedDoc.student.id}`}
                  className="inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
                >
                  Open student profile →
                </Link>
              </div>
            </>
          )}
        </Surface>
      </div>
    </div>
  );
}
