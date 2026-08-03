"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Cable,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  RefreshCw,
  Shield,
  Webhook,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Stat,
  Surface,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import type { PaymentGatewayConfig } from "@/lib/types";

const GATEWAY_META: Record<
  string,
  { wash: string; accent: string; blurb: string }
> = {
  Razorpay: {
    wash: "from-[rgba(0,166,126,0.16)] via-[rgba(0,166,126,0.05)] to-white",
    accent: "text-[var(--accent)]",
    blurb: "UPI, cards, netbanking — popular for Indian schools.",
  },
  PayU: {
    wash: "from-[rgba(36,91,255,0.14)] via-[rgba(36,91,255,0.04)] to-white",
    accent: "text-[var(--accent-2)]",
    blurb: "Broad payment methods with strong India coverage.",
  },
  Cashfree: {
    wash: "from-[rgba(212,146,48,0.14)] via-[rgba(212,146,48,0.04)] to-white",
    accent: "text-[var(--warn)]",
    blurb: "Fast settlements and subscription-friendly flows.",
  },
  Stripe: {
    wash: "from-[rgba(10,12,16,0.1)] via-[rgba(36,91,255,0.05)] to-white",
    accent: "text-[var(--ink)]",
    blurb: "Global cards and international parent payments.",
  },
  Paytm: {
    wash: "from-[rgba(0,166,126,0.1)] via-[rgba(36,91,255,0.06)] to-white",
    accent: "text-[var(--accent)]",
    blurb: "Wallet + UPI for parents already on Paytm.",
  },
};

function metaFor(name: string) {
  return (
    GATEWAY_META[name] ?? {
      wash: "from-[rgba(0,166,126,0.1)] to-white",
      accent: "text-[var(--accent)]",
      blurb: "Payment gateway for parent fee collection.",
    }
  );
}

export default function GatewaysPage() {
  const { state, toggleGateway } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const selected = state.gateways.find((g) => g.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const live = state.gateways.filter((g) => g.enabled).length;
    const withRefunds = state.gateways.filter((g) => g.refundsEnabled).length;
    const withRetry = state.gateways.filter((g) => g.retryFailed).length;
    return { total: state.gateways.length, live, withRefunds, withRetry };
  }, [state.gateways]);

  const paymentsByGateway = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const p of state.payments.filter((x) => x.status === "success")) {
      const entry = map.get(p.gateway) ?? { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += p.amount;
      map.set(p.gateway, entry);
    }
    return map;
  }, [state.payments]);

  function openGateway(id: string) {
    setSelectedId(id);
  }

  function onToggle(g: PaymentGatewayConfig) {
    toggleGateway(g.id);
    setBanner(`${g.name} ${g.enabled ? "disabled" : "enabled"}.`);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Payment apps"
        description="Enable the gateways parents can use — webhooks, auto-reconcile, retries, and refunds."
        actions={
          <Link href="/admin/payments">
            <Button variant="soft">
              Payments ledger <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {banner ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-[1.25rem] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
          <p>{banner}</p>
          <button type="button" onClick={() => setBanner(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gateways" value={String(stats.total)} />
        <Stat label="Live now" value={String(stats.live)} tone="success" />
        <Stat label="Refunds ready" value={String(stats.withRefunds)} tone="accent" />
        <Stat label="Retry enabled" value={String(stats.withRetry)} />
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(0,166,126,0.08),rgba(36,91,255,0.05))] px-4 py-3.5 sm:px-5">
          <Cable className="h-4 w-4 text-[var(--accent)]" />
          {selected ? (
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                All payment apps
              </button>
              <span>/</span>
              <span className="font-semibold text-[var(--ink)]">{selected.name}</span>
            </nav>
          ) : (
            <p className="text-sm font-bold">Gateway map</p>
          )}
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
                  Choose a payment app
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Use <span className="font-semibold text-[var(--ink)]">Open</span> for details, or
                  enable/disable instantly.
                </p>
              </div>

              {state.gateways.length === 0 ? (
                <EmptyState title="No gateways configured" description="Add gateways in seed/config." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {state.gateways.map((g) => {
                    const meta = metaFor(g.name);
                    const usage = paymentsByGateway.get(g.name);
                    return (
                      <div
                        key={g.id}
                        className={`overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-gradient-to-br ${meta.wash} p-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_22px_48px_-30px_rgba(10,12,16,0.45)]`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.03em]">
                              {g.name}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">{meta.blurb}</p>
                          </div>
                          <Badge tone={g.enabled ? "success" : "neutral"}>
                            {g.enabled ? "Live" : "Off"}
                          </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-white/80 px-2 py-2.5">
                            <p className="font-bold">{g.autoReconcile ? "On" : "Off"}</p>
                            <p className="text-[var(--muted)]">Reconcile</p>
                          </div>
                          <div className="rounded-xl bg-white/80 px-2 py-2.5">
                            <p className="font-bold">{g.retryFailed ? "On" : "Off"}</p>
                            <p className="text-[var(--muted)]">Retry</p>
                          </div>
                          <div className="rounded-xl bg-white/80 px-2 py-2.5">
                            <p className="font-bold">{g.refundsEnabled ? "On" : "Off"}</p>
                            <p className="text-[var(--muted)]">Refunds</p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-[var(--muted)]">
                          {usage
                            ? `${usage.count} successful payments in ledger`
                            : "No successful payments yet"}
                          {" · "}
                          Last webhook:{" "}
                          {g.lastWebhookAt ? formatDateTime(g.lastWebhookAt) : "Never"}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openGateway(g.id)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)]"
                          >
                            <DoorOpen className="h-4 w-4" />
                            Open
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggle(g)}
                            className="rounded-xl bg-[var(--ink)] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)]"
                          >
                            {g.enabled ? "Disable" : "Enable"}
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
                className={`border-b border-[var(--line)] bg-gradient-to-br ${metaFor(selected.name).wash} px-4 py-5 sm:px-6`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)]"
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
                          {selected.name}
                        </p>
                        <Badge tone={selected.enabled ? "success" : "neutral"}>
                          {selected.enabled ? "Live" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                        {metaFor(selected.name).blurb}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={selected.enabled ? "soft" : "primary"}
                    onClick={() => onToggle(selected)}
                  >
                    {selected.enabled ? "Disable gateway" : "Enable gateway"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <div className="flex items-center gap-2 text-[var(--accent)]">
                    <RefreshCw className="h-4 w-4" />
                    <p className="text-sm font-bold text-[var(--ink)]">Auto-reconcile</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {selected.autoReconcile ? "On" : "Off"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Matches gateway settlements to school receipts automatically.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <div className="flex items-center gap-2 text-[var(--warn)]">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-bold text-[var(--ink)]">Retry failed</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{selected.retryFailed ? "On" : "Off"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Re-attempts failed parent payments where allowed.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <div className="flex items-center gap-2 text-[var(--accent-2)]">
                    <Shield className="h-4 w-4" />
                    <p className="text-sm font-bold text-[var(--ink)]">Refunds</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {selected.refundsEnabled ? "On" : "Off"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Allows refunds from the payment ledger when needed.
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-[var(--line)] px-4 py-5 sm:px-6">
                <div className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                  <Webhook className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">Webhook endpoint</p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                      {selected.webhookUrl}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Last webhook:{" "}
                      {selected.lastWebhookAt
                        ? formatDateTime(selected.lastWebhookAt)
                        : "Never received"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="text-sm font-bold">Ledger activity</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {paymentsByGateway.get(selected.name)
                      ? `${paymentsByGateway.get(selected.name)!.count} successful payment(s) recorded via ${selected.name} in this demo ledger.`
                      : `No successful ${selected.name} payments in the demo ledger yet.`}
                  </p>
                  <Link
                    href="/admin/payments"
                    className="mt-3 inline-flex text-sm font-bold text-[var(--accent)] hover:underline"
                  >
                    Open payments ledger →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </div>
  );
}
