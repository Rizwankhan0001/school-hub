"use client";

import { useState } from "react";
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
import { formatDateTime } from "@/lib/format";

export default function ParentSupportPage() {
  const { user, getParentStudents, state, createTicket } = useApp();
  const students = getParentStudents(user?.parentId ?? "");
  const mine = state.tickets.filter((t) => t.parentId === user?.parentId);
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    subject: "",
    category: "payment" as "payment" | "receipt" | "scholarship" | "general",
    description: "",
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Support"
        description="Raise tickets for payments, receipts, scholarships, or general help."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="font-semibold">New ticket</h2>
          <div className="mt-4 space-y-3">
            <Field label="Child">
              <Select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as typeof form.category,
                  })
                }
              >
                <option value="payment">payment</option>
                <option value="receipt">receipt</option>
                <option value="scholarship">scholarship</option>
                <option value="general">general</option>
              </Select>
            </Field>
            <Field label="Subject">
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Button
              onClick={() => {
                if (!form.subject.trim()) return;
                createTicket({
                  ...form,
                  parentId: user?.parentId,
                });
                setForm({ ...form, subject: "", description: "" });
              }}
            >
              Submit ticket
            </Button>
          </div>
        </Surface>

        <Surface className="p-5">
          <h2 className="font-semibold">Your tickets</h2>
          <div className="mt-4 space-y-3">
            {mine.map((t) => (
              <div key={t.id} className="rounded-xl border border-[var(--line)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <Badge
                    tone={
                      t.status === "resolved" || t.status === "closed"
                        ? "success"
                        : t.status === "in_progress"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{t.description}</p>
              </div>
            ))}
            {mine.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No tickets yet.</p>
            ) : null}
          </div>
        </Surface>
      </div>
    </div>
  );
}
