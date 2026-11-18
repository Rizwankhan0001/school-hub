"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { Badge, Button, PageHeader, Stat, Surface } from "@/components/ui";
import { AIVideoCallModal } from "@/components/ai-video-call-modal";
import { useApp } from "@/lib/store";
import {
  dueStatusLabel,
  formatDate,
  formatINR,
  outstanding,
} from "@/lib/format";
import type { AICallLog } from "@/lib/types";

export default function ParentDashboard() {
  const {
    user,
    getParentStudents,
    getOpenDues,
    state,
    updateAICallStatus,
  } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const studentIds = students.map((s) => s.id);
  const dues = getOpenDues(studentIds);
  const total = dues.reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const upcoming = dues.filter((d) => d.status === "upcoming" || d.status === "due_today");
  const historyCount = state.payments.filter((p) => studentIds.includes(p.studentId)).length;
  const firstName = user?.name.split(" ")[0] ?? "there";
  const [activeCall, setActiveCall] = useState<AICallLog | null>(null);

  const myCalls = state.aiCalls.filter(
    (c) => studentIds.includes(c.studentId) && c.callType === "video",
  );
  const incoming = myCalls.filter(
    (c) => c.status === "ringing" || c.status === "queued" || c.status === "in_progress",
  );
  const gentleNotes = state.communications
    .filter(
      (c) =>
        c.studentId &&
        studentIds.includes(c.studentId) &&
        ["Gentle Reminder", "Friendly Nudge", "Kind Follow-up", "Soft Due Note", "Courteous Ping"].includes(
          c.event,
        ),
    )
    .slice(0, 3);

  return (
    <div className="animate-rise">
      <PageHeader
        title={`Hi ${firstName}`}
        description="Here’s what you owe, school reminders, and any AI video messages from campus."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/parent/scholarships">
              <Button variant="soft">Scholarships</Button>
            </Link>
            <Link href="/parent/meetings">
              <Button variant="soft">Meet a teacher</Button>
            </Link>
            <Link href="/parent/pay">
              <Button>
                Pay fees now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      {incoming[0] ? (
        <Surface className="mb-6 overflow-hidden border-[var(--accent)] bg-[linear-gradient(120deg,var(--accent-soft),white)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-white">
                <Video className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">Incoming AI video call</p>
                <p className="mt-1 font-semibold tracking-[-0.02em]">
                  {state.school.name} wants to share a gentle fee reminder
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {incoming[0].avatarName} · {formatINR(incoming[0].amount)}
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveCall(incoming[0]!)}>Answer video call</Button>
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Amount to pay" value={formatINR(total)} tone="danger" />
        <Stat label="Open fees" value={String(dues.length)} tone="accent" />
        <Stat label="Payments made" value={String(historyCount)} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Your children</h2>
          <div className="mt-4 space-y-3">
            {students.map((s) => {
              const owed = getOpenDues([s.id]).reduce(
                (sum, d) => sum + outstanding(d.amount, d.fine, d.paidAmount),
                0,
              );
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3.5"
                >
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {s.className}-{s.section}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted)]">Due</p>
                    <p className="font-semibold">{formatINR(owed)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Next payments</h2>
            <Link href="/parent/pay" className="text-sm font-semibold text-[var(--teal)] hover:underline">
              Pay
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(upcoming.length ? upcoming : dues).slice(0, 5).map((d) => {
              const student = students.find((s) => s.id === d.studentId);
              return (
                <div key={d.id} className="rounded-2xl border border-[var(--line)] px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{d.installmentName}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {student?.name} · due {formatDate(d.dueDate)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        d.status === "overdue"
                          ? "danger"
                          : d.status === "due_today"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {dueStatusLabel(d.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                    {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                  </p>
                </div>
              );
            })}
            {dues.length === 0 ? (
              <p className="rounded-2xl bg-[var(--success-soft)] px-4 py-6 text-sm text-[var(--success)]">
                You’re all caught up. No fees pending right now.
              </p>
            ) : null}
          </div>
        </Surface>
      </div>

      {gentleNotes.length > 0 ? (
        <Surface className="mt-6 p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Gentle notes from school</h2>
          <div className="mt-4 space-y-3">
            {gentleNotes.map((n) => (
              <div key={n.id} className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">{n.event}</Badge>
                  <Badge tone="info">{n.channel}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{n.message}</p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {activeCall ? (
        <AIVideoCallModal
          call={activeCall}
          schoolName={state.school.name}
          onClose={() => setActiveCall(null)}
          onComplete={(paymentLinkSent) => {
            updateAICallStatus(activeCall.id, "completed", {
              paymentLinkSent,
              summary: paymentLinkSent
                ? "You watched the school AI video reminder. Payment link is ready."
                : "You ended the AI video call early.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
