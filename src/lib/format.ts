import type {
  DueStatus,
  InstallmentPlan,
  PaymentMethod,
  Role,
  ScholarshipAwardSlab,
  ScholarshipBasis,
  ScholarshipProgram,
} from "./types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Digits-only phone compare (handles +91, spaces, dashes) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function maskPhone(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length < 4) return phone;
  return `******${d.slice(-4)}`;
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

/** Payable total and per-EMI amount for a class fee structure under a payment option */
export function computeFeePaymentBreakdown(
  annualTotal: number,
  option: { discountPercent: number; surchargePercent: number; installments: number },
) {
  const afterDiscount = Math.round(annualTotal * (1 - option.discountPercent / 100));
  const payable = Math.round(afterDiscount * (1 + option.surchargePercent / 100));
  const saved = annualTotal - afterDiscount;
  const perInstallment = Math.round(payable / option.installments);
  return { afterDiscount, payable, saved, perInstallment };
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

export function scholarshipBasisLabel(basis: ScholarshipBasis): string {
  const map: Record<ScholarshipBasis, string> = {
    percentage_marks: "Percentage / marks basis",
    scholarship_test: "Scholarship test",
    need_based_quota: "Need-based / EWS quota",
    sports_achievement: "Sports achievement",
    staff_child: "Staff-child quota",
    government_quota: "Government sponsored",
  };
  return map[basis];
}

export function computeScholarshipAward(
  program: ScholarshipProgram,
  score?: number,
): { mode: "percentage" | "fixed"; value: number; slab?: ScholarshipAwardSlab } | null {
  if (program.awardMode === "percentage" || program.awardMode === "fixed") {
    return { mode: program.awardMode, value: program.awardValue };
  }
  if (!program.awardSlabs?.length || score == null) return null;
  const slab = program.awardSlabs.find((s) => score >= s.minScore && score <= s.maxScore);
  if (!slab) return null;
  return { mode: slab.mode, value: slab.value, slab };
}

export type ScholarshipEligibilityInput = {
  qualifyingScore?: number;
  annualIncome?: number;
  sportsLevel?: "district" | "state" | "national";
  staffChildConfirmed?: boolean;
  governmentSanctionConfirmed?: boolean;
  documentsConfirmed?: boolean;
  seatsAvailable?: boolean;
};

export type ScholarshipEligibilityCheck = {
  label: string;
  passed: boolean;
};

export type ScholarshipReviewResult = {
  eligible: boolean;
  decision: "approved" | "rejected";
  mode: "percentage" | "fixed";
  value: number;
  reason: string;
  checks: ScholarshipEligibilityCheck[];
};

export function evaluateScholarshipEligibility(
  program: ScholarshipProgram,
  input: ScholarshipEligibilityInput,
): ScholarshipReviewResult {
  const checks: ScholarshipEligibilityCheck[] = [];
  const seatsOk = input.seatsAvailable !== false;
  checks.push({
    label: `Open seats available (${Math.max(0, program.maxSeats - program.seatsFilled)} left)`,
    passed: seatsOk,
  });

  checks.push({
    label: "Required documents declared as available",
    passed: Boolean(input.documentsConfirmed),
  });

  let award = computeScholarshipAward(program, input.qualifyingScore);

  if (program.basis === "percentage_marks") {
    const score = input.qualifyingScore ?? 0;
    checks.push({
      label: "Previous year aggregate at least 85%",
      passed: score >= 85,
    });
    checks.push({
      label: "Score falls in a merit award slab",
      passed: award != null && program.awardMode === "slab",
    });
  } else if (program.basis === "scholarship_test") {
    const score = input.qualifyingScore ?? 0;
    checks.push({
      label: "Scholarship test score at least 60/100",
      passed: score >= 60,
    });
    checks.push({
      label: "Score falls in a test award slab",
      passed: award != null && program.awardMode === "slab",
    });
  } else if (program.basis === "need_based_quota") {
    const income = input.annualIncome ?? Number.POSITIVE_INFINITY;
    checks.push({
      label: "Family annual income below ₹3,00,000",
      passed: income < 300000,
    });
    award = computeScholarshipAward(program);
  } else if (program.basis === "sports_achievement") {
    const levelOk = Boolean(input.sportsLevel);
    checks.push({
      label: "Verified district / state / national sports achievement declared",
      passed: levelOk,
    });
    award = computeScholarshipAward(program);
  } else if (program.basis === "staff_child") {
    checks.push({
      label: "Parent confirmed as full-time school staff",
      passed: Boolean(input.staffChildConfirmed),
    });
    award = computeScholarshipAward(program);
  } else if (program.basis === "government_quota") {
    checks.push({
      label: "Government sanction letter declared",
      passed: Boolean(input.governmentSanctionConfirmed),
    });
    award = computeScholarshipAward(program);
  }

  if (!award) {
    award = { mode: "percentage", value: 0 };
  }

  const eligible = checks.every((c) => c.passed);
  const failed = checks.filter((c) => !c.passed).map((c) => c.label);
  const reason = eligible
    ? `Meets all scheme conditions. Award: ${
        award.mode === "percentage" ? `${award.value}% waiver` : formatINR(award.value)
      }.`
    : `Rejected — failed: ${failed.join("; ")}.`;

  return {
    eligible,
    decision: eligible ? "approved" : "rejected",
    mode: award.mode,
    value: award.value,
    reason,
    checks,
  };
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
