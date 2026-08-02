"use client";

import { useMemo, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import {
  Badge,
  Button,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  dueStatusLabel,
  formatDate,
  formatINR,
  outstanding,
} from "@/lib/format";
import type { DueStatus } from "@/lib/types";

export default function DuesPage() {
  const { state, metrics, getStudent, sendReminder } = useApp();
  const [filter, setFilter] = useState<"all" | DueStatus>("all");

  const rows = useMemo(() => {
    return state.dues
      .filter((d) => d.status !== "paid")
      .filter((d) => filter === "all" || d.status === filter)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.dues, filter]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Due tracking"
        description="Upcoming (0–7 days), due today, and overdue installments with one-click reminders."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total due" value={formatINR(metrics.totalDue)} />
        <Stat label="Overdue" value={formatINR(metrics.overdue)} tone="danger" />
        <Stat label="Due today" value={formatINR(metrics.dueToday)} tone="accent" />
        <Stat label="Upcoming" value={formatINR(metrics.upcoming)} tone="success" />
      </div>

      <Surface>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <p className="text-sm font-medium">{rows.length} open dues</p>
          <Select
            className="w-44"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All open</option>
            <option value="overdue">Overdue</option>
            <option value="due_today">Due today</option>
            <option value="upcoming">Upcoming</option>
            <option value="partial">Partial</option>
          </Select>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Installment</th>
                <th>Due date</th>
                <th>Base</th>
                <th>Fine</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Remind</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const student = getStudent(d.studentId);
                return (
                  <tr key={d.id}>
                    <td>
                      <p className="font-medium">{student?.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {student?.className}-{student?.section}
                      </p>
                    </td>
                    <td>{d.installmentName}</td>
                    <td>{formatDate(d.dueDate)}</td>
                    <td>{formatINR(d.amount)}</td>
                    <td>{formatINR(d.fine)}</td>
                    <td>{formatINR(d.paidAmount)}</td>
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="SMS"
                          onClick={() => sendReminder(d.id, "sms")}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Email"
                          onClick={() => sendReminder(d.id, "email")}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="WhatsApp"
                          onClick={() => sendReminder(d.id, "whatsapp")}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
