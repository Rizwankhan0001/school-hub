"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Video,
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
import { MeetingEngageModal } from "@/components/meeting-engage-modal";
import { useApp } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/format";
import type { MeetingMode, MeetingTopic, Teacher } from "@/lib/types";

const TOPICS: MeetingTopic[] = [
  "Academics",
  "Behaviour",
  "Special education",
  "Career guidance",
  "Exam prep",
  "Other",
];

const MODES: {
  value: MeetingMode;
  label: string;
  hint: string;
  icon: typeof Video;
}[] = [
  {
    value: "video",
    label: "Video call",
    hint: "Meet face-to-face inside EduFee360",
    icon: Video,
  },
  {
    value: "phone",
    label: "Voice call",
    hint: "Talk in-app — no phone dialler needed",
    icon: Phone,
  },
  {
    value: "chat",
    label: "Chat",
    hint: "Message the teacher in a secure thread",
    icon: MessageCircle,
  },
  {
    value: "in_person",
    label: "At school",
    hint: "Visit campus for an in-person meeting",
    icon: MapPin,
  },
];

type EngageMode = "video" | "phone" | "chat";

function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function slotDateKey(iso: string) {
  return iso.slice(0, 10);
}

function teacherTeachesClass(teacher: Teacher, className: string) {
  if (teacher.classes?.includes(className)) return true;
  return teacher.classAssignments?.some((a) => a.className === className) ?? false;
}

function subjectsForClass(teacher: Teacher, className: string) {
  const subjects = teacher.classAssignments
    .filter((a) => a.className === className)
    .map((a) => (a.section ? `${a.subject} (Sec ${a.section})` : a.subject));
  if (subjects.length) return Array.from(new Set(subjects));
  return teacher.subject ? [teacher.subject] : [];
}

export default function ParentMeetingsPage() {
  const {
    user,
    state,
    getParentStudents,
    bookTeacherMeeting,
    cancelTeacherMeeting,
    sendMeetingChat,
    startMeetingSession,
    endMeetingSession,
  } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [topic, setTopic] = useState<MeetingTopic>("Academics");
  const [mode, setMode] = useState<MeetingMode>("video");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engage, setEngage] = useState<{
    meetingId: string;
    mode: EngageMode;
  } | null>(null);

  const selectedStudent = students.find((s) => s.id === studentId) ?? students[0];
  const childClass = selectedStudent?.className ?? "";

  const relevantTeachers = childClass
    ? state.teachers.filter((t) => teacherTeachesClass(t, childClass))
    : [];
  const activeTeacherId = relevantTeachers.some((t) => t.id === teacherId)
    ? teacherId
    : relevantTeachers[0]?.id ?? "";
  const teacher = relevantTeachers.find((t) => t.id === activeTeacherId);

  const openSlots = state.teacherSlots
    .filter((s) => s.teacherId === activeTeacherId && s.status === "open")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const dates = Array.from(new Set(openSlots.map((s) => slotDateKey(s.startAt))));
  const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] ?? "";
  const daySlots = openSlots.filter((s) => slotDateKey(s.startAt) === activeDate);

  const myMeetings = state.teacherMeetings
    .filter((m) => m.parentId === user?.parentId && m.status === "booked")
    .sort((a, b) => {
      const sa = state.teacherSlots.find((s) => s.id === a.slotId)?.startAt ?? "";
      const sb = state.teacherSlots.find((s) => s.id === b.slotId)?.startAt ?? "";
      return sa.localeCompare(sb);
    });

  const engageMeeting = engage
    ? state.teacherMeetings.find((m) => m.id === engage.meetingId)
    : null;
  const engageTeacher = engageMeeting
    ? state.teachers.find((t) => t.id === engageMeeting.teacherId)
    : null;
  const engageStudent = engageMeeting
    ? students.find((s) => s.id === engageMeeting.studentId)
    : null;
  const engageMessages = engage
    ? (state.meetingChats ?? []).filter((c) => c.meetingId === engage.meetingId)
    : [];

  function onBook() {
    setError(null);
    setMessage(null);
    if (!slotId) {
      setError("Pick a 20-minute time slot first.");
      return;
    }
    if (!studentId) {
      setError("Choose which child this meeting is for.");
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
    const modeLabel = MODES.find((m) => m.value === mode)?.label ?? mode;
    setMessage(
      `Meeting booked with ${teacher?.name} via ${modeLabel}. Join from Your upcoming meetings — stay inside EduFee360.`,
    );
    setSlotId("");
    setNotes("");

    if (mode === "video" || mode === "phone" || mode === "chat") {
      // Offer immediate join for demo convenience
      setEngage({ meetingId: result.meeting.id, mode });
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Meet a teacher"
        description="Book video, voice, or chat meetings for your child’s class — all inside EduFee360, no WhatsApp or Zoom needed."
      />

      {myMeetings.length > 0 ? (
        <Surface className="mb-6 p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Your upcoming meetings</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Join video, voice, or chat right here on the platform.
          </p>
          <div className="mt-4 space-y-3">
            {myMeetings.map((m) => {
              const t = state.teachers.find((x) => x.id === m.teacherId);
              const slot = state.teacherSlots.find((s) => s.id === m.slotId);
              const student = students.find((s) => s.id === m.studentId);
              const modeMeta = MODES.find((x) => x.value === m.mode);
              const ModeIcon = modeMeta?.icon ?? MapPin;
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3.5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{t?.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {student?.name}
                        {student ? ` · ${student.className}-${student.section}` : ""} · {m.topic}
                        {slot
                          ? ` · ${formatDate(slot.startAt)} · ${formatSlotTime(slot.startAt)}–${formatSlotTime(slot.endAt)}`
                          : ""}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                        <ModeIcon className="h-3.5 w-3.5" />
                        {modeMeta?.label}
                        {t ? ` · ${t.room}` : ""}
                        {m.sessionStatus === "active" ? " · in progress" : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancelTeacherMeeting(m.id)}>
                      Cancel
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(m.mode === "video" || m.mode === "in_person") && (
                      <Button
                        size="sm"
                        onClick={() => setEngage({ meetingId: m.id, mode: "video" })}
                      >
                        <Video className="h-3.5 w-3.5" /> Join video
                      </Button>
                    )}
                    {(m.mode === "phone" || m.mode === "in_person") && (
                      <Button
                        size="sm"
                        variant={m.mode === "phone" ? "primary" : "soft"}
                        onClick={() => setEngage({ meetingId: m.id, mode: "phone" })}
                      >
                        <Phone className="h-3.5 w-3.5" /> Voice call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={m.mode === "chat" ? "primary" : "soft"}
                      onClick={() => setEngage({ meetingId: m.id, mode: "chat" })}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Open chat
                    </Button>
                    {m.mode === "video" ? (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => setEngage({ meetingId: m.id, mode: "phone" })}
                      >
                        <Phone className="h-3.5 w-3.5" /> Switch to voice
                      </Button>
                    ) : null}
                    {m.mode === "in_person" ? (
                      <span className="inline-flex items-center gap-1.5 self-center text-xs text-[var(--muted)]">
                        <MapPin className="h-3.5 w-3.5" /> Or meet at {t?.room ?? "school"}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      ) : null}

      <Surface className="mb-6 p-5">
        <Field label="Which child is this meeting for?">
          <Select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setTeacherId("");
              setError(null);
              setMessage(null);
              setSelectedDate("");
              setSlotId("");
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.className}-{s.section}
              </option>
            ))}
          </Select>
        </Field>
        {childClass ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Showing teachers for <span className="font-semibold text-[var(--ink)]">{childClass}</span>{" "}
            only ({relevantTeachers.length} available).
          </p>
        ) : null}
      </Surface>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--ink-2)]">1. Choose a teacher</p>
          {relevantTeachers.length === 0 ? (
            <Surface className="p-6 text-sm text-[var(--muted)]">
              No teachers are mapped to {childClass || "this class"} yet. Please contact the school
              office.
            </Surface>
          ) : (
            <div className="space-y-3">
              {relevantTeachers.map((t) => {
                const openCount = state.teacherSlots.filter(
                  (s) => s.teacherId === t.id && s.status === "open",
                ).length;
                const active = t.id === activeTeacherId;
                const subjects = subjectsForClass(t, childClass);
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
                          For {childClass}: {subjects.join(", ") || t.subject} · {t.room}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
              ? `Availability for ${teacher.name} (${childClass}) over the next two weeks.`
              : "Select a teacher to see open times."}
          </p>

          {!activeTeacherId || dates.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-[var(--surface-muted)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              {!activeTeacherId
                ? "Choose a teacher for your child’s class first."
                : "No open slots for this teacher right now. Try another teacher."}
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
            <p className="text-sm font-semibold text-[var(--ink-2)]">3. How do you want to meet?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => {
                const active = mode === m.value;
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/25"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} />
                      <span className="font-semibold">{m.label}</span>
                      {active ? <Badge tone="accent">Selected</Badge> : null}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">{m.hint}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-[var(--muted)]">
              Meeting for{" "}
              <span className="font-semibold text-[var(--ink)]">
                {selectedStudent
                  ? `${selectedStudent.name} · ${selectedStudent.className}-${selectedStudent.section}`
                  : "—"}
              </span>
            </p>
            <Field label="What is this about?">
              <Select value={topic} onChange={(e) => setTopic(e.target.value as MeetingTopic)}>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                minutes · {MODES.find((m) => m.value === mode)?.label}
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
              Book &amp; meet in-app
            </Button>
          </div>
        </Surface>
      </div>

      {engage && engageMeeting && engageTeacher ? (
        <MeetingEngageModal
          meeting={engageMeeting}
          teacher={engageTeacher}
          studentName={engageStudent?.name ?? "your child"}
          mode={engage.mode}
          messages={engageMessages}
          onClose={() => setEngage(null)}
          onStart={() => startMeetingSession(engage.meetingId)}
          onEnd={() => endMeetingSession(engage.meetingId)}
          onSendChat={(text) => {
            const result = sendMeetingChat(engage.meetingId, text);
            if (!result.ok) setError(result.error);
          }}
        />
      ) : null}
    </div>
  );
}
