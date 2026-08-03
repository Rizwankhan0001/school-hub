"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  DoorOpen,
  HeartHandshake,
  Search,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { AIVideoCallModal } from "@/components/ai-video-call-modal";
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR, outstanding } from "@/lib/format";
import type { AICallLog, NotificationChannel } from "@/lib/types";

type Mode = "hub" | "gentle" | "video";

const GENTLE_EVENTS = [
  "Gentle Reminder",
  "Friendly Nudge",
  "Kind Follow-up",
  "Soft Due Note",
  "Courteous Ping",
];

const PREVIEW: Record<string, string[]> = {
  very_gentle: [
    "Hi Parent — a soft note from school when you’re free…",
    "No rush at all — just a kind reminder about fees…",
    "Warm wishes — pay whenever convenient for your family.",
  ],
  gentle: [
    "Just a gentle reminder when convenient…",
    "Friendly follow-up on the open fee installment…",
    "A soft nudge from school — thank you for your support.",
  ],
  firm_polite: [
    "Polite follow-up: fee installment is still open…",
    "Kindly clear the pending fee when possible this week…",
    "Courteous reminder — school accounts need an update.",
  ],
};

function callTone(
  status: AICallLog["status"],
): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "completed") return "success";
  if (status === "ringing" || status === "in_progress" || status === "queued") return "warning";
  if (status === "failed" || status === "no_answer") return "danger";
  return "neutral";
}

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

  const [mode, setMode] = useState<Mode>("hub");
  const [batchMsg, setBatchMsg] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<AICallLog | null>(null);
  const [lang, setLang] = useState<AICallLog["language"]>("English");
  const [dueQ, setDueQ] = useState("");
  const [callFilter, setCallFilter] = useState<"all" | AICallLog["status"]>("all");

  const overdue = useMemo(
    () => state.dues.filter((d) => d.status === "overdue" || d.status === "partial"),
    [state.dues],
  );
  const videoCalls = state.aiCalls.filter((c) => c.callType === "video");
  const gentleLogs = state.communications.filter((c) => GENTLE_EVENTS.includes(c.event));
  const settings = state.gentleReminders;

  const filteredDues = useMemo(() => {
    const term = dueQ.trim().toLowerCase();
    return overdue
      .map((d) => ({ due: d, student: getStudent(d.studentId) }))
      .filter(({ due, student }) => {
        if (!term) return true;
        return (
          (student?.name ?? "").toLowerCase().includes(term) ||
          (student?.parentName ?? "").toLowerCase().includes(term) ||
          due.installmentName.toLowerCase().includes(term) ||
          (student?.className ?? "").toLowerCase().includes(term)
        );
      })
      .sort(
        (a, b) =>
          outstanding(b.due.amount, b.due.fine, b.due.paidAmount) -
          outstanding(a.due.amount, a.due.fine, a.due.paidAmount),
      );
  }, [overdue, dueQ, getStudent]);

  const filteredCalls = useMemo(() => {
    return [...state.aiCalls]
      .filter((c) => callFilter === "all" || c.status === callFilter)
      .sort((a, b) => b.calledAt.localeCompare(a.calledAt));
  }, [state.aiCalls, callFilter]);

  const startVideo = (dueId: string) => {
    const call = queueAICall(dueId, lang, "video");
    if (call) setActiveCall(call);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="AI video & nudges"
        description="Send soft random reminders, then follow up with friendly AI video calls that share a payment link."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/communications">
              <Button variant="soft">
                Messages <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/dues">
              <Button variant="ghost">Who owes</Button>
            </Link>
          </div>
        }
      />

      {batchMsg ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{batchMsg}</p>
          <button type="button" onClick={() => setBatchMsg(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Still unpaid" value={formatINR(metrics.totalDue)} />
        <Stat label="Gentle messages" value={String(gentleLogs.length)} tone="success" />
        <Stat label="AI video calls" value={String(videoCalls.length)} tone="accent" />
        <Stat
          label="Reminder mode"
          value={settings.enabled ? "On" : "Off"}
          hint={`Daily cap ${settings.dailyCap}`}
        />
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),rgba(36,91,255,0.05))] px-4 py-3.5 sm:px-5">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          {mode === "hub" ? (
            <p className="text-sm font-bold">Collection studio</p>
          ) : (
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setMode("hub")}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Collection studio
              </button>
              <span>/</span>
              <span className="font-semibold text-[var(--ink)]">
                {mode === "gentle" ? "Gentle nudges" : "AI video calls"}
              </span>
            </nav>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "hub" ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-5"
            >
              <div className="mb-4">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                  Choose how to reach parents
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Soft text first — AI video when you need a warmer follow-up.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-gradient-to-br from-[rgba(0,166,126,0.16)] via-[rgba(0,166,126,0.05)] to-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[var(--accent)] shadow-sm">
                      <HeartHandshake className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        Gentle nudges
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Random kind messages to unpaid parents — never harsh, always school-branded.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone={settings.enabled ? "success" : "neutral"}>
                      Auto {settings.enabled ? "on" : "off"}
                    </Badge>
                    <Badge tone="info">Cap {settings.dailyCap}/batch</Badge>
                    <Badge tone="accent">{gentleLogs.length} sent</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("gentle")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                  >
                    <DoorOpen className="h-4 w-4" /> Open gentle studio
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-gradient-to-br from-[rgba(36,91,255,0.14)] via-[rgba(36,91,255,0.04)] to-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[var(--accent-2)] shadow-sm">
                      <Video className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                        AI video calls
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        School AI avatar speaks a personalized fee script, then shares the pay link.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="accent">{videoCalls.length} videos</Badge>
                    <Badge tone="warning">
                      {state.aiCalls.filter((c) =>
                        ["queued", "ringing", "in_progress"].includes(c.status),
                      ).length}{" "}
                      live/queued
                    </Badge>
                    <Badge tone="info">{overdue.length} candidates</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("video")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                  >
                    <DoorOpen className="h-4 w-4" /> Open video studio
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="text-sm font-bold">Recent gentle messages</p>
                  <div className="mt-3 space-y-2">
                    {gentleLogs.slice(0, 3).map((c) => (
                      <div key={c.id} className="rounded-xl bg-white px-3 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="success">{c.event}</Badge>
                          <Badge tone="info">{c.channel}</Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs text-[var(--muted)]">
                          {c.message}
                        </p>
                      </div>
                    ))}
                    {gentleLogs.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No gentle reminders yet.</p>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="text-sm font-bold">Recent AI calls</p>
                  <div className="mt-3 space-y-2">
                    {state.aiCalls.slice(0, 3).map((c) => (
                      <div key={c.id} className="rounded-xl bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{c.parentName}</p>
                          <Badge tone={callTone(c.status)}>{c.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                          {c.summary}
                        </p>
                      </div>
                    ))}
                    {state.aiCalls.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No AI calls yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : mode === "gentle" ? (
            <motion.div
              key="gentle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-b border-[var(--line)] bg-gradient-to-br from-[rgba(0,166,126,0.14)] via-[rgba(0,166,126,0.04)] to-white px-4 py-5 sm:px-6">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setMode("hub")}
                    className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      Gentle nudges
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                      Pick tone and channels, then send a random soft batch to unpaid parents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                          updateGentleReminderSettings({
                            dailyCap: Number(e.target.value),
                          })
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

                  <div>
                    <p className="plain-label mb-2">Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {(["whatsapp", "sms", "push", "email"] as NotificationChannel[]).map(
                        (ch) => {
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
                        },
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Sample soft copy
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
                      {(PREVIEW[settings.tone] ?? PREVIEW.gentle).map((t) => (
                        <li key={t}>• {t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                  {settings.lastBatchAt ? (
                    <p className="text-xs text-[var(--muted-2)]">
                      Last batch: {formatDateTime(settings.lastBatchAt)}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[1.25rem] border border-[var(--line)] overflow-hidden">
                  <div className="border-b border-[var(--line)] px-4 py-3">
                    <p className="text-sm font-bold">Recent gentle messages</p>
                  </div>
                  <div className="max-h-[26rem] divide-y divide-[var(--line)] overflow-y-auto">
                    {gentleLogs.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-[var(--muted)]">
                        No gentle reminders yet. Send a random batch to begin.
                      </p>
                    ) : (
                      gentleLogs.slice(0, 12).map((c) => (
                        <div key={c.id} className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="success">{c.event}</Badge>
                            <Badge tone="info">{c.channel}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted)]">{c.message}</p>
                          <p className="mt-1 text-xs text-[var(--muted-2)]">
                            {formatDateTime(c.sentAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-b border-[var(--line)] bg-gradient-to-br from-[rgba(36,91,255,0.12)] via-[rgba(36,91,255,0.04)] to-white px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setMode("hub")}
                      className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                        AI video calls
                      </p>
                      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                        Start a personalized video for overdue or partial dues, then open the live call.
                      </p>
                    </div>
                  </div>
                  <Field label="Call language">
                    <Select
                      className="w-full sm:w-44"
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
              </div>

              <div className="grid gap-6 p-4 sm:p-5 xl:grid-cols-2">
                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
                  <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3 sm:flex-row sm:items-center">
                    <p className="flex-1 text-sm font-bold">Call candidates</p>
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <Input
                        className="pl-9"
                        placeholder="Search parent, student, class…"
                        value={dueQ}
                        onChange={(e) => setDueQ(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[28rem] space-y-2 overflow-y-auto p-3">
                    {filteredDues.length === 0 ? (
                      <EmptyState
                        title="No candidates"
                        description="No overdue or partial dues match this search."
                      />
                    ) : (
                      filteredDues.map(({ due, student }) => (
                        <div
                          key={due.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">{student?.parentName}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {student?.name} · {student?.className}-{student?.section} ·{" "}
                              {due.installmentName} ·{" "}
                              {formatINR(outstanding(due.amount, due.fine, due.paidAmount))}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => startVideo(due.id)}>
                            <Sparkles className="h-3.5 w-3.5" /> Start AI video
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
                  <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3 sm:flex-row sm:items-center">
                    <p className="flex-1 text-sm font-bold">AI call log</p>
                    <Select
                      className="w-full sm:w-40"
                      value={callFilter}
                      onChange={(e) =>
                        setCallFilter(e.target.value as typeof callFilter)
                      }
                    >
                      <option value="all">All status</option>
                      <option value="queued">Queued</option>
                      <option value="ringing">Ringing</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="no_answer">No answer</option>
                      <option value="failed">Failed</option>
                    </Select>
                  </div>
                  <div className="max-h-[28rem] space-y-3 overflow-y-auto p-3">
                    {filteredCalls.length === 0 ? (
                      <EmptyState title="No calls" description="Start a video from the candidates list." />
                    ) : (
                      filteredCalls.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-[var(--line)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{c.parentName}</p>
                              <p className="text-xs text-[var(--muted)]">
                                {c.avatarName} · {c.language} · {c.callType} ·{" "}
                                {formatINR(c.amount)}
                              </p>
                            </div>
                            <Badge tone={callTone(c.status)}>{c.status}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted)]">{c.summary}</p>
                          <p className="mt-1 text-xs text-[var(--muted-2)]">
                            {formatDateTime(c.calledAt)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(c.status === "queued" || c.status === "ringing") &&
                            c.callType === "video" ? (
                              <Button size="sm" variant="soft" onClick={() => setActiveCall(c)}>
                                Open video call
                              </Button>
                            ) : null}
                            {c.paymentLinkSent ? (
                              <Badge tone="info">Payment link sent</Badge>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                ? "AI video message delivered. Payment link shared with parent."
                : "Call ended early by staff/parent.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
