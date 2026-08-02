"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { formatDate, formatINR } from "@/lib/format";
import type { ScholarshipType } from "@/lib/types";

export default function ScholarshipsPage() {
  const { state, getStudent, addScholarship, updateScholarshipStatus } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: state.students[0]?.id ?? "",
    type: "Merit Based" as ScholarshipType,
    mode: "percentage" as "percentage" | "fixed",
    value: 20,
    effectiveFrom: "2025-04-01",
    expiresOn: "2026-03-31",
    notes: "",
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Scholarship management"
        description="Merit, sports, staff-child, need-based and government waivers with approval workflow."
        actions={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> New scholarship
          </Button>
        }
      />

      {open ? (
        <Surface className="mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Student">
              <Select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ScholarshipType })}
              >
                {(
                  [
                    "Merit Based",
                    "Sports Quota",
                    "Staff Child",
                    "Need Based",
                    "Government Sponsored",
                  ] as ScholarshipType[]
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Mode">
              <Select
                value={form.mode}
                onChange={(e) =>
                  setForm({ ...form, mode: e.target.value as "percentage" | "fixed" })
                }
              >
                <option value="percentage">Percentage waiver</option>
                <option value="fixed">Fixed amount</option>
              </Select>
            </Field>
            <Field label={form.mode === "percentage" ? "Percent" : "Amount (₹)"}>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </Field>
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
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                addScholarship(form);
                setOpen(false);
              }}
            >
              Submit for approval
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      <Surface>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Benefit</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.scholarships.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{getStudent(s.studentId)?.name}</td>
                  <td>{s.type}</td>
                  <td>
                    {s.mode === "percentage" ? `${s.value}% waiver` : formatINR(s.value)}
                  </td>
                  <td>
                    {formatDate(s.effectiveFrom)} → {formatDate(s.expiresOn)}
                  </td>
                  <td>
                    <Badge
                      tone={
                        s.status === "approved"
                          ? "success"
                          : s.status === "pending"
                            ? "warning"
                            : s.status === "rejected"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td>
                    {s.status === "pending" ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => updateScholarshipStatus(s.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateScholarshipStatus(s.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">{s.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
