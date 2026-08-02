"use client";

import { useState } from "react";
import { Badge, Button, Field, Input, PageHeader, Select, Surface, Stat } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatINR, outstanding } from "@/lib/format";
import type { FineMode } from "@/lib/types";
import { uid } from "@/lib/format";

export default function FinesPage() {
  const { state, upsertFineRule, applyFinesToOverdue, metrics } = useApp();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "Custom fine",
    mode: "fixed" as FineMode,
    value: 100,
    graceDays: 3,
    active: true,
  });

  const totalFines = state.dues.reduce((s, d) => s + d.fine, 0);
  const overdueWithFine = state.dues.filter((d) => d.status === "overdue" && d.fine > 0).length;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Fine management"
        description="Fixed, daily, or percentage fines with grace days — apply to overdue installments."
        actions={
          <Button
            onClick={() => {
              const n = applyFinesToOverdue();
              setMsg(`Applied fine rules to ${n} overdue installment(s).`);
            }}
          >
            Apply to overdue
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Active fine rules" value={String(state.fineRules.filter((f) => f.active).length)} />
        <Stat label="Fines accrued" value={formatINR(totalFines)} tone="danger" />
        <Stat
          label="Overdue with fine"
          value={String(overdueWithFine)}
          tone="accent"
          hint={`Open overdue ${formatINR(metrics.overdue)}`}
        />
      </div>

      {msg ? (
        <p className="mb-4 rounded-xl bg-[#e3f6ea] px-4 py-3 text-sm text-[#067647]">{msg}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Surface className="p-5">
          <h2 className="font-semibold">Add / update rule</h2>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Mode">
              <Select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as FineMode })}
              >
                <option value="fixed">Fixed (₹ per delay)</option>
                <option value="daily">Daily (₹/day)</option>
                <option value="percentage">Percentage of pending</option>
              </Select>
            </Field>
            <Field label="Value">
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </Field>
            <Field label="Grace days">
              <Input
                type="number"
                value={form.graceDays}
                onChange={(e) => setForm({ ...form, graceDays: Number(e.target.value) })}
              />
            </Field>
            <Button
              onClick={() =>
                upsertFineRule({
                  id: uid("fine"),
                  ...form,
                })
              }
            >
              Save rule
            </Button>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Example: Fee ₹10,000 · 15 days delay · ₹10/day → Fine ₹150 · Total due ₹10,150
          </p>
        </Surface>

        <Surface>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-semibold">Configured rules</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mode</th>
                  <th>Value</th>
                  <th>Grace</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.fineRules.map((f) => (
                  <tr key={f.id}>
                    <td className="font-medium">{f.name}</td>
                    <td>{f.mode}</td>
                    <td>
                      {f.mode === "percentage" ? `${f.value}%` : formatINR(f.value)}
                      {f.mode === "daily" ? "/day" : ""}
                    </td>
                    <td>{f.graceDays}d</td>
                    <td>
                      <Badge tone={f.active ? "success" : "neutral"}>
                        {f.active ? "active" : "off"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => upsertFineRule({ ...f, active: !f.active })}
                      >
                        {f.active ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--line)] px-5 py-4">
            <h3 className="mb-2 text-sm font-semibold">Overdue installments</h3>
            <div className="space-y-2">
              {state.dues
                .filter((d) => d.status === "overdue")
                .map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <span>{d.installmentName}</span>
                    <span>
                      Fine {formatINR(d.fine)} · Due{" "}
                      {formatINR(outstanding(d.amount, d.fine, d.paidAmount))}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
