"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Languages,
  MapPin,
  Printer,
  Sparkles,
  Star,
  Trophy,
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
import { formatDate, formatDateTime, roleLabel } from "@/lib/format";
import {
  downloadTeacherProfile,
  openTeacherProfile,
} from "@/lib/teacher-profile";

const KIND_TONE: Record<string, "info" | "accent" | "success" | "warning"> = {
  education: "info",
  career: "accent",
  certification: "success",
  award: "warning",
};

const DEPT_GRADIENT: Record<string, string> = {
  Primary: "from-[rgba(0,166,126,0.22)] via-[rgba(0,166,126,0.08)] to-transparent",
  Middle: "from-[rgba(36,91,255,0.2)] via-[rgba(36,91,255,0.06)] to-transparent",
  Senior: "from-[rgba(10,12,16,0.14)] via-[rgba(0,166,126,0.1)] to-transparent",
  Specialist: "from-[rgba(212,146,48,0.2)] via-[rgba(212,146,48,0.06)] to-transparent",
};

export default function AdminTeacherDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    state,
    user,
    getTeacherRatingSummary,
    rateTeacher,
    awardTeacherOfTheYear,
  } = useApp();
  const teacher = state.teachers.find((t) => t.id === params.id);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const summary = getTeacherRatingSummary(params.id);
  const ratings = useMemo(
    () =>
      state.teacherRatings
        .filter((r) => r.teacherId === params.id)
        .sort((a, b) => b.ratedAt.localeCompare(a.ratedAt)),
    [state.teacherRatings, params.id],
  );
  const awards = useMemo(
    () =>
      state.teacherYearAwards
        .filter((a) => a.teacherId === params.id)
        .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)),
    [state.teacherYearAwards, params.id],
  );
  const currentYearAward = state.teacherYearAwards.find(
    (a) => a.academicYear === state.school.academicSession,
  );
  const isThisYearWinner = currentYearAward?.teacherId === params.id;

  const profileDoc = teacher
    ? {
        school: state.school,
        teacher,
        averageRating: summary.average,
        ratingCount: summary.count,
        ratings,
        awards,
      }
    : null;

  if (!teacher) {
    return (
      <div className="animate-rise">
        <PageHeader title="Teacher not found" description="That profile is missing." />
        <Link href="/admin/teachers">
          <Button variant="soft">
            <ArrowLeft className="h-4 w-4" /> Back to teachers
          </Button>
        </Link>
      </div>
    );
  }

  function onRate() {
    setErr(null);
    setMsg(null);
    const result = rateTeacher({ teacherId: teacher!.id, stars, comment });
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg("Rating saved — keep encouraging great teaching.");
    setComment("");
  }

  function onAward() {
    setErr(null);
    setMsg(null);
    const result = awardTeacherOfTheYear({
      teacherId: teacher!.id,
      reason: awardReason,
    });
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg(`Teacher of the Year ${state.school.academicSession} awarded to ${teacher!.name}.`);
    setAwardReason("");
  }

  const timeline = [...teacher.timeline].sort((a, b) => a.year.localeCompare(b.year));
  const department = teacher.department ?? "Specialist";

  return (
    <div className="animate-rise">
      <div className="mb-4">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> All teachers
        </Link>
      </div>

      <Surface className={`mb-6 overflow-hidden bg-gradient-to-br ${DEPT_GRADIENT[department]} p-0`}>
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.25rem] bg-[var(--ink)] text-lg font-bold text-white shadow-[0_18px_36px_-20px_rgba(10,12,16,0.65)]">
                {teacher.avatarInitials}
              </span>
              <div>
                <div className="flex flex-wrap gap-2">
                  {isThisYearWinner ? <Badge tone="accent">Teacher of the Year</Badge> : null}
                  <Badge tone="neutral">{department}</Badge>
                  <Badge tone="info">{teacher.yearsExperience} yrs experience</Badge>
                </div>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                  {teacher.name}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)] sm:text-base">
                  {teacher.subject} · {teacher.specialty}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
                  {teacher.bio}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="soft"
                onClick={() => profileDoc && downloadTeacherProfile(profileDoc)}
              >
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button
                variant="ghost"
                onClick={() => profileDoc && openTeacherProfile(profileDoc, true)}
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </Button>
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Surface className="p-4">
              <p className="text-xs text-[var(--muted)]">Qualification</p>
              <p className="mt-1 font-semibold">{teacher.highestQualification}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs text-[var(--muted)]">Joined</p>
              <p className="mt-1 font-semibold">{formatDate(teacher.joinedOn)}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs text-[var(--muted)]">Email</p>
              <p className="mt-1 break-all font-semibold">{teacher.email}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs text-[var(--muted)]">Phone</p>
              <p className="mt-1 font-semibold">{teacher.phone}</p>
            </Surface>
          </div>

          <Surface className="p-5">
            <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[var(--accent)]" /> {teacher.room}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Languages className="h-4 w-4 text-[var(--accent)]" />{" "}
                {(teacher.languagesSpoken ?? []).join(", ") || "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[var(--accent)]" />{" "}
                {teacher.classes.join(", ")}
              </span>
            </div>

            {(teacher.highlights?.length ?? 0) > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {teacher.highlights.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-hover)]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {h}
                  </span>
                ))}
              </div>
            ) : null}
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Class-wise subjects</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Teaching load across {teacher.classes.length} class band
              {teacher.classes.length === 1 ? "" : "s"}.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacher.classAssignments.map((a, i) => (
                      <tr key={`${a.className}-${a.subject}-${i}`}>
                        <td className="font-medium">{a.className}</td>
                        <td>{a.section ?? "—"}</td>
                        <td>{a.subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">
              Education & career timeline
            </h2>
            <div className="relative mt-6 space-y-0 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-[var(--line-strong)]">
              {timeline.map((event) => (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <span className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[var(--accent)] bg-white" />
                  <div className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={KIND_TONE[event.kind] ?? "neutral"}>{event.kind}</Badge>
                      <span className="text-xs font-semibold text-[var(--muted)]">{event.year}</span>
                    </div>
                    <p className="mt-2 font-semibold tracking-[-0.02em]">{event.title}</p>
                    <p className="text-sm text-[var(--muted)]">{event.organization}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">School rating</h2>
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em]">
              {summary.count ? summary.average.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {summary.count ? `${summary.count} encouragement ratings` : "No ratings yet"}
            </p>
            <div className="mt-3 flex gap-1 text-[var(--accent)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.round(summary.average) ? "fill-current" : "text-[var(--line-strong)]"}`}
                />
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Rate this teacher</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Encourage strong teaching with a quick school-panel rating.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Stars">
                <Select
                  value={String(stars)}
                  onChange={(e) => setStars(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Encouragement note" hint="Optional">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What went especially well?"
                />
              </Field>
              <Button onClick={onRate} className="w-full">
                <Star className="h-4 w-4" /> Submit rating
              </Button>
            </div>
          </Surface>

          {user?.role === "school_admin" ? (
            <Surface className="border-[var(--accent)]/30 p-5">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold tracking-[-0.01em]">
                  Teacher of the Year
                </h2>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Award the top educator for {state.school.academicSession}. Only one winner per year.
              </p>
              {isThisYearWinner ? (
                <p className="mt-4 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-hover)]">
                  {teacher.name} already holds this year’s award.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <Field label="Why this teacher?">
                    <Input
                      value={awardReason}
                      onChange={(e) => setAwardReason(e.target.value)}
                      placeholder="Impact on students, parent feedback, innovation…"
                    />
                  </Field>
                  <Button className="w-full" variant="secondary" onClick={onAward}>
                    <Trophy className="h-4 w-4" /> Award Teacher of the Year
                  </Button>
                  {currentYearAward ? (
                    <p className="text-xs text-[var(--muted)]">
                      This will replace the current {state.school.academicSession} winner.
                    </p>
                  ) : null}
                </div>
              )}
            </Surface>
          ) : null}

          {err ? (
            <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {err}
            </p>
          ) : null}
          {msg ? (
            <p className="rounded-xl bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]">
              {msg}
            </p>
          ) : null}

          {awards.length > 0 ? (
            <Surface className="p-5">
              <h2 className="text-base font-semibold tracking-[-0.01em]">Award history</h2>
              <div className="mt-3 space-y-3">
                {awards.map((a) => (
                  <div key={a.id} className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                    <p className="font-semibold">
                      {a.title} · {a.academicYear}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{a.reason}</p>
                    <p className="mt-1 text-xs text-[var(--muted-2)]">
                      By {a.awardedBy} · {formatDateTime(a.awardedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Recent ratings</h2>
            <div className="mt-3 space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <div className="flex items-center gap-1 text-[var(--accent)]">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm">{r.comment || "No comment"}</p>
                  <p className="mt-1 text-xs text-[var(--muted-2)]">
                    {r.ratedBy} · {roleLabel(r.ratedByRole)} · {formatDateTime(r.ratedAt)}
                  </p>
                </div>
              ))}
              {ratings.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No ratings yet for this teacher.</p>
              ) : null}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
