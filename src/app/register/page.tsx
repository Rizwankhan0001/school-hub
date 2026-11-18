"use client";

import { type FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Users } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { SessionUser, SubscriptionPlan } from "@/lib/types";

type RegisterType = "school" | "parent";

function routeFor(user: SessionUser) {
  if (user.role === "parent" || user.role === "student") return "/parent";
  if (user.role === "super_admin") return "/platform";
  return "/admin";
}

function RegisterInner() {
  const { registerSchool, activateParentBySchoolMobile, user, ready } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const initialType = (params.get("type") === "parent" ? "parent" : "school") as RegisterType;
  const [type, setType] = useState<RegisterType>(initialType);
  const [error, setError] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [adminName, setAdminName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [plan, setPlan] = useState<SubscriptionPlan>("starter");

  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("+91 98765 43210");
  const [parentPassword, setParentPassword] = useState("");


  useEffect(() => {
    if (!ready || !user) return;
    router.replace(routeFor(user));
  }, [ready, user, router]);

  function onSchoolSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = registerSchool({
      schoolName,
      city,
      adminName,
      email: schoolEmail,
      phone: schoolPhone,
      password: schoolPassword,
      plan,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/admin");
  }

  function onParentSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = activateParentBySchoolMobile({
      phone: parentPhone,
      password: parentPassword,
      email: parentEmail || undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/parent");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-xl px-5 py-10 sm:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Register
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          New customer? Choose <span className="font-semibold text-[var(--ink)]">School</span> or{" "}
          <span className="font-semibold text-[var(--ink)]">Parent</span>. Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </Link>
          .
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setType("school");
              setError(null);
              router.replace("/register?type=school");
            }}
            className={`rounded-[1.25rem] border p-4 text-left transition ${
              type === "school"
                ? "border-[var(--accent)] bg-white shadow-[0_16px_32px_-24px_rgba(10,12,16,0.35)]"
                : "border-[var(--line)] bg-white/60 hover:border-[var(--line-strong)]"
            }`}
          >
            <Building2
              className={`h-5 w-5 ${type === "school" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
            />
            <p className="mt-3 font-bold tracking-[-0.02em]">Register as School</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              For school admins — create a campus and manage fees.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setType("parent");
              setError(null);
              router.replace("/register?type=parent");
            }}
            className={`rounded-[1.25rem] border p-4 text-left transition ${
              type === "parent"
                ? "border-[var(--accent)] bg-white shadow-[0_16px_32px_-24px_rgba(10,12,16,0.35)]"
                : "border-[var(--line)] bg-white/60 hover:border-[var(--line-strong)]"
            }`}
          >
            <Users
              className={`h-5 w-5 ${type === "parent" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
            />
            <p className="mt-3 font-bold tracking-[-0.02em]">Activate as Parent</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Use the mobile number already registered at school.
            </p>
          </button>
        </div>

        {type === "school" ? (
          <form
            onSubmit={onSchoolSubmit}
            className="mt-6 space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-white p-5 sm:p-6"
          >
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              You’ll sign in as <span className="font-semibold text-[var(--ink)]">School Admin</span>{" "}
              — configure fee plans, students, dues, and reminders for your school.
            </p>
            <Field label="School name">
              <Input
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Horizon Public School"
              />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" />
            </Field>
            <Field label="Plan">
              <Select value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}>
                <option value="starter">Starter · up to 500 students</option>
                <option value="growth">Growth · up to 2,000 students</option>
                <option value="enterprise">Enterprise · unlimited</option>
              </Select>
            </Field>
            <Field label="Your name (School Admin)">
              <Input
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Sunita Desai"
              />
            </Field>
            <Field label="Work email">
              <Input
                required
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                placeholder="admin@yourschool.edu"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
              />
            </Field>
            <Field label="Password" hint="At least 6 characters">
              <Input
                required
                type="password"
                value={schoolPassword}
                onChange={(e) => setSchoolPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
              />
            </Field>
            {error ? (
              <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              Create school account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form
            onSubmit={onParentSubmit}
            className="mt-6 space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-white p-5 sm:p-6"
          >
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Enter the <span className="font-semibold text-[var(--ink)]">mobile number registered
              with the school</span> and set a password. After that you can also sign in with OTP.
            </p>
            <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-hover)]">
              Demo registered numbers: <strong>+91 98765 43210</strong>, +91 98220 11884, +91 97654
              22110, +91 99001 44556
            </div>
            <Field
              label="School-registered mobile"
              hint="Must match the number on your child’s school file"
            >
              <Input
                required
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
              />
            </Field>
            <Field label="Email (optional)" hint="Used for receipts if provided">
              <Input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </Field>
            <Field label="Create password" hint="At least 6 characters — use this or OTP to sign in">
              <Input
                required
                type="password"
                value={parentPassword}
                onChange={(e) => setParentPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
              />
            </Field>
            {error ? (
              <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              Activate parent portal <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-sm text-[var(--muted)]">
              Already activated?{" "}
              <Link href="/login?role=parent" className="font-semibold text-[var(--accent)]">
                Sign in with mobile / OTP
              </Link>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          School staff?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <RegisterInner />
    </Suspense>
  );
}
