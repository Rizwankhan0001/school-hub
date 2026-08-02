"use client";

import { Badge, Button, PageHeader, Select, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import type { TicketStatus } from "@/lib/types";

export default function AdminSupportPage() {
  const { state, updateTicketStatus, getStudent } = useApp();

  return (
    <div className="animate-rise">
      <PageHeader
        title="Support tickets"
        description="Parent payment, receipt, and scholarship issues for support agents and school staff."
      />

      <Surface>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Created</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Student</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {state.tickets.map((t) => (
                <tr key={t.id}>
                  <td>{formatDateTime(t.createdAt)}</td>
                  <td>
                    <p className="font-medium">{t.subject}</p>
                    <p className="max-w-xs text-xs text-[var(--muted)]">{t.description}</p>
                  </td>
                  <td>
                    <Badge tone="info">{t.category}</Badge>
                  </td>
                  <td>{t.studentId ? getStudent(t.studentId)?.name : "—"}</td>
                  <td>
                    <Badge
                      tone={
                        t.status === "resolved" || t.status === "closed"
                          ? "success"
                          : t.status === "in_progress"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Select
                        className="w-36"
                        value={t.status}
                        onChange={(e) =>
                          updateTicketStatus(t.id, e.target.value as TicketStatus)
                        }
                      >
                        <option value="open">open</option>
                        <option value="in_progress">in_progress</option>
                        <option value="resolved">resolved</option>
                        <option value="closed">closed</option>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTicketStatus(t.id, "resolved")}
                      >
                        Resolve
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
