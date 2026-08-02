"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatINR } from "@/lib/format";
import type { FeeType } from "@/lib/types";

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

export default function FeesPage() {
  const { state, addFeeItem } = useApp();
  const [classFilter, setClassFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    className: "Class 1",
    feeType: "Tuition Fee" as FeeType,
    amount: 10000,
  });

  const classes = useMemo(
    () => Array.from(new Set(state.feeStructures.map((f) => f.className))).sort(),
    [state.feeStructures],
  );

  const rows = state.feeStructures.filter(
    (f) => classFilter === "All" || f.className === classFilter,
  );

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of state.feeStructures) {
      map.set(f.className, (map.get(f.className) ?? 0) + f.amount);
    }
    return Array.from(map.entries());
  }, [state.feeStructures]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Fee structure"
        description="Create class-wise fee schedules across admission, tuition, transport, and more."
        actions={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Add fee item
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totals.map(([cls, total]) => (
          <div
            key={cls}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {cls}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">
              {formatINR(total)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Annual structure total</p>
          </div>
        ))}
      </div>

      {open ? (
        <Surface className="mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Class">
              <Select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {["Class 1", "Class 3", "Class 5", "Class 8"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fee type">
              <Select
                value={form.feeType}
                onChange={(e) =>
                  setForm({ ...form, feeType: e.target.value as FeeType })
                }
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
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                addFeeItem(form);
                setOpen(false);
              }}
            >
              Save fee item
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      <Surface>
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <p className="text-sm font-medium">Fee schedule items</p>
          <Select
            className="w-40"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option>All</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Class</th>
                <th>Fee type</th>
                <th>Amount</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.className}</td>
                  <td>{f.feeType}</td>
                  <td>{formatINR(f.amount)}</td>
                  <td>{f.academicSession}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
