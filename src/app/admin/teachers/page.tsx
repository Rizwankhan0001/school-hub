"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  DoorOpen,
  Download,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { downloadTeacherProfile } from "@/lib/teacher-profile";
import type { Teacher } from "@/lib/types";

const CLASS_ORDER = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const STAGE_META = {
  Primary: {
    label: "Primary",
    range: "1 – 5",
    tone: "bg-[var(--accent-soft)] text-[var(--teal-deep)]",
    bar: "bg-[var(--accent)]",
    wash: "from-[rgba(0,166,126,0.18)] via-[rgba(0,166,126,0.05)] to-white",
    ring: "ring-[var(--accent)]",
    number: "text-[var(--accent)]",
  },
  Middle: {
    label: "Middle",
    range: "6 – 8",
    tone: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
    bar: "bg-[var(--accent-2)]",
    wash: "from-[rgba(36,91,255,0.16)] via-[rgba(36,91,255,0.04)] to-white",
    ring: "ring-[var(--accent-2)]",
    number: "text-[var(--accent-2)]",
  },
  Senior: {
    label: "Senior",
    range: "9 – 12",
    tone: "bg-[var(--ink-soft)] text-[var(--ink)]",
    bar: "bg-[var(--ink)]",
    wash: "from-[rgba(10,12,16,0.1)] via-[rgba(0,166,126,0.05)] to-white",
    ring: "ring-[var(--ink)]",
    number: "text-[var(--ink)]",
  },
} as const;

type Stage = keyof typeof STAGE_META;

const DEPT_TONE: Record<Teacher["department"], "accent" | "info" | "success" | "warning"> = {
  Primary: "success",
  Middle: "info",
  Senior: "accent",
  Specialist: "warning",
};

function classSortKey(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 999;
}

function stageForClass(className: string): Stage {
  const n = classSortKey(className);
  if (n <= 5) return "Primary";
  if (n <= 8) return "Middle";
  return "Senior";
}

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

type ClassRow = {
  teacherId: string;
  teacherName: string;
  avatarInitials: string;
  subject: string;
  section?: string;
  department: Teacher["department"];
  yearsExperience: number;
};

export default function AdminTeachersPage() {
  const { state, getTeacherRatingSummary, user } = useApp();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [deptFilter, setDeptFilter] = useState<"all" | Teacher["department"]>("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [focusTeacherId, setFocusTeacherId] = useState<string | null>(null);

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

  const avgExperience = useMemo(() => {
    if (!state.teachers.length) return 0;
    return Math.round(
      state.teachers.reduce((s, t) => s + t.yearsExperience, 0) / state.teachers.length,
    );
  }, [state.teachers]);

  const byStageCount = useMemo(() => {
    const counts = { Primary: 0, Middle: 0, Senior: 0 };
    for (const t of state.teachers) {
      for (const a of t.classAssignments) {
        counts[stageForClass(a.className)] += 1;
      }
    }
    return counts;
  }, [state.teachers]);

  const classMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<string, ClassRow[]>();

    for (const t of state.teachers) {
      if (deptFilter !== "all" && t.department !== deptFilter) continue;
      for (const a of t.classAssignments) {
        const stage = stageForClass(a.className);
        if (stageFilter !== "all" && stage !== stageFilter) continue;
        if (term) {
          const hay = [t.name, t.subject, a.subject, a.className, a.section ?? "", t.department]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(term)) continue;
        }
        const list = map.get(a.className) ?? [];
        list.push({
          teacherId: t.id,
          teacherName: t.name,
          avatarInitials: t.avatarInitials,
          subject: a.subject,
          section: a.section,
          department: t.department,
          yearsExperience: t.yearsExperience,
        });
        map.set(a.className, list);
      }
    }

    return CLASS_ORDER.filter((c) => {
      if (stageFilter !== "all" && stageForClass(c) !== stageFilter) return false;
      if (term || deptFilter !== "all") return map.has(c);
      return true;
    }).map((className) => {
      const rows = map.get(className) ?? [];
      const uniqueTeachers = new Set(rows.map((r) => r.teacherId)).size;
      return {
        className,
        stage: stageForClass(className),
        rows,
        uniqueTeachers,
        subjects: rows.length,
      };
    });
  }, [state.teachers, stageFilter, deptFilter, q]);

  const classDetail = useMemo(() => {
    if (!selectedClass) return null;
    const term = q.trim().toLowerCase();
    const rows: ClassRow[] = [];
    const teacherIds = new Set<string>();

    for (const t of state.teachers) {
      if (deptFilter !== "all" && t.department !== deptFilter) continue;
      if (focusTeacherId && t.id !== focusTeacherId) continue;
      for (const a of t.classAssignments) {
        if (a.className !== selectedClass) continue;
        if (term) {
          const hay = [t.name, a.subject, a.section ?? "", t.subject].join(" ").toLowerCase();
          if (!hay.includes(term)) continue;
        }
        rows.push({
          teacherId: t.id,
          teacherName: t.name,
          avatarInitials: t.avatarInitials,
          subject: a.subject,
          section: a.section,
          department: t.department,
          yearsExperience: t.yearsExperience,
        });
        teacherIds.add(t.id);
      }
    }

    const allRows: ClassRow[] = [];
    for (const t of state.teachers) {
      if (deptFilter !== "all" && t.department !== deptFilter) continue;
      for (const a of t.classAssignments) {
        if (a.className !== selectedClass) continue;
        allRows.push({
          teacherId: t.id,
          teacherName: t.name,
          avatarInitials: t.avatarInitials,
          subject: a.subject,
          section: a.section,
          department: t.department,
          yearsExperience: t.yearsExperience,
        });
      }
    }

    const uniqueAll = Array.from(
      new Map(allRows.map((r) => [r.teacherId, r])).values(),
    );

    return {
      className: selectedClass,
      stage: stageForClass(selectedClass),
      rows,
      allTeachers: uniqueAll,
      teacherCount: teacherIds.size,
    };
  }, [selectedClass, state.teachers, deptFilter, focusTeacherId, q]);

  const directory = useMemo(() => {
    if (!selectedClass) {
      return state.teachers.filter((t) => {
        if (deptFilter !== "all" && t.department !== deptFilter) return false;
        if (stageFilter !== "all") {
          const touches = t.classAssignments.some(
            (a) => stageForClass(a.className) === stageFilter,
          );
          if (!touches) return false;
        }
        if (!q.trim()) return true;
        const hay = [t.name, t.subject, t.specialty, t.department, ...t.classes]
          .join(" ")
          .toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      });
    }
    return state.teachers.filter((t) => {
      if (focusTeacherId && t.id !== focusTeacherId) return false;
      if (deptFilter !== "all" && t.department !== deptFilter) return false;
      return t.classAssignments.some((a) => a.className === selectedClass);
    });
  }, [state.teachers, selectedClass, focusTeacherId, deptFilter, stageFilter, q]);

  const selectedMeta = selectedClass ? STAGE_META[stageForClass(selectedClass)] : null;

  function openClass(className: string, teacherId?: string) {
    setSelectedClass(className);
    setFocusTeacherId(teacherId ?? null);
  }

  function backToMap() {
    setSelectedClass(null);
    setFocusTeacherId(null);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Teachers"
        description="Browse faculty by stage and class — open subject assignments, then jump into full profiles."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faculty" value={String(state.teachers.length)} tone="accent" />
        <Stat label="Classes covered" value="1–12" />
        <Stat label="Avg experience" value={`${avgExperience} yrs`} tone="success" />
        <Stat
          label="Rated educators"
          value={String(ranked.filter((r) => r.count > 0).length)}
        />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Surface className="relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,166,126,0.16),transparent_55%),linear-gradient(135deg,#0a0c10_0%,#14352c_55%,#0a0c10_100%)]" />
          <div className="relative p-6 text-white sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <Trophy className="h-5 w-5 text-[var(--accent)]" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                  Teacher of the Year · {state.school.academicSession}
                </p>
                {awardedTeacher && currentAward ? (
                  <>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      {awardedTeacher.name}
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                      {currentAward.reason}
                    </p>
                    <Link href={`/admin/teachers/${awardedTeacher.id}`} className="mt-4 inline-block">
                      <Button size="sm">Open profile</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                      Awaiting this year’s crown
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                      Rate faculty through the year, then award the top educator
                      {top?.count ? ` — current leader: ${top.teacher.name}` : ""}.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
            Top rated now
          </p>
          {top && top.count > 0 ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-white">
                  {top.teacher.avatarInitials}
                </span>
                <div>
                  <p className="font-bold tracking-[-0.02em]">{top.teacher.name}</p>
                  <p className="text-xs text-[var(--muted)]">{top.teacher.subject}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Stars value={top.average} />
                <span className="text-sm text-[var(--muted)]">
                  {top.average.toFixed(1)} · {top.count} ratings
                </span>
              </div>
              <Link href={`/admin/teachers/${top.teacher.id}`} className="mt-4 inline-block">
                <Button size="sm" variant="soft">
                  View profile <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">No ratings yet.</p>
          )}
        </Surface>
      </div>

      {/* Stage cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(STAGE_META) as Stage[]).map((stage) => {
          const meta = STAGE_META[stage];
          const on = stageFilter === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => {
                setStageFilter(on ? "all" : stage);
                backToMap();
              }}
              className={`rounded-[1.25rem] border px-4 py-3.5 text-left transition ${
                on
                  ? `border-transparent bg-gradient-to-br ${meta.wash} ring-2 ${meta.ring}`
                  : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em]">
                    {meta.label}
                  </p>
                  <p className="text-xs font-semibold text-[var(--muted)]">Classes {meta.range}</p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums ${meta.tone}`}>
                  {byStageCount[stage]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.07),rgba(36,91,255,0.04))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-[var(--accent)]" />
            {selectedClass ? (
              <nav className="flex flex-wrap items-center gap-1.5 text-[var(--muted)]">
                <button
                  type="button"
                  onClick={backToMap}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  All classes
                </button>
                <span>/</span>
                <span className="text-[var(--ink)]">{selectedClass}</span>
                {focusTeacherId ? (
                  <>
                    <span>/</span>
                    <span className="text-[var(--ink)]">
                      {directory.find((t) => t.id === focusTeacherId)?.name ?? "Teacher"}
                    </span>
                  </>
                ) : null}
              </nav>
            ) : (
              <span>Class faculty map</span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[200px] flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                placeholder="Search teacher, subject…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select
              className="w-full sm:w-44"
              value={deptFilter}
              onChange={(e) =>
                setDeptFilter(e.target.value as "all" | Teacher["department"])
              }
            >
              <option value="all">All departments</option>
              <option value="Primary">Primary</option>
              <option value="Middle">Middle</option>
              <option value="Senior">Senior</option>
              <option value="Specialist">Specialist</option>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedClass ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-5"
            >
              <div className="mb-4">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                  Choose a class
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Use <span className="font-semibold text-[var(--ink)]">Open</span> on a subject
                  teacher, or open the full class faculty.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {classMap.map((item) => {
                  const meta = STAGE_META[item.stage];
                  return (
                    <div
                      key={item.className}
                      className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/90 font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.04em] shadow-sm ${meta.number}`}
                          >
                            {classSortKey(item.className)}
                          </span>
                          <div>
                            <p className="font-bold tracking-[-0.02em]">{item.className}</p>
                            <span
                              className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${meta.tone}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums tracking-[-0.04em]">
                            {item.uniqueTeachers}
                          </p>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                            teachers
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                          Open a subject teacher
                        </p>
                        {item.rows.length === 0 ? (
                          <p className="text-xs text-[var(--muted)]">No faculty in this filter</p>
                        ) : (
                          item.rows.slice(0, 5).map((row, idx) => (
                            <div
                              key={`${row.teacherId}-${row.subject}-${idx}`}
                              className="flex items-center gap-2 rounded-2xl bg-white/70 p-1.5 ring-1 ring-[var(--line)]"
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-[0.65rem] font-bold text-white">
                                {row.avatarInitials}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold">{row.subject}</p>
                                <p className="truncate text-[0.65rem] text-[var(--muted)]">
                                  {row.teacherName}
                                  {row.section ? ` · Sec ${row.section}` : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openClass(item.className, row.teacherId)}
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-2 text-[0.7rem] font-bold text-white transition hover:bg-[var(--accent-hover)]"
                              >
                                Open
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                        {item.rows.length > 5 ? (
                          <p className="text-[0.65rem] font-semibold text-[var(--muted)]">
                            +{item.rows.length - 5} more subjects
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => openClass(item.className)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                      >
                        Open full class faculty
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : classDetail ? (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`border-b border-[var(--line)] bg-gradient-to-br ${selectedMeta?.wash} px-4 py-5 sm:px-6`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={backToMap}
                      className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                      aria-label="Back to class map"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                          {classDetail.className}
                        </p>
                        {selectedMeta ? (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${selectedMeta.tone}`}
                          >
                            {selectedMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {classDetail.teacherCount} teacher
                        {classDetail.teacherCount === 1 ? "" : "s"} · {classDetail.rows.length}{" "}
                        subject assignment{classDetail.rows.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="w-full lg:max-w-xl">
                    <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                      <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                      Open teacher
                    </p>
                    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-[var(--line)]">
                      <button
                        type="button"
                        onClick={() => setFocusTeacherId(null)}
                        className={`rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                          !focusTeacherId
                            ? "bg-[var(--ink)] text-white"
                            : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                        }`}
                      >
                        All faculty
                      </button>
                      {classDetail.allTeachers.map((t) => (
                        <button
                          key={t.teacherId}
                          type="button"
                          onClick={() => setFocusTeacherId(t.teacherId)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                            focusTeacherId === t.teacherId
                              ? "bg-[var(--accent)] text-white"
                              : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {t.teacherName.split(" ")[0]}
                          <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-5">
                <div>
                  <p className="mb-3 text-sm font-bold">Subject map</p>
                  {classDetail.rows.length === 0 ? (
                    <EmptyState
                      title="No assignments in this view"
                      description="Try clearing search or teacher focus."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-muted)]/60 p-1.5 sm:p-2">
                      <div className="divide-y divide-[var(--line)] rounded-[1rem] bg-white">
                        {classDetail.rows.map((row, i) => (
                          <div
                            key={`${row.teacherId}-${row.subject}-${i}`}
                            className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[0.65rem] font-bold text-white">
                                {row.avatarInitials}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{row.subject}</p>
                                <p className="truncate text-xs text-[var(--muted)]">
                                  {row.teacherName}
                                  {row.section ? ` · Sec ${row.section}` : ""} · {row.yearsExperience}{" "}
                                  yrs
                                </p>
                              </div>
                            </div>
                            <Link href={`/admin/teachers/${row.teacherId}`}>
                              <Button size="sm" variant="soft">
                                Profile
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold">Faculty cards</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {directory.map((t) => {
                      const summary = getTeacherRatingSummary(t.id);
                      const awards = state.teacherYearAwards.filter((a) => a.teacherId === t.id);
                      const isToty = awards.some(
                        (a) => a.academicYear === state.school.academicSession,
                      );
                      return (
                        <Surface key={t.id} className="overflow-hidden p-0">
                          <div
                            className={`bg-gradient-to-br ${
                              STAGE_META[stageForClass(t.classes[0] ?? selectedClass ?? "Class 1")]
                                .wash
                            } px-5 pt-5 pb-4`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.15rem] bg-[var(--ink)] text-sm font-bold text-white">
                                {t.avatarInitials}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold tracking-[-0.02em]">{t.name}</p>
                                  {isToty ? <Badge tone="accent">Teacher of the Year</Badge> : null}
                                </div>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  {t.subject} · {t.specialty}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <Badge tone={DEPT_TONE[t.department]}>{t.department}</Badge>
                                  <Badge tone="neutral">{t.yearsExperience} yrs</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3 px-5 py-4">
                            <p className="text-sm leading-relaxed text-[var(--ink-2)] line-clamp-3">
                              {t.bio}
                            </p>
                            {(t.highlights?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {t.highlights.slice(0, 3).map((h) => (
                                  <span
                                    key={h}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--muted)]"
                                  >
                                    <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                                    {h}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {t.room}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" /> {t.classes.length} classes
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />{" "}
                                {(t.languagesSpoken ?? []).slice(0, 2).join(", ") || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Stars value={summary.average} />
                              <span className="text-[var(--muted)]">
                                {summary.count
                                  ? `${summary.average.toFixed(1)} · ${summary.count} ratings`
                                  : "No ratings yet"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
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
                                    ratings: state.teacherRatings.filter(
                                      (r) => r.teacherId === t.id,
                                    ),
                                    awards,
                                  })
                                }
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </Button>
                            </div>
                            {user?.role === "school_admin" &&
                            !currentAward &&
                            top?.teacher.id === t.id ? (
                              <p className="text-xs text-[var(--accent)]">
                                Leading the board — open profile to award Teacher of the Year.
                              </p>
                            ) : null}
                          </div>
                        </Surface>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
