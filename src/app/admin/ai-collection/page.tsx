"use client";

import { useMemo, useState } from "react";
import { HeartHandshake, Sparkles, Video, WandSparkles } from "lucide-react";
import {
  Badge,
  Button,
  Field,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { AIVideoCallModal } from "@/components/ai-video-call-modal";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR, outstanding } from "@/lib/format";
import type { AICallLog, NotificationChannel } from "@/lib/types";

export default function AICollectionPage() {
  const {
    state,
    getStudent,
    queueAICall,
    sendGentleRandomReminders,
    updateGentleReminderSettings,
    updateAICallStatus,
    metrics,
  } = useApp();
  const [batchMsg, setBatchMsg] = useState("");
  const [activeCall, setActiveCall] = useState<AICallLog | null>(null);
  const [lang, setLang] = useState<AICallLog["language"]>("English");

  const overdue = state.dues.filter((d) => d.status === "overdue" || d.status === "partial");
  const videoCalls = state.aiCalls.filter((c) => c.callType === "video");
  const gentleLogs = state.communications.filter((c) =>
    ["Gentle Reminder", "Friendly Nudge", "Kind Follow-up", "Soft Due Note", "Courteous Ping"].includes(
      c.event,
    ),
  );
  const settings = state.gentleReminders;

  const previewTemplates = useMemo(
    () => [
      "Hi Parent, a soft note from school…",
      "Just a gentle reminder when convenient…",
      "Warm follow-up — no rush panic…",
    ],
    [],
  );

  const startVideo = (dueId: string) => {
    const call = queueAICall(dueId, lang, "video");
    if (call) setActiveCall(call);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Gentle reminders & AI video calls"
        description="Send random soft nudges to parents, then follow up with friendly AI-generated video calls that share a payment link."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Still unpaid" value={formatINR(metrics.totalDue)} />
        <Stat label="Gentle messages sent" value={String(gentleLogs.length)} tone="success" />
        <Stat label="AI video calls" value={String(videoCalls.length)} tone="accent" />
        <Stat
          label="Reminder mode"
          value={settings.enabled ? "On" : "Off"}
          hint={`Daily cap ${settings.dailyCap}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Random gentle reminders</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                The system picks unpaid students at random and sends a kind, non-threatening message
                from the school.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Tone">
              <Select
                value={settings.tone}
                onChange={(e) =>
                  updateGentleReminderSettings({
                    tone: e.target.value as typeof settings.tone,
                  })
                }
              >
                <option value="very_gentle">Very gentle</option>
                <option value="gentle">Gentle</option>
                <option value="firm_polite">Firm but polite</option>
              </Select>
            </Field>
            <Field label="How many per batch">
              <Select
                value={String(settings.dailyCap)}
                onChange={(e) =>
                  updateGentleReminderSettings({ dailyCap: Number(e.target.value) })
                }
              >
                {[3, 5, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} parents
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <p className="plain-label mb-2">Channels</p>
            <div className="flex flex-wrap gap-2">
              {(["whatsapp", "sms", "push", "email"] as NotificationChannel[]).map((ch) => {
                const on = settings.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      const channels = on
                        ? settings.channels.filter((c) => c !== ch)
                        : [...settings.channels, ch];
                      updateGentleReminderSettings({
                        channels: channels.length ? channels : ["whatsapp"],
                      });
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${
                      on
                        ? "bg-[var(--ink)] text-white"
                        : "bg-[var(--ink-soft)] text-[var(--muted)]"
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[var(--bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Sample soft copy
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
              {previewTemplates.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const n = sendGentleRandomReminders();
                setBatchMsg(
                  n > 0
                    ? `Sent ${n} gentle random reminder${n === 1 ? "" : "s"} to parents.`
                    : "No unpaid fees available to remind right now.",
                );
              }}
            >
              <WandSparkles className="h-4 w-4" /> Send random gentle batch
            </Button>
            <Button
              variant="soft"
              onClick={() =>
                updateGentleReminderSettings({ enabled: !settings.enabled })
              }
            >
              {settings.enabled ? "Pause auto mode" : "Enable auto mode"}
            </Button>
          </div>
          {batchMsg ? (
            <p className="mt-3 rounded-xl bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]">
              {batchMsg}
            </p>
          ) : null}
          {settings.lastBatchAt ? (
            <p className="mt-2 text-xs text-[var(--muted-2)]">
              Last batch: {formatDateTime(settings.lastBatchAt)}
            </p>
          ) : null}
        </Surface>

        <Surface className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--teal-soft)] text-[var(--teal)]">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">AI-generated video calls</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                School AI avatar calls the parent, speaks a personalized fee script, then shares a
                payment link.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Field label="Call language">
              <Select
                value={lang}
                onChange={(e) => setLang(e.target.value as AICallLog["language"])}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Tamil</option>
              </Select>
            </Field>
          </div>

          <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto">
            {overdue.map((d) => {
              const student = getStudent(d.studentId);
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{student?.parentName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {student?.name} · {d.installmentName} ·{" "}
                      {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => startVideo(d.id)}>
                    <Sparkles className="h-3.5 w-3.5" /> Start AI video
                  </Button>
                </div>
              );
            })}
            {overdue.length === 0 ? (
              <p className="rounded-2xl bg-[var(--success-soft)] px-4 py-6 text-sm text-[var(--success)]">
                No overdue or partial dues — nothing to call about.
              </p>
            ) : null}
          </div>
        </Surface>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">Recent gentle messages</h2>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {gentleLogs.slice(0, 6).map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">{c.event}</Badge>
                  <Badge tone="info">{c.channel}</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{c.message}</p>
                <p className="mt-1 text-xs text-[var(--muted-2)]">{formatDateTime(c.sentAt)}</p>
              </div>
            ))}
            {gentleLogs.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--muted)]">
                No gentle reminders yet. Send a random batch to begin.
              </p>
            ) : null}
          </div>
        </Surface>

        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">AI call log</h2>
          </div>
          <div className="space-y-3 p-4">
            {state.aiCalls.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.parentName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {c.avatarName} · {c.language} · {c.callType}
                    </p>
                  </div>
                  <Badge
                    tone={
                      c.status === "completed"
                        ? "success"
                        : c.status === "ringing" || c.status === "in_progress"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{c.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.status === "queued" || c.status === "ringing") && c.callType === "video" ? (
                    <Button size="sm" variant="soft" onClick={() => setActiveCall(c)}>
                      Open video call
                    </Button>
                  ) : null}
                  {c.paymentLinkSent ? <Badge tone="info">Payment link sent</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {activeCall ? (
        <AIVideoCallModal
          call={activeCall}
          schoolName={state.school.name}
          onClose={() => setActiveCall(null)}
          onComplete={(paymentLinkSent) => {
            updateAICallStatus(activeCall.id, "completed", {
              paymentLinkSent,
              summary: paymentLinkSent
                ? "AI video message delivered. Payment link shared with parent."
                : "Call ended early by staff/parent.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
