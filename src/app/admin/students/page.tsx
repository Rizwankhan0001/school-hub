"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  DoorOpen,
  Eye,
  GraduationCap,
  LayoutGrid,
  Plus,
  Search,
  Users,
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
import type { Student } from "@/lib/types";

const CLASS_ORDER = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const SECTIONS = ["A", "B", "C"];

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

function initials(name: string, fallback?: string) {
  if (fallback) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function StudentRow({ student }: { student: Student }) {
  return (
    <Link
      href={`/admin/students/${student.id}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-transparent bg-white px-3 py-3 transition hover:border-[var(--line)] hover:bg-[var(--surface-muted)] sm:gap-4 sm:px-4"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-[0.7rem] font-bold tracking-wide text-white">
        {initials(student.name, student.avatarInitials)}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold tracking-[-0.02em]">{student.name}</p>
          <Badge
            tone={
              student.status === "active"
                ? "success"
                : student.status === "transferred"
                  ? "warning"
                  : "neutral"
            }
          >
            {student.status}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
          <span className="font-mono font-semibold text-[var(--ink-2)]">{student.admissionNo}</span>
          <span className="mx-1.5 text-[var(--line-strong)]">·</span>
          Roll {student.rollNo ?? "—"}
          {student.house ? (
            <>
              <span className="mx-1.5 text-[var(--line-strong)]">·</span>
              {student.house}
            </>
          ) : null}
          <span className="mx-1.5 text-[var(--line-strong)]">·</span>
          {student.parentName}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold text-[var(--teal-deep)] opacity-90 transition group-hover:opacity-100">
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Profile</span>
      </span>
    </Link>
  );
}

export default function StudentsPage() {
  const { state, addStudent } = useApp();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "transferred" | "archived">(
    "active",
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    admissionNo: "",
    name: "",
    className: "Class 1",
    section: "A",
    rollNo: "",
    gender: "Male" as "Male" | "Female" | "Other",
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    house: "",
    parentId: state.parents[0]?.id ?? "",
    parentName: state.parents[0]?.name ?? "",
    mobile: state.parents[0]?.mobile ?? "",
    email: state.parents[0]?.email ?? "",
  });

  const filteredStudents = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.students.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (stageFilter !== "all" && stageForClass(s.className) !== stageFilter) return false;
      if (selectedClass && s.className !== selectedClass) return false;
      if (selectedSection !== "all" && s.section !== selectedSection) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.admissionNo.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        (s.rollNo ?? "").toLowerCase().includes(term) ||
        s.parentName.toLowerCase().includes(term) ||
        `${s.className} ${s.section}`.toLowerCase().includes(term)
      );
    });
  }, [state.students, statusFilter, stageFilter, selectedClass, selectedSection, q]);

  const classMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<string, { total: number; sections: Record<string, number> }>();

    for (const s of state.students) {
      if (statusFilter !== "all" && s.status !== statusFilter) continue;
      const stage = stageForClass(s.className);
      if (stageFilter !== "all" && stage !== stageFilter) continue;
      if (term) {
        const hay = [s.name, s.admissionNo, s.id, s.rollNo ?? "", s.parentName, s.className, s.section]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) continue;
      }
      const entry = map.get(s.className) ?? { total: 0, sections: {} };
      entry.total += 1;
      entry.sections[s.section] = (entry.sections[s.section] ?? 0) + 1;
      map.set(s.className, entry);
    }

    return CLASS_ORDER.filter((c) => {
      if (stageFilter !== "all" && stageForClass(c) !== stageFilter) return false;
      // While searching, hide empty classes so results stay scannable
      if (term) return map.has(c);
      return true;
    }).map((c) => {
      const data = map.get(c) ?? { total: 0, sections: {} };
      return {
        className: c,
        stage: stageForClass(c),
        total: data.total,
        sections: Object.entries(data.sections).sort(([a], [b]) => a.localeCompare(b)),
      };
    });
  }, [state.students, statusFilter, stageFilter, q]);

  const stats = useMemo(() => {
    const active = state.students.filter((s) => s.status === "active");
    const byStage = { Primary: 0, Middle: 0, Senior: 0 };
    for (const s of active) byStage[stageForClass(s.className)] += 1;
    const sections = new Set(state.students.map((s) => `${s.className}-${s.section}`)).size;
    return {
      total: state.students.length,
      active: active.length,
      classes: new Set(state.students.map((s) => s.className)).size,
      sections,
      byStage,
    };
  }, [state.students]);

  const sectionRoster = useMemo(() => {
    if (!selectedClass) return [] as { section: string; students: Student[] }[];
    const map = new Map<string, Student[]>();
    for (const s of filteredStudents) {
      if (!map.has(s.section)) map.set(s.section, []);
      map.get(s.section)!.push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.rollNo ?? a.name).localeCompare(b.rollNo ?? b.name));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([section, students]) => ({ section, students }));
  }, [filteredStudents, selectedClass]);

  const selectedMeta = selectedClass ? STAGE_META[stageForClass(selectedClass)] : null;
  const selectedClassData = classMap.find((c) => c.className === selectedClass);
  const visibleSectionBlocks =
    selectedSection === "all"
      ? sectionRoster
      : sectionRoster.filter((s) => s.section === selectedSection);

  function openClass(className: string, section: string = "all") {
    setSelectedClass(className);
    setSelectedSection(section);
  }

  function backToMap() {
    setSelectedClass(null);
    setSelectedSection("all");
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Students"
        description="Explore the school roster by stage, class, and section — every student has a unique ID and profile."
        actions={
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Add student
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total students" value={String(stats.total)} tone="accent" />
        <Stat label="Active" value={String(stats.active)} tone="success" />
        <Stat label="Classes" value={String(stats.classes)} />
        <Stat label="Class-sections" value={String(stats.sections)} />
      </div>

      {/* Stage filter */}
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
                  {stats.byStage[stage]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {open ? (
        <Surface className="mb-6 p-5">
          <h2 className="mb-4 font-semibold">New student</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Student ID / Admission no." hint="Leave blank to auto-generate">
              <Input
                value={form.admissionNo}
                onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
                placeholder="ADM-2026-0001"
              />
            </Field>
            <Field label="Student name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Class">
              <Select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {CLASS_ORDER.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {SECTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Roll no.">
              <Input
                value={form.rollNo}
                onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                placeholder="A01"
              />
            </Field>
            <Field label="Gender">
              <Select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as "Male" | "Female" | "Other" })
                }
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </Field>
            <Field label="Blood group">
              <Input
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                placeholder="B+"
              />
            </Field>
            <Field label="House">
              <Input
                value={form.house}
                onChange={(e) => setForm({ ...form, house: e.target.value })}
                placeholder="Emerald"
              />
            </Field>
            <Field label="Parent">
              <Select
                value={form.parentId}
                onChange={(e) => {
                  const p = state.parents.find((x) => x.id === e.target.value);
                  setForm({
                    ...form,
                    parentId: e.target.value,
                    parentName: p?.name ?? "",
                    mobile: p?.mobile ?? form.mobile,
                    email: p?.email ?? form.email,
                  });
                }}
              >
                {state.parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mobile">
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Home address"
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim()) return;
                addStudent({
                  ...form,
                  emergencyContact: form.mobile,
                  dateOfJoining: new Date().toISOString().slice(0, 10),
                  remarks: "",
                });
                setOpen(false);
                setForm({ ...form, admissionNo: "", name: "", rollNo: "" });
              }}
            >
              Save student
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      {/* Shared toolbar */}
      <Surface className="mb-5 overflow-hidden p-0">
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
                {selectedSection !== "all" ? (
                  <>
                    <span>/</span>
                    <span className="text-[var(--ink)]">Section {selectedSection}</span>
                  </>
                ) : null}
              </nav>
            ) : (
              <span>Class map</span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px] flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                placeholder="Search name, student ID, roll…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select
              className="w-full sm:w-40"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "transferred" | "archived")
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="transferred">Transferred</option>
              <option value="archived">Archived</option>
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
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]">
                    Choose a class
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Use <span className="font-semibold text-[var(--ink)]">Open</span> on a section to
                    view those students, or open the full class.
                  </p>
                </div>
                {stageFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setStageFilter("all")}
                    className="text-xs font-bold text-[var(--accent)] hover:underline"
                  >
                    Clear stage filter
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {classMap.map((item) => {
                  const meta = STAGE_META[item.stage];
                  const maxSec = Math.max(1, ...item.sections.map(([, n]) => n));
                  return (
                    <div
                      key={item.className}
                      className={`relative overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
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
                            {item.total}
                          </p>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                            students
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                          Open a section
                        </p>
                        {item.sections.length === 0 ? (
                          <p className="text-xs text-[var(--muted)]">No students in this filter</p>
                        ) : (
                          item.sections.map(([sec, count]) => (
                            <div
                              key={sec}
                              className="flex items-center gap-2 rounded-2xl bg-white/70 p-1.5 ring-1 ring-[var(--line)]"
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-xs font-bold text-white">
                                {sec}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-[var(--ink)]">Section {sec}</p>
                                  <p className="text-[0.65rem] font-semibold tabular-nums text-[var(--muted)]">
                                    {count} students
                                  </p>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                                  <div
                                    className={`h-full rounded-full ${meta.bar}`}
                                    style={{ width: `${Math.max(12, (count / maxSec) * 100)}%` }}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openClass(item.className, sec)}
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-2 text-[0.7rem] font-bold text-white shadow-[0_10px_22px_-14px_rgba(0,166,126,0.85)] transition hover:bg-[var(--accent-hover)]"
                                aria-label={`Open ${item.className} Section ${sec}`}
                              >
                                Open
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openClass(item.className)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                      >
                        Open full class
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {/* Class hero */}
              <div className={`border-b border-[var(--line)] bg-gradient-to-br ${selectedMeta?.wash} px-4 py-5 sm:px-6`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                          {selectedClass}
                        </p>
                        {selectedMeta ? (
                          <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${selectedMeta.tone}`}>
                            {selectedMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-2)]">
                          <Users className="h-3.5 w-3.5" />
                          {selectedClassData?.total ?? filteredStudents.length} students
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {(selectedClassData?.sections.length ?? sectionRoster.length)} section
                          {(selectedClassData?.sections.length ?? sectionRoster.length) === 1
                            ? ""
                            : "s"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Section switcher */}
                  <div className="w-full lg:w-auto">
                    <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                      <DoorOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                      Open section students
                    </p>
                    <div className="inline-flex flex-wrap gap-1.5 rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-[var(--line)]">
                      <button
                        type="button"
                        onClick={() => setSelectedSection("all")}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                          selectedSection === "all"
                            ? "bg-[var(--ink)] text-white"
                            : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                        }`}
                      >
                        All sections
                        <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[0.65rem] tabular-nums">
                          {selectedClassData?.total ?? filteredStudents.length}
                        </span>
                      </button>
                      {(selectedClassData?.sections ??
                        sectionRoster.map((s) => [s.section, s.students.length] as const)
                      ).map(([sec, count]) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSelectedSection(sec)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                            selectedSection === sec
                              ? "bg-[var(--accent)] text-white shadow-[0_10px_24px_-14px_rgba(0,166,126,0.8)]"
                              : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                          }`}
                        >
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-lg text-[0.65rem] font-bold ${
                              selectedSection === sec
                                ? "bg-white/20 text-white"
                                : "bg-[var(--ink)] text-white"
                            }`}
                          >
                            {sec}
                          </span>
                          Open Sec {sec}
                          <ChevronRight
                            className={`h-3.5 w-3.5 ${
                              selectedSection === sec ? "opacity-100" : "opacity-50"
                            }`}
                          />
                          <span className="tabular-nums opacity-70">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section blocks */}
              <div className="space-y-6 p-4 sm:p-5">
                {visibleSectionBlocks.length === 0 ? (
                  <EmptyState
                    title="No students in this view"
                    description="Try another section, clear search, or change status filter."
                  />
                ) : (
                  visibleSectionBlocks.map(({ section, students }) => (
                    <section key={section}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ink)] font-[family-name:var(--font-display)] text-lg font-bold text-white">
                            {section}
                          </span>
                          <div>
                            <p className="font-bold tracking-[-0.02em]">Section {section}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {students.length} student{students.length === 1 ? "" : "s"} · sorted by
                              roll
                            </p>
                          </div>
                        </div>
                        {selectedSection === "all" ? (
                          <button
                            type="button"
                            onClick={() => setSelectedSection(section)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white transition hover:bg-[var(--accent-hover)]"
                          >
                            <DoorOpen className="h-3.5 w-3.5" />
                            Open Sec {section}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-muted)]/60 p-1.5 sm:p-2">
                        <div className="divide-y divide-[var(--line)] rounded-[1rem] bg-white">
                          {students.map((s) => (
                            <StudentRow key={s.id} student={s} />
                          ))}
                        </div>
                      </div>
                    </section>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
