"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, GraduationCap, Star, Trophy } from "lucide-react";
import { Badge, Button, PageHeader, Select, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { downloadTeacherProfile } from "@/lib/teacher-profile";

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-[var(--accent)]" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rounded ? "fill-current" : "text-[var(--line-strong)]"}`}
        />
      ))}
    </span>
  );
}

export default function AdminTeachersPage() {
  const { state, getTeacherRatingSummary, user } = useApp();
  const [classFilter, setClassFilter] = useState("all");

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of state.teachers) {
      for (const a of t.classAssignments) set.add(a.className);
    }
    return Array.from(set).sort();
  }, [state.teachers]);

  const ranked = useMemo(() => {
    return [...state.teachers]
      .map((t) => ({ teacher: t, ...getTeacherRatingSummary(t.id) }))
      .sort((a, b) => b.average - a.average || b.count - a.count);
  }, [state.teachers, getTeacherRatingSummary]);

  const top = ranked[0];
  const currentAward = state.teacherYearAwards.find(
    (a) => a.academicYear === state.school.academicSession,
  );
  const awardedTeacher = currentAward
    ? state.teachers.find((t) => t.id === currentAward.teacherId)
    : null;

  const filtered = useMemo(() => {
    return state.teachers.filter((t) => {
      if (classFilter === "all") return true;
      return t.classAssignments.some((a) => a.className === classFilter);
    });
  }, [state.teachers, classFilter]);

  const byClass = useMemo(() => {
    const map = new Map<string, { teacherId: string; teacherName: string; subject: string; section?: string }[]>();
    for (const t of filtered) {
      for (const a of t.classAssignments) {
        if (classFilter !== "all" && a.className !== classFilter) continue;
        const list = map.get(a.className) ?? [];
        list.push({
          teacherId: t.id,
          teacherName: t.name,
          subject: a.subject,
          section: a.section,
        });
        map.set(a.className, list);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, classFilter]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Teachers"
        description="Class-wise subjects, education & career timelines, ratings, and Teacher of the Year."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-white">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Teacher of the Year · {state.school.academicSession}
              </p>
              {awardedTeacher && currentAward ? (
                <>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                    {awardedTeacher.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{currentAward.reason}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                    Not awarded yet
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Rate teachers through the year, then crown the top educator at year end
                    {top ? ` — current leader: ${top.teacher.name}` : ""}.
                  </p>
                </>
              )}
            </div>
          </div>
        </Surface>

        <Surface className="p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Top rated right now</p>
          {top && top.count > 0 ? (
            <>
              <p className="mt-2 text-xl font-bold tracking-[-0.02em]">{top.teacher.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={top.average} />
                <span className="text-sm text-[var(--muted)]">
                  {top.average} · {top.count} ratings
                </span>
              </div>
              <Link href={`/admin/teachers/${top.teacher.id}`} className="mt-4 inline-block">
                <Button size="sm" variant="soft">
                  View profile <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">No ratings yet — start encouraging teachers.</p>
          )}
        </Surface>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Class-wise teaching map</p>
          <p className="text-sm text-[var(--muted)]">Who teaches which subject in each class.</p>
        </div>
        <div className="w-full max-w-xs">
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">All classes</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {byClass.map(([className, rows]) => (
          <Surface key={className} className="overflow-hidden">
            <div className="border-b border-[var(--line)] bg-[var(--bg)] px-5 py-3">
              <p className="font-semibold tracking-[-0.02em]">{className}</p>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {rows.map((row, i) => (
                <div
                  key={`${row.teacherId}-${row.subject}-${row.section ?? ""}-${i}`}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="font-medium">{row.subject}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {row.teacherName}
                      {row.section ? ` · Sec ${row.section}` : ""}
                    </p>
                  </div>
                  <Link href={`/admin/teachers/${row.teacherId}`}>
                    <Button size="sm" variant="ghost">
                      Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold">All teacher profiles</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filtered.map((t) => {
            const summary = getTeacherRatingSummary(t.id);
            const awards = state.teacherYearAwards.filter((a) => a.teacherId === t.id);
            return (
              <Surface key={t.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-sm font-bold text-white">
                    {t.avatarInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold tracking-[-0.02em]">{t.name}</p>
                      {awards.some((a) => a.academicYear === state.school.academicSession) ? (
                        <Badge tone="accent">Teacher of the Year</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {t.subject} · {t.specialty}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{t.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.classAssignments.map((a, i) => (
                        <Badge key={`${a.className}-${a.subject}-${i}`} tone="neutral">
                          {a.className}
                          {a.section ? `-${a.section}` : ""} · {a.subject}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Stars value={summary.average} />
                      <span className="text-[var(--muted)]">
                        {summary.count
                          ? `${summary.average} · ${summary.count} ratings`
                          : "No ratings yet"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/admin/teachers/${t.id}`}>
                        <Button size="sm">
                          <GraduationCap className="h-3.5 w-3.5" /> Open profile
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() =>
                          downloadTeacherProfile({
                            school: state.school,
                            teacher: t,
                            averageRating: summary.average,
                            ratingCount: summary.count,
                            ratings: state.teacherRatings.filter((r) => r.teacherId === t.id),
                            awards,
                          })
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> Download profile
                      </Button>
                    </div>
                    {user?.role === "school_admin" && !currentAward && top?.teacher.id === t.id ? (
                      <p className="mt-3 text-xs text-[var(--accent)]">
                        Leading the board — open profile to award Teacher of the Year.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </div>
    </div>
  );
}
