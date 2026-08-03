"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Plus,
} from "lucide-react";
import {
  Badge,
  Button,
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
  evaluateScholarshipEligibility,
  formatDate,
  formatINR,
  scholarshipBasisLabel,
} from "@/lib/format";
import type { ScholarshipProgram, SportsAchievementLevel } from "@/lib/types";

function awardPreview(program: ScholarshipProgram) {
  if (program.awardMode === "percentage") return `${program.awardValue}% waiver`;
  if (program.awardMode === "fixed") return formatINR(program.awardValue);
  return program.maxAwardLabel;
}

export default function ParentScholarshipsPage() {
  const { user, state, getParentStudents, applyScholarshipAsParent } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const programs = (state.scholarshipPrograms ?? []).filter((p) => p.active);
  const studentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);

  const myApps = useMemo(
    () => state.scholarships.filter((s) => studentIds.has(s.studentId)),
    [state.scholarships, studentIds],
  );

  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id ?? "");
  const [openForm, setOpenForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    qualifyingScore: 90,
    annualIncome: 250000,
    sportsLevel: "" as "" | SportsAchievementLevel,
    staffChildConfirmed: false,
    governmentSanctionConfirmed: false,
    documentsConfirmed: false,
    notes: "",
  });

  const selected =
    programs.find((p) => p.id === selectedProgramId) ?? programs[0] ?? null;

  const stats = useMemo(() => {
    const pending = myApps.filter((s) => s.status === "pending").length;
    const approved = myApps.filter((s) => s.status === "approved").length;
    return { pending, approved, total: myApps.length };
  }, [myApps]);

  function openApply(programId: string) {
    setSelectedProgramId(programId);
    setForm((f) => ({
      ...f,
      studentId: f.studentId || students[0]?.id || "",
      documentsConfirmed: false,
      notes: "",
    }));
    setFormError(null);
    setFormSuccess(null);
    setOpenForm(true);
  }

  function submit() {
    setFormError(null);
    setFormSuccess(null);
    const program = programs.find((p) => p.id === selectedProgramId) ?? programs[0];
    if (!program) {
      setFormError("No scholarship scheme available.");
      return;
    }
    if (!form.studentId) {
      setFormError("Please choose a child.");
      return;
    }

    const needsScore =
      program.basis === "percentage_marks" || program.basis === "scholarship_test";
    const award = computeScholarshipAward(
      program,
      needsScore ? form.qualifyingScore : undefined,
    );

    let mode: "percentage" | "fixed" = "percentage";
    let value = program.awardValue;
    if (award) {
      mode = award.mode;
      value = award.value;
    } else if (program.awardMode === "fixed") {
      mode = "fixed";
      value = program.awardValue;
    }

    const preview = evaluateScholarshipEligibility(program, {
      qualifyingScore: needsScore ? form.qualifyingScore : undefined,
      annualIncome: program.basis === "need_based_quota" ? form.annualIncome : undefined,
      sportsLevel: form.sportsLevel || undefined,
      staffChildConfirmed: form.staffChildConfirmed,
      governmentSanctionConfirmed: form.governmentSanctionConfirmed,
      documentsConfirmed: form.documentsConfirmed,
      seatsAvailable: program.seatsFilled < program.maxSeats,
    });

    const result = applyScholarshipAsParent({
      studentId: form.studentId,
      programId: program.id,
      type: program.type,
      basis: program.basis,
      mode,
      value,
      qualifyingScore: needsScore ? form.qualifyingScore : undefined,
      annualIncome: program.basis === "need_based_quota" ? form.annualIncome : undefined,
      sportsLevel: form.sportsLevel || undefined,
      staffChildConfirmed:
        program.basis === "staff_child" ? form.staffChildConfirmed : undefined,
      governmentSanctionConfirmed:
        program.basis === "government_quota" ? form.governmentSanctionConfirmed : undefined,
      documentsConfirmed: form.documentsConfirmed,
      effectiveFrom: "2025-04-01",
      expiresOn: "2026-03-31",
      notes:
        form.notes.trim() ||
        `Parent application for ${program.name}. Eligibility preview: ${preview.reason}`,
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setOpenForm(false);
    setFormSuccess(
      "Application submitted. The school will auto-check it against scheme conditions during review.",
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Scholarships"
        description="Browse school schemes and apply for your child. Approvals follow each scheme’s conditions."
        actions={
          selected ? (
            <Button type="button" onClick={() => openApply(selected.id)}>
              <Plus className="h-4 w-4" /> Apply now
            </Button>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Your applications" value={String(stats.total)} />
        <Stat label="Pending review" value={String(stats.pending)} tone="danger" />
        <Stat label="Approved" value={String(stats.approved)} tone="success" />
      </div>

      {formSuccess ? (
        <Surface className="mb-6 border-[var(--success)] bg-[var(--success-soft)] p-4 text-sm text-[var(--success)]">
          {formSuccess}
        </Surface>
      ) : null}

      {openForm && selected ? (
        <Surface className="mb-6 p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-[-0.01em]">
            Apply — {selected.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Fill details matching the scheme rules. School staff can auto-approve or reject
            after condition checks.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Child">
              <Select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.className}-{s.section}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Scheme">
              <Select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            {selected.basis === "percentage_marks" || selected.basis === "scholarship_test" ? (
              <Field
                label={
                  selected.basis === "scholarship_test"
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

            {selected.basis === "need_based_quota" ? (
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

            {selected.basis === "sports_achievement" ? (
              <Field label="Sports achievement level">
                <Select
                  value={form.sportsLevel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sportsLevel: e.target.value as "" | SportsAchievementLevel,
                    })
                  }
                >
                  <option value="">Select level</option>
                  <option value="district">District</option>
                  <option value="state">State</option>
                  <option value="national">National</option>
                </Select>
              </Field>
            ) : null}

            {selected.basis === "staff_child" ? (
              <Field label="Staff confirmation">
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.staffChildConfirmed}
                    onChange={(e) =>
                      setForm({ ...form, staffChildConfirmed: e.target.checked })
                    }
                  />
                  <span>I confirm I am a full-time staff member of this school.</span>
                </label>
              </Field>
            ) : null}

            {selected.basis === "government_quota" ? (
              <Field label="Sanction letter">
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.governmentSanctionConfirmed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        governmentSanctionConfirmed: e.target.checked,
                      })
                    }
                  />
                  <span>I have a valid government sanction letter for this session.</span>
                </label>
              </Field>
            ) : null}

            <Field label="Notes (optional)">
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything the school should know"
              />
            </Field>
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.documentsConfirmed}
              onChange={(e) =>
                setForm({ ...form, documentsConfirmed: e.target.checked })
              }
            />
            <span>
              I have the required documents ready: {selected.documentsRequired.join(", ")}.
            </span>
          </label>

          <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
            {(() => {
              const needsScore =
                selected.basis === "percentage_marks" ||
                selected.basis === "scholarship_test";
              const preview = evaluateScholarshipEligibility(selected, {
                qualifyingScore: needsScore ? form.qualifyingScore : undefined,
                annualIncome:
                  selected.basis === "need_based_quota" ? form.annualIncome : undefined,
                sportsLevel: form.sportsLevel || undefined,
                staffChildConfirmed: form.staffChildConfirmed,
                governmentSanctionConfirmed: form.governmentSanctionConfirmed,
                documentsConfirmed: form.documentsConfirmed,
                seatsAvailable: selected.seatsFilled < selected.maxSeats,
              });
              return (
                <div>
                  <p className="font-semibold">Condition preview</p>
                  <p className="mt-1">{preview.reason}</p>
                  <ul className="mt-2 space-y-1">
                    {preview.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                            c.passed ? "text-[var(--success)]" : "text-[var(--danger)]"
                          }`}
                        />
                        <span>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          {formError ? (
            <p className="mt-3 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {formError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={submit}>
              Submit application
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            Available schemes
          </h2>
          {programs.map((p) => {
            const active = p.id === selected?.id;
            const remaining = Math.max(0, p.maxSeats - p.seatsFilled);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProgramId(p.id)}
                className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-white shadow-[0_18px_36px_-28px_rgba(0,166,126,0.55)]"
                    : "border-[var(--line)] bg-white/70 hover:border-[var(--line-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold tracking-[-0.02em]">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {scholarshipBasisLabel(p.basis)}
                    </p>
                  </div>
                  <Badge tone="success">{remaining} seats</Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">{p.summary}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--accent)]">
                  {p.maxAwardLabel}
                </p>
              </button>
            );
          })}
        </div>

        {selected ? (
          <Surface className="overflow-hidden">
            <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.1),rgba(36,91,255,0.08))] px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-white">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                    {selected.type}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                    {selected.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">{selected.summary}</p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="font-semibold">Eligibility</h3>
                </div>
                <ul className="space-y-2">
                  {selected.conditions.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
                Award: {awardPreview(selected)} · Covers {selected.covers.toLowerCase()}
              </p>
              <Button type="button" className="w-full sm:w-auto" onClick={() => openApply(selected.id)}>
                Apply for my child
              </Button>
            </div>
          </Surface>
        ) : null}
      </div>

      <Surface className="mt-6 p-5">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Your applications</h2>
        <div className="mt-4 space-y-3">
          {myApps.length === 0 ? (
            <p className="rounded-2xl bg-[var(--bg)] px-4 py-6 text-sm text-[var(--muted)]">
              No applications yet. Pick a scheme above to apply.
            </p>
          ) : (
            myApps.map((s) => {
              const program = programs.find((p) => p.id === s.programId);
              const student = students.find((st) => st.id === s.studentId);
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[var(--line)] px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{program?.name ?? s.type}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {student?.name} · {formatDate(s.effectiveFrom)} →{" "}
                        {formatDate(s.expiresOn)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        s.status === "approved"
                          ? "success"
                          : s.status === "pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {s.mode === "percentage" ? `${s.value}% waiver` : formatINR(s.value)}
                  </p>
                  {s.reviewNotes ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">{s.reviewNotes}</p>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--muted)]">{s.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Surface>
    </div>
  );
}
