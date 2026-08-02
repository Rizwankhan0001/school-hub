"use client";

import { Badge, Button, PageHeader, Surface } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

export default function GatewaysPage() {
  const { state, toggleGateway } = useApp();

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payment gateways"
        description="Razorpay, PayU, Cashfree, Stripe, Paytm — webhooks, reconciliation, refunds, and retry."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {state.gateways.map((g) => (
          <Surface key={g.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                  {g.name}
                </h2>
                <p className="mt-1 break-all text-xs text-[var(--muted)]">{g.webhookUrl}</p>
              </div>
              <Badge tone={g.enabled ? "success" : "neutral"}>
                {g.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-[var(--ink-soft)] px-2 py-3">
                <p className="font-semibold text-[var(--ink)]">
                  {g.autoReconcile ? "On" : "Off"}
                </p>
                <p className="text-[var(--muted)]">Reconcile</p>
              </div>
              <div className="rounded-xl bg-[var(--ink-soft)] px-2 py-3">
                <p className="font-semibold text-[var(--ink)]">{g.retryFailed ? "On" : "Off"}</p>
                <p className="text-[var(--muted)]">Retry</p>
              </div>
              <div className="rounded-xl bg-[var(--ink-soft)] px-2 py-3">
                <p className="font-semibold text-[var(--ink)]">
                  {g.refundsEnabled ? "On" : "Off"}
                </p>
                <p className="text-[var(--muted)]">Refunds</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                Last webhook:{" "}
                {g.lastWebhookAt ? formatDateTime(g.lastWebhookAt) : "Never"}
              </p>
              <Button size="sm" variant={g.enabled ? "ghost" : "primary"} onClick={() => toggleGateway(g.id)}>
                {g.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
