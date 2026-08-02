"use client";

import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { Badge, Button, PageHeader, Stat, Surface, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  dueStatusLabel,
  formatDate,
  formatINR,
  outstanding,
} from "@/lib/format";

export default function AdminOverviewPage() {
  const { metrics, state, sendReminder, getStudent } = useApp();
  const recentDues = state.dues
    .filter((d) => d.status !== "paid")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
  const recentPays = state.payments.slice(0, 5);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Today’s collection picture"
        description={`A clear snapshot for ${state.school.name}. See what’s unpaid, what’s overdue, and what’s already collected.`}
        actions={
          <Link href="/admin/dues">
            <Button variant="soft">
              Review unpaid fees <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Still unpaid"
          value={formatINR(metrics.totalDue)}
          hint="Open installments across students"
        />
        <Stat
          label="Overdue"
          value={formatINR(metrics.overdue)}
          tone="danger"
          hint="Past the due date"
        />
        <Stat
          label="Collection rate"
          value={`${metrics.collectionRate}%`}
          tone="success"
          hint={`${formatINR(metrics.collected)} received so far`}
        />
        <Stat
          label="Students pending"
          value={String(metrics.pendingStudents)}
          tone="accent"
          hint={`Due today: ${formatINR(metrics.dueToday)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Surface>
          <SectionTitle
            title="Needs attention first"
            action={
              <Link href="/admin/dues" className="text-sm font-semibold text-[var(--teal)] hover:underline">
                See all
              </Link>
            }
          />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Fee</th>
                  <th>Due on</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentDues.map((d) => {
                  const student = getStudent(d.studentId);
                  return (
                    <tr key={d.id}>
                      <td>
                        <p className="font-semibold tracking-[-0.01em]">{student?.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {student?.className}-{student?.section}
                        </p>
                      </td>
                      <td>{d.installmentName}</td>
                      <td>{formatDate(d.dueDate)}</td>
                      <td className="font-semibold">
                        {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                      </td>
                      <td>
                        <Badge
                          tone={
                            d.status === "overdue"
                              ? "danger"
                              : d.status === "due_today"
                                ? "warning"
                                : d.status === "partial"
                                  ? "info"
                                  : "neutral"
                          }
                        >
                          {dueStatusLabel(d.status)}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => sendReminder(d.id, "sms")}
                        >
                          <Send className="h-3.5 w-3.5" /> Remind
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface>
          <SectionTitle title="Latest payments" />
          <div className="space-y-2.5 p-4">
            {recentPays.map((p) => {
              const student = getStudent(p.studentId);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{student?.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{p.transactionId}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--success)]">
                    {formatINR(p.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}
