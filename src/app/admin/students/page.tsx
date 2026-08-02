"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";

export default function StudentsPage() {
  const { state, addStudent, updateStudent } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    admissionNo: "",
    name: "",
    className: "Class 5",
    section: "A",
    parentId: state.parents[0]?.id ?? "",
    parentName: state.parents[0]?.name ?? "",
    mobile: "",
    email: "",
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.students.filter((s) => {
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.admissionNo.toLowerCase().includes(term) ||
        s.className.toLowerCase().includes(term) ||
        s.parentName.toLowerCase().includes(term)
      );
    });
  }, [q, state.students]);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Student management"
        description="Create, update, transfer, and archive student fee profiles."
        actions={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Add student
          </Button>
        }
      />

      {open ? (
        <Surface className="mb-6 p-5">
          <h2 className="mb-4 font-semibold">New student</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Admission number">
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
                {["Class 1", "Class 3", "Class 5", "Class 8"].map((c) => (
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
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                if (!form.name || !form.admissionNo) return;
                addStudent(form);
                setOpen(false);
                setForm({
                  ...form,
                  admissionNo: "",
                  name: "",
                });
              }}
            >
              Save student
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Surface>
      ) : null}

      <Surface>
        <div className="border-b border-[var(--line)] p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-9"
              placeholder="Search name, admission no, class, parent"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No students found" description="Try another search or add a student." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-[var(--muted)]">{s.admissionNo}</p>
                    </td>
                    <td>
                      {s.className}-{s.section}
                    </td>
                    <td>{s.parentName}</td>
                    <td>
                      <p>{s.mobile}</p>
                      <p className="text-xs text-[var(--muted)]">{s.email}</p>
                    </td>
                    <td>
                      <Badge
                        tone={
                          s.status === "active"
                            ? "success"
                            : s.status === "transferred"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStudent(s.id, {
                              status: s.status === "active" ? "archived" : "active",
                            })
                          }
                        >
                          {s.status === "active" ? "Archive" : "Restore"}
                        </Button>
                        {s.status === "active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStudent(s.id, { status: "transferred" })}
                          >
                            Transfer
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}
