import type { DueStatus, InstallmentPlan, PaymentMethod, Role } from "./types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    super_admin: "Super Admin",
    school_admin: "School Admin",
    accountant: "Accountant",
    parent: "Parent",
    student: "Student",
    support_agent: "Support Agent",
  };
  return map[role];
}

export function planLabel(plan: InstallmentPlan): string {
  const map: Record<InstallmentPlan, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    half_yearly: "Half-Yearly",
    annual: "Annual",
  };
  return map[plan];
}

export function methodLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    upi: "UPI",
    card: "Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    cash: "Cash",
  };
  return map[method];
}

export function dueStatusLabel(status: DueStatus): string {
  const map: Record<DueStatus, string> = {
    upcoming: "Upcoming",
    due_today: "Due Today",
    overdue: "Overdue",
    paid: "Paid",
    partial: "Partial",
  };
  return map[status];
}

export function outstanding(amount: number, fine: number, paidAmount: number): number {
  return Math.max(0, amount + fine - paidAmount);
}

export function collectionRate(collected: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((collected / total) * 100);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function nextReceiptNo(existing: string[]): string {
  const nums = existing
    .map((r) => {
      const m = r.match(/(\d+)$/);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 12) + 1;
  return `REC-2026-${String(next).padStart(6, "0")}`;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
