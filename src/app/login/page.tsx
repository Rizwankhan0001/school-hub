"use client";

import { type FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  ChevronDown,
  GraduationCap,
  Headphones,
  Shield,
  Users,
} from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { demoUsers, useApp } from "@/lib/store";
import type { Role, SessionUser } from "@/lib/types";

const PRIMARY_ROLES: Role[] = ["school_admin", "accountant", "parent"];

const copy: Record<
  Role,
  { title: string; reason: string; workspace: string; color: string }
> = {
  school_admin: {
    title: "School Admin",
    reason:
      "You run the school’s fee operations — students, fee plans, dues, reminders, and reports.",
    workspace: "Opens the school admin console",
    color: "bg-[var(--accent)]",
  },
  accountant: {
    title: "Accountant",
    reason:
      "You handle money only — student dues, payments, receipts, payroll for teachers & staff, late fees, and reports.",
    workspace: "Opens the finance workspace",
    color: "bg-[var(--accent-2)]",
  },
  parent: {
    title: "Parent",
    reason:
      "You pay for your child — see what’s due, pay online, download receipts, and get gentle alerts.",
    workspace: "Opens the parent portal",
    color: "bg-[var(--ink)]",
  },
  super_admin: {
    title: "Platform Admin",
    reason:
      "You operate EduFee360 itself — onboard schools, manage plans, and watch SaaS health.",
    workspace: "Opens the platform console",
    color: "bg-[var(--ink-2)]",
  },
  support_agent: {
    title: "Support Agent",
    reason: "You help parents and schools — tickets, receipts, and payment issues.",
    workspace: "Opens the support desk",
    color: "bg-[#334155]",
  },
  student: {
    title: "Student",
    reason: "View payment status and receipts for your own fees.",
    workspace: "Opens a limited student view",
    color: "bg-[#64748b]",
  },
};

function roleIcon(role: Role, className: string) {
  if (role === "accountant") return <Calculator className={className} />;
  if (role === "parent") return <Users className={className} />;
  if (role === "support_agent") return <Headphones className={className} />;
  if (role === "super_admin") return <Shield className={className} />;
  if (role === "school_admin") return <Building2 className={className} />;
  return <GraduationCap className={className} />;
}

function routeFor(user: SessionUser) {
  if (user.role === "parent" || user.role === "student") return "/parent";
  if (user.role === "super_admin") return "/platform";
  return "/admin";
}

function RoleCard({
  user,
  big,
  onPick,
}: {
  user: SessionUser;
  big?: boolean;
  onPick: () => void;
}) {
  const meta = copy[user.role];

  return (
    <button
      type="button"
      onClick={onPick}
      className={`group w-full rounded-[1.5rem] border border-[var(--line)] bg-white text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_-28px_rgba(10,12,16,0.35)] ${
        big ? "p-5" : "p-4"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`mt-0.5 grid shrink-0 place-items-center rounded-2xl text-white ${meta.color} ${
            big ? "h-12 w-12" : "h-10 w-10"
          }`}
        >
          {roleIcon(user.role, big ? "h-5 w-5" : "h-4 w-4")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`font-bold tracking-[-0.02em] ${big ? "text-base" : "text-sm"}`}>
              {meta.title}
            </span>
            <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
              Demo
            </span>
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-[var(--muted)]">
            {meta.reason}
          </span>
          <span className="mt-2 block break-all text-xs text-[var(--muted-2)]">
            {user.name} · {user.email}
            <span className="mt-1 block sm:mt-0 sm:inline">
              {" "}
              · password <span className="font-semibold">demo123</span>
            </span>
          </span>
          <span className="mt-1 block text-xs font-medium text-[var(--accent)]">{meta.workspace}</span>
        </span>
        <ArrowRight className="mt-1 hidden h-5 w-5 shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5 sm:block" />
      </div>
    </button>
  );
}

function LoginInner() {
  const {
    login,
    loginWithCredentials,
    loginWithPhonePassword,
    requestParentOtp,
    loginWithParentOtp,
    user,
    ready,
    accounts,
  } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const preferred = params.get("role") as Role | null;
  const [more, setMore] = useState(
    preferred === "super_admin" || preferred === "support_agent",
  );
  const [authTab, setAuthTab] = useState<"email" | "parent">(
    preferred === "parent" ? "parent" : "email",
  );
  const [parentMethod, setParentMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primary = useMemo(() => {
    const source = accounts.length ? accounts : demoUsers;
    const list = PRIMARY_ROLES.map((r) => source.find((u) => u.role === r && !u.createdAt)).filter(
      Boolean,
    ) as SessionUser[];
    if (!preferred || !PRIMARY_ROLES.includes(preferred)) return list;
    return [...list].sort((a, b) => Number(b.role === preferred) - Number(a.role === preferred));
  }, [preferred, accounts]);

  const extra = useMemo(() => {
    const source = accounts.length ? accounts : demoUsers;
    return source.filter((u) => !PRIMARY_ROLES.includes(u.role) && !u.createdAt);
  }, [accounts]);


  useEffect(() => {
    if (!ready || !user) return;
    router.replace(routeFor(user));
  }, [ready, user, router]);

  function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = loginWithCredentials(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(routeFor(result.user));
  }

  function onParentPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = loginWithPhonePassword(phone, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(routeFor(result.user));
  }

  function onRequestOtp() {
    setError(null);
    setOtpHint(null);
    const result = requestParentOtp(phone);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOtpHint(
      `OTP sent to ${result.maskedPhone}. Demo OTP: ${result.demoOtp}`,
    );
    setOtp(result.demoOtp);
  }

  function onParentOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = loginWithParentOtp(phone, otp);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(routeFor(result.user));
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="relative hidden w-[40%] overflow-hidden bg-[var(--ink)] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,166,126,0.35),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(36,91,255,0.2),transparent_50%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark grid h-10 w-10 place-items-center rounded-xl text-sm font-bold">
              E3
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.04em]">
              EduFee360
            </span>
          </Link>
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-[-0.04em]">
              Parents sign in
              <br />
              with school mobile.
            </p>
            <p className="mt-4 max-w-sm text-white/55">
              Use the phone number registered at school — password or one-time OTP. Staff still sign
              in with email.
            </p>
            <div className="mt-8 space-y-3 text-sm text-white/70">
              <p>
                <span className="font-semibold text-white">Demo parent:</span> +91 98765 43210 ·
                password demo123 · OTP 123456
              </p>
              <p>
                <span className="font-semibold text-white">New parent?</span> Activate portal access
                with your registered number.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?type=parent">
              <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
                Activate parent access
              </Button>
            </Link>
            <Link href="/register?type=school">
              <Button className="border border-white/15 bg-white/5 text-white hover:bg-white/10">
                Register school
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 py-10 sm:py-12">
        <div className="w-full max-w-lg animate-soft">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>

          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Parents: registered mobile + password or OTP. School staff: work email + password.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
            <Link
              href="/register?type=parent"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
            >
              Activate as Parent
            </Link>
            <Link
              href="/register?type=school"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
            >
              Register as School
            </Link>
          </div>

          <div className="mt-6 inline-flex rounded-2xl border border-[var(--line)] bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setAuthTab("parent");
                setError(null);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                authTab === "parent"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Parent (mobile)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("email");
                setError(null);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                authTab === "email"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Staff (email)
            </button>
          </div>

          {authTab === "parent" ? (
            <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-white p-5">
              <div className="mb-4 inline-flex rounded-xl bg-[var(--bg)] p-1">
                <button
                  type="button"
                  onClick={() => setParentMethod("password")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    parentMethod === "password"
                      ? "bg-white text-[var(--ink)] shadow-sm"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setParentMethod("otp")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    parentMethod === "otp"
                      ? "bg-white text-[var(--ink)] shadow-sm"
                      : "text-[var(--muted)]"
                  }`}
                >
                  OTP
                </button>
              </div>

              {parentMethod === "password" ? (
                <form onSubmit={onParentPasswordSubmit} className="space-y-3">
                  <Field
                    label="Registered mobile"
                    hint="Must match the number on your child’s school record"
                  >
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98xxx xxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Password" hint="Demo: demo123">
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>
                  {error ? (
                    <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" className="w-full">
                    Sign in as parent <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={onParentOtpSubmit} className="space-y-3">
                  <Field
                    label="Registered mobile"
                    hint="OTP works only for numbers already in school records"
                  >
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98xxx xxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="soft" onClick={onRequestOtp}>
                      Send OTP
                    </Button>
                  </div>
                  {otpHint ? (
                    <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-hover)]">
                      {otpHint}
                    </p>
                  ) : null}
                  <Field label="Enter OTP" hint="Demo OTP is 123456">
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </Field>
                  {error ? (
                    <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" className="w-full">
                    Verify OTP &amp; sign in <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}

              <p className="mt-4 text-center text-sm text-[var(--muted)]">
                First time?{" "}
                <Link
                  href="/register?type=parent"
                  className="font-semibold text-[var(--accent)]"
                >
                  Activate with school mobile
                </Link>
              </p>
            </div>
          ) : (
            <form
              onSubmit={onEmailSubmit}
              className="mt-4 space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-white p-5"
            >
              <Field label="Work email">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" hint="Demo accounts use password demo123">
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {error ? (
                <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full">
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="mt-10">
            <p className="text-sm font-semibold text-[var(--ink-2)]">Or try a demo role</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              No signup needed — click a role to explore that workspace.
            </p>
            <div className="mt-4 space-y-3">
              {primary.map((u) => (
                <RoleCard key={u.id} user={u} big onPick={() => login(u.id)} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Platform & support roles
              <ChevronDown className={`h-4 w-4 transition ${more ? "rotate-180" : ""}`} />
            </button>
            {more ? (
              <div className="mt-3 space-y-3">
                {extra.map((u) => (
                  <RoleCard key={u.id} user={u} onPick={() => login(u.id)} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <LoginInner />
    </Suspense>
  );
}
