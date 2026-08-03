"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Home,
  Mail,
  MapPin,
  Phone,
  UserRound,
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
import { formatDate, formatINR, outstanding } from "@/lib/format";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const { state, getStudent, updateStudent } = useApp();
  const student = getStudent(params.id);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState(() => ({
    name: student?.name ?? "",
    className: student?.className ?? "Class 1",
    section: student?.section ?? "A",
    rollNo: student?.rollNo ?? "",
    gender: student?.gender ?? "Male",
    dateOfBirth: student?.dateOfBirth ?? "",
    bloodGroup: student?.bloodGroup ?? "",
    address: student?.address ?? "",
    house: student?.house ?? "",
    dateOfJoining: student?.dateOfJoining ?? "",
    emergencyContact: student?.emergencyContact ?? "",
    remarks: student?.remarks ?? "",
    mobile: student?.mobile ?? "",
    email: student?.email ?? "",
    parentName: student?.parentName ?? "",
  }));

  const dues = useMemo(
    () => state.dues.filter((d) => d.studentId === params.id),
    [state.dues, params.id],
  );
  const openAmount = dues
    .filter((d) => d.status !== "paid")
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const scholarships = state.scholarships.filter((s) => s.studentId === params.id);
  const payments = state.payments.filter((p) => p.studentId === params.id).slice(0, 5);

  if (!student) {
    return (
      <div className="animate-rise">
        <PageHeader title="Student not found" description="That profile is missing from the database." />
        <Link href="/admin/students">
          <Button variant="soft">
            <ArrowLeft className="h-4 w-4" /> Back to students
          </Button>
        </Link>
      </div>
    );
  }

  function save() {
    updateStudent(student!.id, {
      name: form.name.trim() || student!.name,
      className: form.className,
      section: form.section,
      rollNo: form.rollNo,
      gender: form.gender as "Male" | "Female" | "Other",
      dateOfBirth: form.dateOfBirth || undefined,
      bloodGroup: form.bloodGroup || undefined,
      address: form.address || undefined,
      house: form.house || undefined,
      dateOfJoining: form.dateOfJoining || undefined,
      emergencyContact: form.emergencyContact || undefined,
      remarks: form.remarks || undefined,
      mobile: form.mobile,
      email: form.email,
      parentName: form.parentName,
    });
    setEditing(false);
    setMsg("Student profile updated.");
  }

  const initials =
    student.avatarInitials ||
    student.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase();

  return (
    <div className="animate-rise">
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> All students
        </Link>
      </div>

      <Surface className="mb-6 overflow-hidden bg-[linear-gradient(135deg,rgba(0,166,126,0.14),rgba(36,91,255,0.08),transparent)] p-0">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.25rem] bg-[var(--ink)] text-lg font-bold text-white">
                {initials}
              </span>
              <div>
                <div className="flex flex-wrap gap-2">
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
                  <Badge tone="neutral">{student.academicSession}</Badge>
                  {student.house ? <Badge tone="info">{student.house} house</Badge> : null}
                </div>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                  {student.name}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Student ID <span className="font-semibold text-[var(--ink)]">{student.admissionNo}</span>
                  {" · "}
                  {student.className}-{student.section}
                  {student.rollNo ? ` · Roll ${student.rollNo}` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-2)]">System ref {student.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!editing ? (
                <Button type="button" variant="soft" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button type="button" onClick={save}>
                    Save changes
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
              {student.status === "active" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => updateStudent(student.id, { status: "archived" })}
                >
                  Archive
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => updateStudent(student.id, { status: "active" })}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        </div>
      </Surface>

      {msg ? (
        <p className="mb-4 rounded-xl bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]">
          {msg}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Academic details</h2>
            {editing ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Class">
                  <Select
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                  >
                    {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Section">
                  <Select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  >
                    {["A", "B", "C"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Roll no.">
                  <Input
                    value={form.rollNo}
                    onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                  />
                </Field>
                <Field label="House">
                  <Input
                    value={form.house}
                    onChange={(e) => setForm({ ...form, house: e.target.value })}
                  />
                </Field>
                <Field label="Date of joining">
                  <Input
                    type="date"
                    value={form.dateOfJoining}
                    onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info icon={BookOpen} label="Class / section" value={`${student.className}-${student.section}`} />
                <Info icon={UserRound} label="Roll no." value={student.rollNo || "—"} />
                <Info icon={Home} label="House" value={student.house || "—"} />
                <Info
                  icon={CalendarDays}
                  label="Joined"
                  value={student.dateOfJoining ? formatDate(student.dateOfJoining) : "—"}
                />
              </div>
            )}
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Personal details</h2>
            {editing ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Gender">
                  <Select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as "Male" | "Female" | "Other" })}
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
                  />
                </Field>
                <Field label="Emergency contact">
                  <Input
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Field>
                <Field label="Remarks">
                  <Input
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Gender" value={student.gender || "—"} />
                <Info
                  label="Date of birth"
                  value={student.dateOfBirth ? formatDate(student.dateOfBirth) : "—"}
                />
                <Info label="Blood group" value={student.bloodGroup || "—"} />
                <Info label="Emergency contact" value={student.emergencyContact || "—"} />
                <Info icon={MapPin} label="Address" value={student.address || "—"} />
                <Info label="Remarks" value={student.remarks || "—"} />
              </div>
            )}
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Parent / guardian</h2>
            {editing ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Parent name">
                  <Input
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  />
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
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Name" value={student.parentName} />
                <Info icon={Phone} label="Mobile" value={student.mobile} />
                <Info icon={Mail} label="Email" value={student.email} />
                <Info label="Parent record" value={student.parentId} />
              </div>
            )}
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Fee snapshot</h2>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
              {formatINR(openAmount)}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">Open dues outstanding</p>
            <div className="mt-4 space-y-2">
              {dues.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <span>
                    {d.installmentName}
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{d.status}</span>
                  </span>
                  <span className="font-semibold">
                    {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                  </span>
                </div>
              ))}
              {dues.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No fee dues linked yet.</p>
              ) : null}
            </div>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Scholarships</h2>
            <div className="mt-3 space-y-2">
              {scholarships.map((s) => (
                <div key={s.id} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{s.type}</p>
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
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {s.mode === "percentage" ? `${s.value}%` : formatINR(s.value)}
                  </p>
                </div>
              ))}
              {scholarships.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No scholarship applications.</p>
              ) : null}
            </div>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Recent payments</h2>
            <div className="mt-3 space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <span>
                    {formatDate(p.paidAt)}
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{p.method}</span>
                  </span>
                  <span className="font-semibold">{formatINR(p.amount)}</span>
                </div>
              ))}
              {payments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No payments recorded yet.</p>
              ) : null}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Phone;
}) {
  return (
    <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-relaxed">{value}</p>
    </div>
  );
}
