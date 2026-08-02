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
import { formatDate, formatINR, planLabel } from "@/lib/format";
import type { InstallmentPlan } from "@/lib/types";

export default function InstallmentsPage() {
  const { state, addInstallment } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    className: "Class 5",
    plan: "quarterly" as InstallmentPlan,
    name: "Q1",
    amount: 10000,
    dueDate: "2026-04-10",
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Installment plans"
        description="Monthly, quarterly, half-yearly, or annual schedules with due dates."
        actions={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Add installment
          </Button>
        }
      />

      {open ? (
        <Surface className="mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <Field label="Plan">
              <Select
                value={form.plan}
                onChange={(e) =>
                  setForm({ ...form, plan: e.target.value as InstallmentPlan })
                }
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half-Yearly</option>
                <option value="annual">Annual</option>
              </Select>
            </Field>
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Q1 / Semester 1"
              />
            </Field>
            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                addInstallment(form);
                setOpen(false);
              }}
            >
              Save installment
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
                <th>Class</th>
                <th>Plan</th>
                <th>Installment</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {state.installments.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.className}</td>
                  <td>
                    <Badge tone="info">{planLabel(i.plan)}</Badge>
                  </td>
                  <td>{i.name}</td>
                  <td>{formatINR(i.amount)}</td>
                  <td>{formatDate(i.dueDate)}</td>
                  <td>{i.academicSession}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
