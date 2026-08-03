"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Plus,
  Search,
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
import { formatDateTime } from "@/lib/format";
import type { SupportTicket, TicketStatus } from "@/lib/types";

const STATUS_META: Record<
  TicketStatus,
  { label: string; tone: "success" | "warning" | "neutral" | "info"; wash: string }
> = {
  open: {
    label: "Open",
    tone: "info",
    wash: "from-[rgba(36,91,255,0.12)] via-[rgba(36,91,255,0.04)] to-white",
  },
  in_progress: {
    label: "In progress",
    tone: "warning",
    wash: "from-[rgba(212,146,48,0.14)] via-[rgba(212,146,48,0.04)] to-white",
  },
  resolved: {
    label: "Resolved",
    tone: "success",
    wash: "from-[rgba(0,166,126,0.14)] via-[rgba(0,166,126,0.04)] to-white",
  },
  closed: {
    label: "Closed",
    tone: "neutral",
    wash: "from-[rgba(10,12,16,0.08)] via-[rgba(10,12,16,0.02)] to-white",
  },
};

const CATEGORY_LABEL: Record<SupportTicket["category"], string> = {
  payment: "Payment",
  receipt: "Receipt",
  scholarship: "Scholarship",
  general: "General",
};

const textareaClass =
  "min-h-[6.5rem] w-full rounded-2xl border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(0,166,126,0.15)]";

export default function AdminSupportPage() {
  const { state, updateTicketStatus, createTicket, getStudent } = useApp();
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | SupportTicket["category"]>("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.tickets[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: "",
    category: "payment" as SupportTicket["category"],
    studentId: "",
    description: "",
  });

  const counts = useMemo(() => {
    const base: Record<TicketStatus, number> = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    for (const t of state.tickets) base[t.status] += 1;
    return base;
  }, [state.tickets]);

  const activeStudents = useMemo(
    () => state.students.filter((s) => s.status === "active").slice(0, 120),
    [state.students],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...state.tickets]
      .filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
        if (!term) return true;
        const student = t.studentId ? getStudent(t.studentId) : undefined;
        return (
          t.subject.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          (student?.name ?? "").toLowerCase().includes(term) ||
          CATEGORY_LABEL[t.category].toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.tickets, statusFilter, categoryFilter, q, getStudent]);

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  function onCreate() {
    if (!form.subject.trim() || !form.description.trim()) {
      setBanner("Add a subject and description to open a ticket.");
      return;
    }
    createTicket({
      subject: form.subject.trim(),
      category: form.category,
      description: form.description.trim(),
      studentId: form.studentId || undefined,
    });
    setForm({ subject: "", category: "payment", studentId: "", description: "" });
    setShowCreate(false);
    setBanner("Ticket opened on the help desk.");
  }

  function setStatus(id: string, status: TicketStatus, label?: string) {
    updateTicketStatus(id, status);
    setBanner(label ?? `Ticket marked ${STATUS_META[status].label.toLowerCase()}.`);
  }

  const openCount = counts.open + counts.in_progress;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Help desk"
        description="Parent payment, receipt, and scholarship issues — triage, update status, and resolve."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setShowCreate(true);
                setSelectedId(null);
              }}
            >
              <Plus className="h-4 w-4" /> New ticket
            </Button>
            <Link href="/admin/communications">
              <Button variant="soft">
                Messages <ArrowRight className="h-4 w-4" />
              </Button>
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
        <Stat label="Open queue" value={String(openCount)} tone="accent" />
        <Stat label="Open" value={String(counts.open)} />
        <Stat label="In progress" value={String(counts.in_progress)} hint="Being handled" />
        <Stat
          label="Resolved"
          value={String(counts.resolved + counts.closed)}
          tone="success"
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(
          [
            ["all", "All tickets", state.tickets.length, "from-[rgba(0,166,126,0.1)] to-white"],
            ...(["open", "in_progress", "resolved", "closed"] as TicketStatus[]).map((s) => [
              s,
              STATUS_META[s].label,
              counts[s],
              STATUS_META[s].wash,
            ]),
          ] as Array<[string, string, number, string]>
        ).map(([key, label, count, wash]) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key as typeof statusFilter)}
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
        <Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-bold">Ticket queue</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  className="pl-9"
                  placeholder="Search subject, student…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select
                className="w-full sm:w-40"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as typeof categoryFilter)
                }
              >
                <option value="all">All categories</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
                <option value="scholarship">Scholarship</option>
                <option value="general">General</option>
              </Select>
            </div>
          </div>

          <div className="max-h-[34rem] space-y-2 overflow-y-auto p-3 sm:p-4">
            {filtered.length === 0 ? (
              <EmptyState title="No tickets" description="Try another status or search." />
            ) : (
              filtered.map((t) => {
                const student = t.studentId ? getStudent(t.studentId) : undefined;
                const active = !showCreate && (selected?.id ?? selectedId) === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setSelectedId(t.id);
                    }}
                    className={`w-full rounded-[1.2rem] border p-3.5 text-left transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={STATUS_META[t.status].tone}>
                            {STATUS_META[t.status].label}
                          </Badge>
                          <Badge tone="info">{CATEGORY_LABEL[t.category]}</Badge>
                        </div>
                        <p className="mt-2 truncate text-sm font-bold">{t.subject}</p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {student?.name ?? "No student linked"} ·{" "}
                          {formatDateTime(t.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                      {t.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          {showCreate ? (
            <>
              <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.12),rgba(36,91,255,0.08))] px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Help desk
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                  New ticket
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Log a parent issue for support agents and school staff.
                </p>
              </div>
              <div className="space-y-4 p-5">
                <Field label="Subject">
                  <Input
                    placeholder="Short summary of the issue"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category">
                    <Select
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          category: e.target.value as SupportTicket["category"],
                        }))
                      }
                    >
                      <option value="payment">Payment</option>
                      <option value="receipt">Receipt</option>
                      <option value="scholarship">Scholarship</option>
                      <option value="general">General</option>
                    </Select>
                  </Field>
                  <Field label="Student (optional)">
                    <Select
                      value={form.studentId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, studentId: e.target.value }))
                      }
                    >
                      <option value="">No student linked</option>
                      {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.className}-{s.section}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea
                    className={textareaClass}
                    placeholder="What happened? Include payment/receipt details if relevant."
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={onCreate}>
                    <Plus className="h-4 w-4" /> Open ticket
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : !selected ? (
            <EmptyState
              title="Select a ticket"
              description="Pick a ticket from the queue to update status or resolve."
            />
          ) : (
            <>
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${STATUS_META[selected.status].wash} px-5 py-5`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_META[selected.status].tone}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                  <Badge tone="info">{CATEGORY_LABEL[selected.category]}</Badge>
                </div>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                  {selected.subject}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Updated {formatDateTime(selected.updatedAt)} · Created{" "}
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Student</p>
                    <p className="mt-1 font-semibold">
                      {selected.studentId
                        ? getStudent(selected.studentId)?.name ?? "—"
                        : "Not linked"}
                    </p>
                    {selected.studentId ? (
                      <p className="text-xs text-[var(--muted)]">
                        {getStudent(selected.studentId)?.className}-
                        {getStudent(selected.studentId)?.section} ·{" "}
                        {getStudent(selected.studentId)?.admissionNo}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--muted)]">Category</p>
                    <p className="mt-1 font-semibold">
                      {CATEGORY_LABEL[selected.category]}
                    </p>
                    <p className="text-xs text-[var(--muted)]">Ticket {selected.id}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Description
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                    {selected.description}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="mb-3 text-sm font-bold">Update status</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Select
                      className="sm:flex-1"
                      value={selected.status}
                      onChange={(e) =>
                        setStatus(selected.id, e.target.value as TicketStatus)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                    {selected.status !== "resolved" && selected.status !== "closed" ? (
                      <Button
                        type="button"
                        onClick={() =>
                          setStatus(selected.id, "resolved", "Ticket resolved.")
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" /> Resolve
                      </Button>
                    ) : null}
                  </div>
                </div>

                {selected.studentId ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/students/${selected.studentId}`}>
                      <Button size="sm" variant="soft">
                        Student profile
                      </Button>
                    </Link>
                    {selected.category === "receipt" ? (
                      <Link href="/admin/receipts">
                        <Button size="sm" variant="ghost">
                          Receipts
                        </Button>
                      </Link>
                    ) : null}
                    {selected.category === "payment" ? (
                      <Link href="/admin/payments">
                        <Button size="sm" variant="ghost">
                          Payments
                        </Button>
                      </Link>
                    ) : null}
                    {selected.category === "scholarship" ? (
                      <Link href="/admin/scholarships">
                        <Button size="sm" variant="ghost">
                          Scholarships
                        </Button>
                      </Link>
                    ) : null}
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
