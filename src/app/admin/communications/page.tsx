"use client";

import { Badge, PageHeader, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

const tone = {
  sms: "info" as const,
  email: "neutral" as const,
  whatsapp: "success" as const,
  push: "accent" as const,
};

export default function CommunicationsPage() {
  const { state, getStudent } = useApp();

  return (
    <div className="animate-rise">
      <PageHeader
        title="Communication center"
        description="SMS, email, and WhatsApp logs for fee generated, reminders, payment success, and receipts."
      />

      <Surface>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Channel</th>
                <th>Event</th>
                <th>Recipient</th>
                <th>Student</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.communications.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">{formatDateTime(c.sentAt)}</td>
                  <td>
                    <Badge tone={tone[c.channel]}>{c.channel.toUpperCase()}</Badge>
                  </td>
                  <td>{c.event}</td>
                  <td>{c.recipient}</td>
                  <td>{c.studentId ? getStudent(c.studentId)?.name : "—"}</td>
                  <td className="max-w-sm">
                    <p className="line-clamp-2 text-[var(--muted)]">{c.message}</p>
                  </td>
                  <td>
                    <Badge
                      tone={
                        c.status === "sent"
                          ? "success"
                          : c.status === "queued"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {c.status}
                    </Badge>
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
