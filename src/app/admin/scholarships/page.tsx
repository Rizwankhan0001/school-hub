"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DoorOpen,
  FileText,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Users,
  XCircle,
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
import {
  computeScholarshipAward,
  formatDate,
  formatINR,
  scholarshipBasisLabel,
} from "@/lib/format";
import type { Scholarship, ScholarshipProgram, ScholarshipStatus, ScholarshipType } from "@/lib/types";

type View = "schemes" | "applications";

const TYPE_META: Record<
  ScholarshipType,
  { wash: string; tone: string; bar: string; number: string }
> = {
  "Merit Based": {
    wash: "from-[rgba(0,166,126,0.18)] via-[rgba(0,166,126,0.05)] to-white",
    tone: "bg-[var(--accent-soft)] text-[var(--teal-deep)]",
    bar: "bg-[var(--accent)]",
    number: "text-[var(--accent)]",
  },
  "Scholarship Test": {
    wash: "from-[rgba(36,91,255,0.16)] via-[rgba(36,91,255,0.04)] to-white",
    tone: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
    bar: "bg-[var(--accent-2)]",
    number: "text-[var(--accent-2)]",
  },
  "Need Based": {
    wash: "from-[rgba(212,146,48,0.16)] via-[rgba(212,146,48,0.05)] to-white",
    tone: "bg-[var(--warn-soft)] text-[var(--warn)]",
    bar: "bg-[var(--warn)]",
    number: "text-[var(--warn)]",
  },
  "Sports Quota": {
    wash: "from-[rgba(10,12,16,0.1)] via-[rgba(0,166,126,0.05)] to-white",
    tone: "bg-[var(--ink-soft)] text-[var(--ink)]",
    bar: "bg-[var(--ink)]",
    number: "text-[var(--ink)]",
  },
  "Staff Child": {
    wash: "from-[rgba(0,166,126,0.12)] via-[rgba(36,91,255,0.06)] to-white",
    tone: "bg-[var(--accent-soft)] text-[var(--teal-deep)]",
    bar: "bg-[var(--accent)]",
    number: "text-[var(--accent)]",
  },
  "Government Sponsored": {
    wash: "from-[rgba(36,91,255,0.12)] via-[rgba(10,12,16,0.04)] to-white",
    tone: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
    bar: "bg-[var(--accent-2)]",
    number: "text-[var(--accent-2)]",
  },
};

function awardPreview(program: ScholarshipProgram) {
  if (program.awardMode === "percentage") return `${program.awardValue}% waiver`;
  if (program.awardMode === "fixed") return formatINR(program.awardValue);
  return program.maxAwardLabel;
}

function statusTone(status: ScholarshipStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ScholarshipsPage() {
  const {
    state,
    getStudent,
    addScholarship,
    updateScholarshipStatus,
    autoReviewScholarship,
    autoReviewPendingScholarships,
  } = useApp();
  const programs = state.scholarshipPrograms ?? [];
  const [view, setView] = useState<View>("schemes");
  const [typeFilter, setTypeFilter] = useState<"all" | ScholarshipType>("all");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ScholarshipStatus>("all");
  const [programAppFilter, setProgramAppFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reviewBanner, setReviewBanner] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    programId: "",
    studentId: "",
    qualifyingScore: 90,
    annualIncome: 250000,
    notes: "",
    effectiveFrom: "2025-04-01",
    expiresOn: "2026-03-31",
  });

  useEffect(() => {
    if (!programs.length) return;
    setForm((f) => ({
      ...f,
      programId: f.programId || programs[0].id,
      studentId: f.studentId || state.students[0]?.id || "",
    }));
  }, [programs, state.students]);

  const selected =
    programs.find((p) => p.id === selectedProgramId) ?? null;

  const stats = useMemo(() => {
    const approved = state.scholarships.filter((s) => s.status === "approved").length;
    const pending = state.scholarships.filter((s) => s.status === "pending").length;
    const rejected = state.scholarships.filter((s) => s.status === "rejected").length;
    const openSeats = programs.reduce((n, p) => n + Math.max(0, p.maxSeats - p.seatsFilled), 0);
    const parentApps = state.scholarships.filter((s) => s.appliedBy === "parent").length;
    return { approved, pending, rejected, openSeats, programs: programs.length, parentApps };
  }, [state.scholarships, programs]);

  const appsByProgram = useMemo(() => {
    const map = new Map<string, { pending: number; approved: number; total: number }>();
    for (const s of state.scholarships) {
      const key = s.programId ?? s.type;
      const entry = map.get(key) ?? { pending: 0, approved: 0, total: 0 };
      entry.total += 1;
      if (s.status === "pending") entry.pending += 1;
      if (s.status === "approved") entry.approved += 1;
      map.set(key, entry);
    }
    return map;
  }, [state.scholarships]);

  const schemeMap = useMemo(() => {
    const term = q.trim().toLowerCase();
    return programs.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term) ||
        p.summary.toLowerCase().includes(term) ||
        scholarshipBasisLabel(p.basis).toLowerCase().includes(term)
      );
    });
  }, [programs, typeFilter, q]);

  const filteredApps = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.scholarships
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (programAppFilter !== "all" && s.programId !== programAppFilter) return false;
        if (!term) return true;
        const student = getStudent(s.studentId);
        const program = programs.find((p) => p.id === s.programId);
        return (
          (student?.name ?? "").toLowerCase().includes(term) ||
          (program?.name ?? s.type).toLowerCase().includes(term) ||
          (s.notes ?? "").toLowerCase().includes(term) ||
          s.id.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const rank = (st: string) =>
          st === "pending" ? 0 : st === "approved" ? 1 : st === "rejected" ? 2 : 3;
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return b.effectiveFrom.localeCompare(a.effectiveFrom);
      });
  }, [state.scholarships, statusFilter, programAppFilter, q, getStudent, programs]);

  const relatedApps = useMemo(() => {
    if (!selectedProgramId) return [] as Scholarship[];
    return state.scholarships
      .filter((s) => s.programId === selectedProgramId)
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return 0;
      });
  }, [state.scholarships, selectedProgramId]);

  const selectedProgramForForm =
    programs.find((p) => p.id === form.programId) ?? programs[0] ?? null;

  const typeOptions = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.type)));
  }, [programs]);

  function openScheme(id: string) {
    setSelectedProgramId(id);
    setView("schemes");
  }

  function backToMap() {
    setSelectedProgramId(null);
  }

  function openApplyForm(programId?: string) {
    const pid = programId || selected?.id || programs[0]?.id || "";
    setForm((f) => ({
      ...f,
      programId: pid,
      studentId: f.studentId || state.students[0]?.id || "",
    }));
    setFormError(null);
    setOpenForm(true);
    setView("applications");
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function submitApplication() {
    setFormError(null);
    const program = programs.find((p) => p.id === form.programId) ?? programs[0];
    if (!program) {
      setFormError("No scholarship scheme is available. Refresh the page and try again.");
      return;
    }
    if (!form.studentId) {
      setFormError("Please choose a student.");
      return;
    }

    const needsScore =
      program.basis === "percentage_marks" || program.basis === "scholarship_test";
    const award = computeScholarshipAward(
      program,
      needsScore ? form.qualifyingScore : undefined,
    );

    if (program.basis === "need_based_quota" && form.annualIncome >= 300000) {
      setFormError("Income exceeds EWS limit (₹3,00,000). Application cannot be submitted.");
      return;
    }
    if (needsScore && !award) {
      setFormError("Score is below the qualifying band for this scheme.");
      return;
    }

    let mode: "percentage" | "fixed" = "percentage";
    let value = program.awardValue;
    if (award) {
      mode = award.mode;
      value = award.value;
    } else if (program.awardMode === "fixed") {
      mode = "fixed";
      value = program.awardValue;
    }

    const scoreNote = needsScore ? `Score/marks: ${form.qualifyingScore}. ` : "";
    const incomeNote =
      program.basis === "need_based_quota"
        ? `Declared income: ${formatINR(form.annualIncome)}. `
        : "";

    addScholarship({
      studentId: form.studentId,
      programId: program.id,
      type: program.type,
      basis: program.basis,
      mode,
      value,
      qualifyingScore: needsScore ? form.qualifyingScore : undefined,
      annualIncome: program.basis === "need_based_quota" ? form.annualIncome : undefined,
      documentsConfirmed: true,
      appliedBy: "admin",
      effectiveFrom: form.effectiveFrom,
      expiresOn: form.expiresOn,
      notes:
        form.notes.trim() ||
        `${scoreNote}${incomeNote}Applied under ${program.name} — ${awardPreview(program)}.`,
    });
    setOpenForm(false);
    setView("applications");
    setStatusFilter("pending");
    setReviewBanner("Application submitted for approval.");
  }

  function runAutoReviewAll() {
    const result = autoReviewPendingScholarships();
    setReviewBanner(
      result.reviewed === 0
        ? "No pending applications to review."
        : `Auto-reviewed ${result.reviewed}: ${result.approved} approved, ${result.rejected} rejected based on scheme conditions.`,
    );
    setView("applications");
    setStatusFilter("all");
  }

  function ApplicationCard({ s }: { s: Scholarship }) {
    const program = programs.find((p) => p.id === s.programId);
    const student = getStudent(s.studentId);
    return (
      <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 transition hover:border-[var(--line-strong)]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[0.7rem] font-bold text-white">
            {initials(student?.name ?? "?")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold tracking-[-0.02em]">{student?.name ?? s.studentId}</p>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              {s.appliedBy ? (
                <Badge tone={s.appliedBy === "parent" ? "info" : "neutral"}>
                  via {s.appliedBy}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {program?.name ?? s.type}
              {student ? ` · ${student.className}-${student.section}` : ""}
              {student?.admissionNo ? ` · ${student.admissionNo}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.03em] text-[var(--accent)]">
              {s.mode === "percentage" ? `${s.value}%` : formatINR(s.value)}
            </p>
            <p className="text-[0.65rem] font-semibold text-[var(--muted)]">
              {s.mode === "percentage" ? "waiver" : "credit"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3">
          <p>
            <span className="font-semibold text-[var(--ink-2)]">Basis:</span>{" "}
            {s.basis ? scholarshipBasisLabel(s.basis) : "—"}
            {s.qualifyingScore != null ? ` · score ${s.qualifyingScore}` : ""}
            {s.annualIncome != null ? ` · income ${formatINR(s.annualIncome)}` : ""}
          </p>
          <p>
            <span className="font-semibold text-[var(--ink-2)]">Validity:</span>{" "}
            {formatDate(s.effectiveFrom)} → {formatDate(s.expiresOn)}
          </p>
          <p className="truncate">
            <span className="font-semibold text-[var(--ink-2)]">Notes:</span> {s.notes || "—"}
          </p>
        </div>
        {s.reviewNotes ? (
          <p className="mt-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--accent-hover)]">
            {s.reviewNotes}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {student ? (
            <Link href={`/admin/students/${student.id}`}>
              <Button size="sm" variant="ghost">
                Student profile
              </Button>
            </Link>
          ) : null}
          {s.status === "pending" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() => {
                  const result = autoReviewScholarship(s.id);
                  if (result.ok) setReviewBanner(`Auto-${result.decision}: ${result.reason}`);
                  else setReviewBanner(result.error);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Auto-review
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  updateScholarshipStatus(s.id, "approved");
                  setReviewBanner("Application approved.");
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  updateScholarshipStatus(s.id, "rejected");
                  setReviewBanner("Application rejected.");
                }}
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Scholarships"
        description="Browse schemes like a map, open eligibility & awards, then review student applications in one place."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="soft" onClick={runAutoReviewAll}>
              <Sparkles className="h-4 w-4" /> Auto-review pending
            </Button>
            <Button type="button" onClick={() => openApplyForm()}>
              <Plus className="h-4 w-4" /> Apply for student
            </Button>
          </div>
        }
      />

      {reviewBanner ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{reviewBanner}</p>
          <button
            type="button"
            onClick={() => setReviewBanner(null)}
            className="shrink-0 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active schemes" value={String(stats.programs)} tone="accent" />
        <Stat label="Open seats" value={String(stats.openSeats)} hint={`${stats.parentApps} parent apps`} />
        <Stat label="Approved awards" value={String(stats.approved)} tone="success" />
        <Stat label="Pending review" value={String(stats.pending)} tone="danger" hint={`${stats.rejected} rejected`} />
      </div>

      {/* View switcher */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl border border-[var(--line)] bg-white p-1">
          <button
            type="button"
            onClick={() => {
              setView("schemes");
              setQ("");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              view === "schemes"
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Schemes map
          </button>
          <button
            type="button"
            onClick={() => {
              setView("applications");
              setSelectedProgramId(null);
              setQ("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              view === "applications"
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Applications
            {stats.pending > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                  view === "applications" ? "bg-white/20" : "bg-[var(--warn-soft)] text-[var(--warn)]"
                }`}
              >
                {stats.pending}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {view === "schemes" ? (
        <Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.07),rgba(36,91,255,0.04))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LayoutGrid className="h-4 w-4 text-[var(--accent)]" />
              {selected ? (
                <nav className="flex flex-wrap items-center gap-1.5 text-[var(--muted)]">
                  <button
                    type="button"
                    onClick={backToMap}
                    className="font-semibold text-[var(--accent)] hover:underline"
                  >
                    All schemes
                  </button>
                  <span>/</span>
                  <span className="text-[var(--ink)]">{selected.name}</span>
                </nav>
              ) : (
                <span>Scholarship schemes</span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[200px] sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                  className="pl-9"
                  placeholder="Search schemes…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              {!selected ? (
                <Select
                  className="w-full sm:w-48"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "all" | ScholarshipType)}
                >
                  <option value="all">All types</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!selected ? (
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
                    Choose a scheme
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Use <span className="font-semibold text-[var(--ink)]">Open</span> to see
                    conditions and awards, or apply a student right away.
                  </p>
                </div>

                {schemeMap.length === 0 ? (
                  <EmptyState
                    title="No schemes found"
                    description="Try another type filter or clear search."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {schemeMap.map((p) => {
                      const meta = TYPE_META[p.type];
                      const remaining = Math.max(0, p.maxSeats - p.seatsFilled);
                      const fill = Math.min(100, (p.seatsFilled / Math.max(1, p.maxSeats)) * 100);
                      const apps = appsByProgram.get(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span
                                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/90 shadow-sm ${meta.number}`}
                              >
                                <Award className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="font-bold tracking-[-0.02em]">{p.name}</p>
                                <span
                                  className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${meta.tone}`}
                                >
                                  {p.type}
                                </span>
                              </div>
                            </div>
                            <Badge tone={remaining > 0 ? "success" : "warning"}>
                              {remaining} left
                            </Badge>
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{p.summary}</p>

                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-[0.65rem] font-semibold text-[var(--muted)]">
                              <span>Seats filled</span>
                              <span>
                                {p.seatsFilled}/{p.maxSeats}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                              <div
                                className={`h-full rounded-full ${meta.bar}`}
                                style={{ width: `${Math.max(8, fill)}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-white/80 px-2 py-1 font-semibold text-[var(--ink-2)]">
                              {p.maxAwardLabel}
                            </span>
                            {apps ? (
                              <span className="rounded-lg bg-white/80 px-2 py-1 font-semibold text-[var(--muted)]">
                                {apps.pending} pending · {apps.approved} approved
                              </span>
                            ) : (
                              <span className="rounded-lg bg-white/80 px-2 py-1 font-semibold text-[var(--muted)]">
                                No apps yet
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openScheme(p.id)}
                              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                            >
                              <DoorOpen className="h-4 w-4" />
                              Open
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openApplyForm(p.id)}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className={`border-b border-[var(--line)] bg-gradient-to-br ${TYPE_META[selected.type].wash} px-4 py-5 sm:px-6`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={backToMap}
                        className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                        aria-label="Back to schemes"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                            {selected.name}
                          </p>
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-bold ${TYPE_META[selected.type].tone}`}
                          >
                            {selected.type}
                          </span>
                          <Badge tone={selected.active ? "success" : "neutral"}>
                            {selected.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{selected.summary}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => openApplyForm(selected.id)}>
                        <Users className="h-4 w-4" /> Apply for student
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                          setView("applications");
                          setProgramAppFilter(selected.id);
                          setSelectedProgramId(null);
                        }}
                      >
                        All applications <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                        <p className="text-xs text-[var(--muted)]">Awarded on</p>
                        <p className="mt-1 font-semibold">
                          {scholarshipBasisLabel(selected.basis)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                        <p className="text-xs text-[var(--muted)]">What it covers</p>
                        <p className="mt-1 font-semibold">{selected.covers}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                        <p className="text-xs text-[var(--muted)]">Maximum award</p>
                        <p className="mt-1 font-semibold text-[var(--accent)]">
                          {selected.maxAwardLabel}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                        <p className="text-xs text-[var(--muted)]">Seats</p>
                        <p className="mt-1 font-semibold">
                          {selected.seatsFilled}/{selected.maxSeats} filled ·{" "}
                          {Math.max(0, selected.maxSeats - selected.seatsFilled)} open
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-[var(--accent)]" />
                        <h3 className="font-semibold">Eligibility conditions</h3>
                      </div>
                      <ul className="space-y-2.5 rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                        {selected.conditions.map((c) => (
                          <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-[var(--accent)]" />
                        <h3 className="font-semibold">How much will be awarded</h3>
                      </div>
                      {selected.awardMode === "slab" && selected.awardSlabs ? (
                        <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
                          <table className="data">
                            <thead>
                              <tr>
                                <th>Band</th>
                                <th>Score / %</th>
                                <th>Award</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selected.awardSlabs.map((slab) => (
                                <tr key={slab.label}>
                                  <td className="font-medium">{slab.label}</td>
                                  <td>
                                    {slab.minScore}–{slab.maxScore}
                                  </td>
                                  <td className="font-semibold text-[var(--accent)]">
                                    {slab.mode === "percentage"
                                      ? `${slab.value}% waiver`
                                      : formatINR(slab.value)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="rounded-[1.25rem] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
                          {selected.awardMode === "percentage"
                            ? `${selected.awardValue}% fee waiver on ${selected.covers.toLowerCase()}.`
                            : `${formatINR(selected.awardValue)} annual credit toward ${selected.covers.toLowerCase()}.`}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[var(--accent)]" />
                        <h3 className="font-semibold">Documents required</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.documentsRequired.map((d) => (
                          <Badge key={d} tone="neutral">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Applications on this scheme</h3>
                      <span className="text-xs font-bold text-[var(--muted)]">
                        {relatedApps.length} total
                      </span>
                    </div>
                    <div className="space-y-3">
                      {relatedApps.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] px-4 py-10 text-center text-sm text-[var(--muted)]">
                          No applications yet for this scheme.
                        </div>
                      ) : (
                        relatedApps.slice(0, 6).map((s) => <ApplicationCard key={s.id} s={s} />)
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Surface>
      ) : (
        <div className="space-y-5">
          {openForm ? (
            <div ref={formRef}>
              <Surface className="overflow-hidden p-0">
                <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.1),transparent)] px-5 py-4">
                  <p className="text-sm font-bold">New scholarship application</p>
                  <p className="text-xs text-[var(--muted)]">
                    Award amount is calculated from the scheme’s conditions and slabs.
                  </p>
                </div>
                <div className="p-5 sm:p-6">
                  {!selectedProgramForForm || programs.length === 0 ? (
                    <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                      Scholarship schemes could not be loaded. Refresh and try again.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Scholarship scheme">
                          <Select
                            value={form.programId || selectedProgramForForm.id}
                            onChange={(e) => setForm({ ...form, programId: e.target.value })}
                          >
                            {programs.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Student">
                          <Select
                            value={form.studentId}
                            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                          >
                            {state.students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} · {s.className}-{s.section} · {s.admissionNo}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        {selectedProgramForForm.basis === "percentage_marks" ||
                        selectedProgramForForm.basis === "scholarship_test" ? (
                          <Field
                            label={
                              selectedProgramForForm.basis === "scholarship_test"
                                ? "Test score (/100)"
                                : "Previous year %"
                            }
                          >
                            <Input
                              type="number"
                              value={form.qualifyingScore}
                              onChange={(e) =>
                                setForm({ ...form, qualifyingScore: Number(e.target.value) })
                              }
                            />
                          </Field>
                        ) : null}

                        {selectedProgramForForm.basis === "need_based_quota" ? (
                          <Field label="Family annual income (₹)" hint="Must be below ₹3,00,000">
                            <Input
                              type="number"
                              value={form.annualIncome}
                              onChange={(e) =>
                                setForm({ ...form, annualIncome: Number(e.target.value) })
                              }
                            />
                          </Field>
                        ) : null}

                        <Field label="Effective from">
                          <Input
                            type="date"
                            value={form.effectiveFrom}
                            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                          />
                        </Field>
                        <Field label="Expires on">
                          <Input
                            type="date"
                            value={form.expiresOn}
                            onChange={(e) => setForm({ ...form, expiresOn: e.target.value })}
                          />
                        </Field>
                        <Field label="Notes">
                          <Input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Optional remarks for approver"
                          />
                        </Field>
                      </div>

                      <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
                        {(() => {
                          const needsScore =
                            selectedProgramForForm.basis === "percentage_marks" ||
                            selectedProgramForForm.basis === "scholarship_test";
                          const award = computeScholarshipAward(
                            selectedProgramForForm,
                            needsScore ? form.qualifyingScore : undefined,
                          );
                          if (
                            selectedProgramForForm.basis === "need_based_quota" &&
                            form.annualIncome >= 300000
                          ) {
                            return "Income exceeds EWS limit (₹3,00,000). Application cannot be submitted.";
                          }
                          if (needsScore && !award) {
                            return "Score is below the qualifying band for this scheme.";
                          }
                          if (award) {
                            return `Calculated award: ${
                              award.mode === "percentage"
                                ? `${award.value}% waiver`
                                : formatINR(award.value)
                            }${award.slab ? ` (${award.slab.label})` : ""}.`;
                          }
                          return `Award under this scheme: ${awardPreview(selectedProgramForForm)}.`;
                        })()}
                      </div>

                      {formError ? (
                        <p className="mt-3 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                          {formError}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={submitApplication}>
                          Submit for approval
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Surface>
            </div>
          ) : null}

          <Surface className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-bold">Application queue</p>
                <p className="text-xs text-[var(--muted)]">
                  Showing{" "}
                  <span className="font-semibold text-[var(--ink)]">{filteredApps.length}</span>{" "}
                  application{filteredApps.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-[200px] sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <Input
                    className="pl-9"
                    placeholder="Search student, scheme…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Select
                  className="w-full sm:w-40"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "all" | ScholarshipStatus)
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </Select>
                <Select
                  className="w-full sm:w-52"
                  value={programAppFilter}
                  onChange={(e) => setProgramAppFilter(e.target.value)}
                >
                  <option value="all">All schemes</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                {!openForm ? (
                  <Button type="button" variant="soft" onClick={() => openApplyForm()}>
                    <Plus className="h-4 w-4" /> Apply
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[var(--line)] px-4 py-3 sm:px-5">
              {(
                [
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === key
                      ? "bg-[var(--ink)] text-white"
                      : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {label}
                  {key === "pending" ? ` · ${stats.pending}` : ""}
                </button>
              ))}
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {filteredApps.length === 0 ? (
                <EmptyState
                  title="No applications in this view"
                  description="Try another status/scheme filter or apply for a student."
                />
              ) : (
                filteredApps.map((s) => <ApplicationCard key={s.id} s={s} />)
              )}
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}
