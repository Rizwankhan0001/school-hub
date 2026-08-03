"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Mail,
  MessageSquare,
  Search,
  Send,
  Smartphone,
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
import { useApp } from "@/lib/store";
import { formatDateTime, formatINR, outstanding } from "@/lib/format";
import type { NotificationChannel } from "@/lib/types";

const CHANNEL_META: Record<
  NotificationChannel,
  { label: string; tone: "info" | "neutral" | "success" | "accent"; wash: string; icon: typeof Mail }
> = {
  whatsapp: {
    label: "WhatsApp",
    tone: "success",
    wash: "from-[rgba(0,166,126,0.14)] via-[rgba(0,166,126,0.04)] to-white",
    icon: MessageSquare,
  },
  sms: {
    label: "SMS",
    tone: "info",
    wash: "from-[rgba(36,91,255,0.12)] via-[rgba(36,91,255,0.04)] to-white",
    icon: Smartphone,
  },
  email: {
    label: "Email",
    tone: "neutral",
    wash: "from-[rgba(10,12,16,0.08)] via-[rgba(10,12,16,0.02)] to-white",
    icon: Mail,
  },
  push: {
    label: "Push",
    tone: "accent",
    wash: "from-[rgba(212,146,48,0.14)] via-[rgba(212,146,48,0.04)] to-white",
    icon: Bell,
  },
};

function statusTone(status: string): "success" | "warning" | "danger" {
  if (status === "sent") return "success";
  if (status === "queued") return "warning";
  return "danger";
}

export default function CommunicationsPage() {
  const { state, getStudent, sendReminder, getOpenDues } = useApp();
  const [channel, setChannel] = useState<"all" | NotificationChannel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "queued" | "failed">("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.communications[0]?.id ?? null);
  const [composeDueId, setComposeDueId] = useState("");
  const [composeChannel, setComposeChannel] = useState<NotificationChannel>("whatsapp");
  const [banner, setBanner] = useState<string | null>(null);

  const openDues = getOpenDues();

  const counts = useMemo(() => {
    const byChannel: Record<NotificationChannel, number> = {
      whatsapp: 0,
      sms: 0,
      email: 0,
      push: 0,
    };
    let sent = 0;
    let queued = 0;
    let failed = 0;
    for (const c of state.communications) {
      byChannel[c.channel] += 1;
      if (c.status === "sent") sent += 1;
      else if (c.status === "queued") queued += 1;
      else failed += 1;
    }
    return { byChannel, sent, queued, failed, total: state.communications.length };
  }, [state.communications]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...state.communications]
      .filter((c) => {
        if (channel !== "all" && c.channel !== channel) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (!term) return true;
        const student = c.studentId ? getStudent(c.studentId) : undefined;
        return (
          c.message.toLowerCase().includes(term) ||
          c.event.toLowerCase().includes(term) ||
          c.recipient.toLowerCase().includes(term) ||
          (student?.name ?? "").toLowerCase().includes(term) ||
          (student?.admissionNo ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }, [state.communications, channel, statusFilter, q, getStudent]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  function sendCompose() {
    if (!composeDueId) {
      setBanner("Pick a student due to remind.");
      return;
    }
    const due = openDues.find((d) => d.id === composeDueId);
    const student = due ? getStudent(due.studentId) : undefined;
    sendReminder(composeDueId, composeChannel);
    setBanner(
      `Reminder sent via ${CHANNEL_META[composeChannel].label}${
        student ? ` for ${student.name}` : ""
      }.`,
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Messages"
        description="SMS, email, WhatsApp, and push logs — filter the inbox and send fee reminders in one place."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dues">
              <Button variant="soft">
                Who owes <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/ai-collection">
              <Button variant="ghost">AI nudges</Button>
            </Link>
          </div>
        }
      />

      {banner ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{banner}</p>
          <button type="button" onClick={() => setBanner(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Messages logged" value={String(counts.total)} tone="accent" />
        <Stat label="Sent" value={String(counts.sent)} tone="success" />
        <Stat label="Queued" value={String(counts.queued)} hint={`${counts.failed} failed`} />
        <Stat
          label="Open dues to remind"
          value={String(openDues.length)}
          tone="danger"
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(
          [
            ["all", "All channels", counts.total, "from-[rgba(0,166,126,0.1)] to-white"],
            ...(["whatsapp", "sms", "email", "push"] as NotificationChannel[]).map((ch) => [
              ch,
              CHANNEL_META[ch].label,
              counts.byChannel[ch],
              CHANNEL_META[ch].wash,
            ]),
          ] as Array<[string, string, number, string]>
        ).map(([key, label, count, wash]) => {
          const active = channel === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setChannel(key as typeof channel)}
              className={`rounded-[1.25rem] border bg-gradient-to-br p-4 text-left transition ${wash} ${
                active
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                  : "border-[var(--line)] hover:border-[var(--line-strong)]"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
        <div className="space-y-6">
          <Surface className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-bold">Inbox</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <Input
                    className="pl-9"
                    placeholder="Search student, event, message…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Select
                  className="w-full sm:w-36"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as typeof statusFilter)
                  }
                >
                  <option value="all">All status</option>
                  <option value="sent">Sent</option>
                  <option value="queued">Queued</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </div>

            <div className="max-h-[28rem] space-y-2 overflow-y-auto p-3 sm:p-4">
              {filtered.length === 0 ? (
                <EmptyState title="No messages" description="Try another channel or search." />
              ) : (
                filtered.map((c) => {
                  const student = c.studentId ? getStudent(c.studentId) : undefined;
                  const active = (selected?.id ?? selectedId) === c.id;
                  const Icon = CHANNEL_META[c.channel].icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-[1.2rem] border p-3.5 text-left transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                          : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={CHANNEL_META[c.channel].tone}>
                              {CHANNEL_META[c.channel].label}
                            </Badge>
                            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                          </div>
                          <p className="mt-2 truncate text-sm font-bold">{c.event}</p>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {student?.name ?? c.recipient} · {formatDateTime(c.sentAt)}
                          </p>
                        </div>
                        <Icon className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{c.message}</p>
                    </button>
                  );
                })
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Send className="h-4 w-4" />
              </span>
              <div>
                <p className="font-bold">Compose reminder</p>
                <p className="text-sm text-[var(--muted)]">
                  Send a fee reminder for any open due.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="Open due">
                <Select
                  value={composeDueId}
                  onChange={(e) => setComposeDueId(e.target.value)}
                >
                  <option value="">Select student due…</option>
                  {openDues.slice(0, 80).map((d) => {
                    const s = getStudent(d.studentId);
                    return (
                      <option key={d.id} value={d.id}>
                        {s?.name ?? "Student"} · {d.installmentName} ·{" "}
                        {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                      </option>
                    );
                  })}
                </Select>
              </Field>
              <Field label="Channel">
                <Select
                  value={composeChannel}
                  onChange={(e) =>
                    setComposeChannel(e.target.value as NotificationChannel)
                  }
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                </Select>
              </Field>
              <Button type="button" onClick={sendCompose}>
                <Send className="h-4 w-4" /> Send reminder
              </Button>
            </div>
          </Surface>
        </div>

        <Surface className="overflow-hidden p-0">
          {!selected ? (
            <EmptyState
              title="Select a message"
              description="Pick a log entry to read the full copy and delivery details."
            />
          ) : (
            <>
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${CHANNEL_META[selected.channel].wash} px-5 py-5`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={CHANNEL_META[selected.channel].tone}>
                    {CHANNEL_META[selected.channel].label}
                  </Badge>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                  {selected.event}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatDateTime(selected.sentAt)}
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Recipient</p>
                    <p className="mt-1 font-semibold break-all">{selected.recipient}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Student</p>
                    <p className="mt-1 font-semibold">
                      {selected.studentId
                        ? getStudent(selected.studentId)?.name ?? "—"
                        : "—"}
                    </p>
                    {selected.studentId ? (
                      <p className="text-xs text-[var(--muted)]">
                        {getStudent(selected.studentId)?.className}-
                        {getStudent(selected.studentId)?.section}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Message body
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                    {selected.message}
                  </p>
                </div>

                {selected.studentId ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/students/${selected.studentId}`}>
                      <Button size="sm" variant="soft">
                        Student profile
                      </Button>
                    </Link>
                    <Link href="/admin/dues">
                      <Button size="sm" variant="ghost">
                        Who owes
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </Surface>
      </div>
    </div>
  );
}
