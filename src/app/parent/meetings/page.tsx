"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Video,
  Phone,
} from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/format";
import type { MeetingMode, MeetingTopic } from "@/lib/types";

const TOPICS: MeetingTopic[] = [
  "Academics",
  "Behaviour",
  "Special education",
  "Career guidance",
  "Exam prep",
  "Other",
];

const MODES: { value: MeetingMode; label: string }[] = [
  { value: "in_person", label: "In person at school" },
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone call" },
];

function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function slotDateKey(iso: string) {
  return iso.slice(0, 10);
}

function modeIcon(mode: MeetingMode) {
  if (mode === "video") return Video;
  if (mode === "phone") return Phone;
  return MapPin;
}

export default function ParentMeetingsPage() {
  const {
    user,
    state,
    getParentStudents,
    bookTeacherMeeting,
    cancelTeacherMeeting,
  } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const [teacherId, setTeacherId] = useState(state.teachers[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [topic, setTopic] = useState<MeetingTopic>("Academics");
  const [mode, setMode] = useState<MeetingMode>("in_person");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teacher = state.teachers.find((t) => t.id === teacherId);

  const openSlots = useMemo(
    () =>
      state.teacherSlots
        .filter((s) => s.teacherId === teacherId && s.status === "open")
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [state.teacherSlots, teacherId],
  );

  const dates = useMemo(() => {
    const keys = Array.from(new Set(openSlots.map((s) => slotDateKey(s.startAt))));
    return keys;
  }, [openSlots]);

  const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] ?? "";

  const daySlots = useMemo(
    () => openSlots.filter((s) => slotDateKey(s.startAt) === activeDate),
    [openSlots, activeDate],
  );

  const myMeetings = useMemo(
    () =>
      state.teacherMeetings
        .filter((m) => m.parentId === user?.parentId && m.status === "booked")
        .sort((a, b) => {
          const sa = state.teacherSlots.find((s) => s.id === a.slotId)?.startAt ?? "";
          const sb = state.teacherSlots.find((s) => s.id === b.slotId)?.startAt ?? "";
          return sa.localeCompare(sb);
        }),
    [state.teacherMeetings, state.teacherSlots, user?.parentId],
  );

  function onBook() {
    setError(null);
    setMessage(null);
    if (!slotId) {
      setError("Pick a 20-minute time slot first.");
      return;
    }
    const result = bookTeacherMeeting({
      slotId,
      studentId,
      topic,
      mode,
      notes,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Meeting booked with ${teacher?.name}. Confirmation sent to your email.`);
    setSlotId("");
    setNotes("");
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Meet a teacher"
        description="See who is free and book a 20-minute slot for academics, special support, or anything else about your child."
      />

      {myMeetings.length > 0 ? (
        <Surface className="mb-6 p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Your upcoming meetings</h2>
          <div className="mt-4 space-y-3">
            {myMeetings.map((m) => {
              const t = state.teachers.find((x) => x.id === m.teacherId);
              const slot = state.teacherSlots.find((s) => s.id === m.slotId);
              const student = students.find((s) => s.id === m.studentId);
              const ModeIcon = modeIcon(m.mode);
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{t?.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {student?.name} · {m.topic}
                      {slot
                        ? ` · ${formatDate(slot.startAt)} · ${formatSlotTime(slot.startAt)}–${formatSlotTime(slot.endAt)}`
                        : ""}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                      <ModeIcon className="h-3.5 w-3.5" />
                      {MODES.find((x) => x.value === m.mode)?.label}
                      {t ? ` · ${t.room}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="soft" onClick={() => cancelTeacherMeeting(m.id)}>
                    Cancel
                  </Button>
                </div>
              );
            })}
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--ink-2)]">1. Choose a teacher</p>
          <div className="space-y-3">
            {state.teachers.map((t) => {
              const openCount = state.teacherSlots.filter(
                (s) => s.teacherId === t.id && s.status === "open",
              ).length;
              const active = t.id === teacherId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTeacherId(t.id);
                    setSelectedDate("");
                    setSlotId("");
                    setError(null);
                  }}
                  className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-white shadow-[0_16px_32px_-24px_rgba(10,12,16,0.35)]"
                      : "border-[var(--line)] bg-white/70 hover:border-[var(--line-strong)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white ${
                        active ? "bg-[var(--accent)]" : "bg-[var(--ink)]"
                      }`}
                    >
                      {t.avatarInitials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold tracking-[-0.02em]">{t.name}</span>
                        <Badge tone={openCount > 0 ? "success" : "neutral"}>
                          {openCount} open slots
                        </Badge>
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        {t.subject} · {t.specialty}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-[var(--ink-2)]">
                        {t.bio}
                      </span>
                      <span className="mt-2 block text-xs text-[var(--muted-2)]">
                        Helps {t.classes.join(", ")} · {t.room}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Surface className="p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-semibold tracking-[-0.01em]">
              2. Pick a 20-minute slot
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {teacher
              ? `Availability for ${teacher.name} over the next two weeks.`
              : "Select a teacher to see open times."}
          </p>

          {dates.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-[var(--surface-muted)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              No open slots for this teacher right now. Try another teacher.
            </p>
          ) : (
            <>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {dates.map((d) => {
                  const count = openSlots.filter((s) => slotDateKey(s.startAt) === d).length;
                  const active = d === activeDate;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d);
                        setSlotId("");
                      }}
                      className={`shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                        active
                          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                          : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{formatDate(d)}</span>
                      <span
                        className={`mt-0.5 block text-[0.7rem] ${active ? "text-white/65" : "text-[var(--muted)]"}`}
                      >
                        {count} free
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {daySlots.map((s) => {
                  const active = s.id === slotId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-hover)]"
                          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatSlotTime(s.startAt)}
                      </span>
                      <span className="mt-1 block text-[0.68rem] font-medium opacity-70">
                        20 min
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
            <p className="text-sm font-semibold text-[var(--ink-2)]">3. Confirm booking</p>
            <Field label="Child">
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.className}-{s.section}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="What is this about?">
              <Select value={topic} onChange={(e) => setTopic(e.target.value as MeetingTopic)}>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="How do you want to meet?">
              <Select value={mode} onChange={(e) => setMode(e.target.value as MeetingMode)}>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note for the teacher" hint="Optional">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Struggling with fractions / need IEP discussion"
              />
            </Field>

            {slotId ? (
              <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-hover)]">
                Selected: {formatDateTime(daySlots.find((s) => s.id === slotId)?.startAt ?? "")} · 20
                minutes
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="flex items-start gap-2 rounded-xl bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </p>
            ) : null}

            <Button className="w-full" size="lg" onClick={onBook} disabled={!slotId || !studentId}>
              Book 20-minute meeting
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
