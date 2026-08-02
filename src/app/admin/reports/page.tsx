"use client";

import { useMemo } from "react";
import { PageHeader, Stat, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatINR, outstanding } from "@/lib/format";

export default function ReportsPage() {
  const { state, metrics } = useApp();

  const byClass = useMemo(() => {
    const map = new Map<string, { due: number; students: Set<string> }>();
    for (const d of state.dues.filter((x) => x.status !== "paid")) {
      const student = state.students.find((s) => s.id === d.studentId);
      if (!student) continue;
      const row = map.get(student.className) ?? { due: 0, students: new Set() };
      row.due += outstanding(d.amount, d.fine, d.paidAmount);
      row.students.add(student.id);
      map.set(student.className, row);
    }
    return Array.from(map.entries()).map(([className, v]) => ({
      className,
      due: v.due,
      students: v.students.size,
    }));
  }, [state.dues, state.students]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of state.payments.filter((x) => x.status === "success")) {
      const key = new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
      }).format(new Date(p.paidAt));
      map.set(key, (map.get(key) ?? 0) + p.amount);
    }
    return Array.from(map.entries());
  }, [state.payments]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Reports & analytics"
        description="Daily/monthly collection, class-wise dues, and recovery visibility for school leadership."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Collected YTD" value={formatINR(metrics.collected)} tone="success" />
        <Stat label="Open dues" value={formatINR(metrics.totalDue)} tone="danger" />
        <Stat label="Collection rate" value={`${metrics.collectionRate}%`} tone="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">Class-wise dues</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Pending students</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {byClass.map((r) => (
                  <tr key={r.className}>
                    <td className="font-medium">{r.className}</td>
                    <td>{r.students}</td>
                    <td>{formatINR(r.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">Monthly collection</h2>
          </div>
          <div className="space-y-3 p-5">
            {monthly.map(([month, amount]) => {
              const max = Math.max(...monthly.map(([, a]) => a), 1);
              return (
                <div key={month}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{month}</span>
                    <span className="font-semibold">{formatINR(amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--ink-soft)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-2),var(--accent))]"
                      style={{ width: `${(amount / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}
