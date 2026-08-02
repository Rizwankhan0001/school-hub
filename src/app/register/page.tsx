"use client";

import { type FormEvent, Suspense, useEffect, useMemo, useState } from "react";
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
  const { registerSchool, registerParent, user, ready, state } = useApp();
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

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [schoolId, setSchoolId] = useState(state.tenantSchools[0]?.id ?? "");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("Grade 5");
  const [childSection, setChildSection] = useState("A");

  const schools = useMemo(() => state.tenantSchools, [state.tenantSchools]);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (!schoolId && schools[0]) setSchoolId(schools[0].id);
  }, [schoolId, schools]);

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
    const result = registerParent({
      name: parentName,
      email: parentEmail,
      phone: parentPhone,
      password: parentPassword,
      schoolId,
      childName: childName || undefined,
      childClass,
      childSection,
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
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em]">
          Create an account
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Schools get an admin workspace. Parents get a portal linked to their child’s school.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
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
            <p className="mt-3 font-bold tracking-[-0.02em]">School</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Register your campus and become school admin.
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
            <p className="mt-3 font-bold tracking-[-0.02em]">Parent</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Link to a school and manage your child’s fees.
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
              You’ll sign in as a <span className="font-semibold text-[var(--ink)]">Parent</span> —
              see dues, pay online, and download receipts for your child.
            </p>
            <Field label="Your name">
              <Input
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Rajesh Sharma"
              />
            </Field>
            <Field label="Email">
              <Input
                required
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </Field>
            <Field label="Mobile">
              <Input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
              />
            </Field>
            <Field label="Child’s school">
              <Select required value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.city}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Child’s name" hint="Optional — adds a student to your portal">
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Aarav Sharma"
                />
              </Field>
              <Field label="Class / section">
                <div className="flex gap-2">
                  <Input
                    value={childClass}
                    onChange={(e) => setChildClass(e.target.value)}
                    placeholder="Grade 5"
                  />
                  <Input
                    className="max-w-[4.5rem]"
                    value={childSection}
                    onChange={(e) => setChildSection(e.target.value)}
                    placeholder="A"
                  />
                </div>
              </Field>
            </div>
            <Field label="Password" hint="At least 6 characters">
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
              Create parent account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Sign in
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
