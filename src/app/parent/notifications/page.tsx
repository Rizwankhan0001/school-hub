"use client";

import { useMemo, useState } from "react";
import { Video } from "lucide-react";
import { Badge, Button, PageHeader, Surface } from "@/components/ui";
import { AIVideoCallModal } from "@/components/ai-video-call-modal";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR } from "@/lib/format";
import type { AICallLog } from "@/lib/types";

const GENTLE_EVENTS = new Set([
  "Gentle Reminder",
  "Friendly Nudge",
  "Kind Follow-up",
  "Soft Due Note",
  "Courteous Ping",
  "AI Video Call",
  "AI Voice Call",
]);

export default function ParentNotificationsPage() {
  const { user, getParentStudents, state, updateAICallStatus } = useApp();
  const ids = useMemo(
    () => new Set(getParentStudents(user?.parentId ?? "").map((s) => s.id)),
    [getParentStudents, user?.parentId],
  );
  const logs = state.communications.filter(
    (c) => c.studentId && ids.has(c.studentId),
  );
  const [activeCall, setActiveCall] = useState<AICallLog | null>(null);

  const videoCalls = useMemo(
    () =>
      state.aiCalls.filter(
        (c) =>
          ids.has(c.studentId) &&
          c.callType === "video" &&
          (c.status === "ringing" || c.status === "queued" || c.status === "in_progress"),
      ),
    [state.aiCalls, ids],
  );

  return (
    <div className="animate-rise">
      <PageHeader
        title="Alerts & reminders"
        description="Gentle fee notes and AI video messages from your school appear here."
      />

      {videoCalls.length > 0 ? (
        <div className="mb-6 space-y-3">
          {videoCalls.map((call) => (
            <Surface
              key={call.id}
              className="flex flex-col gap-4 border-[var(--accent)] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Video className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">AI video reminder waiting</p>
                  <p className="text-sm text-[var(--muted)]">
                    {call.avatarName} · {formatINR(call.amount)}
                  </p>
                </div>
              </div>
              <Button onClick={() => setActiveCall(call)}>Watch now</Button>
            </Surface>
          ))}
        </div>
      ) : null}

      <Surface>
        <div className="divide-y divide-[var(--line)]">
          {logs.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={GENTLE_EVENTS.has(c.event) ? "success" : "info"}>
                    {c.channel.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{c.event}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{c.message}</p>
              </div>
              <p className="shrink-0 text-xs text-[var(--muted)]">
                {formatDateTime(c.sentAt)}
              </p>
            </div>
          ))}
          {logs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
              No notifications yet.
            </p>
          ) : null}
        </div>
      </Surface>

      {activeCall ? (
        <AIVideoCallModal
          call={activeCall}
          schoolName={state.school.name}
          onClose={() => setActiveCall(null)}
          onComplete={(paymentLinkSent) => {
            updateAICallStatus(activeCall.id, "completed", {
              paymentLinkSent,
              summary: paymentLinkSent
                ? "Parent watched the AI video reminder and received a payment link."
                : "Parent closed the AI video reminder early.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
