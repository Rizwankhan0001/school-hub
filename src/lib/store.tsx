"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collectionRate, outstanding, uid, nextReceiptNo, formatINR } from "./format";
import { createInitialState, demoUsers, DEMO_TODAY } from "./seed";
import {
  AVATAR_NAMES,
  GENTLE_TEMPLATES,
  buildVideoScript,
  pickRandom,
  randomChannels,
  shuffleTake,
} from "./reminders";
import type {
  AICallLog,
  AICallType,
  CommunicationLog,
  FeeStructureItem,
  FineRule,
  GentleReminderSettings,
  Installment,
  Payment,
  PaymentGatewayConfig,
  PaymentMethod,
  Receipt,
  Scholarship,
  ScholarshipStatus,
  School,
  SessionUser,
  Student,
  StudentFeeDue,
  SubscriptionPlan,
  SupportTicket,
  Teacher,
  TeacherMeeting,
  TeacherRating,
  TeacherYearAward,
  MeetingMode,
  MeetingTopic,
  TicketStatus,
} from "./types";

type AppState = ReturnType<typeof createInitialState>;

export type RegisterSchoolInput = {
  schoolName: string;
  city: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  plan?: SubscriptionPlan;
};

export type RegisterParentInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  schoolId: string;
  childName?: string;
  childClass?: string;
  childSection?: string;
};

type AuthResult = { ok: true; user: SessionUser } | { ok: false; error: string };

function publicUser(account: SessionUser): SessionUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    parentId: account.parentId,
    schoolId: account.schoolId,
    schoolName: account.schoolName,
    phone: account.phone,
    createdAt: account.createdAt,
  };
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

interface AppContextValue {
  ready: boolean;
  user: SessionUser | null;
  accounts: SessionUser[];
  login: (userId: string) => void;
  loginWithCredentials: (email: string, password: string) => AuthResult;
  registerSchool: (input: RegisterSchoolInput) => AuthResult;
  registerParent: (input: RegisterParentInput) => AuthResult;
  logout: () => void;
  state: AppState;
  metrics: {
    totalDue: number;
    overdue: number;
    collected: number;
    collectionRate: number;
    pendingStudents: number;
    upcoming: number;
    dueToday: number;
  };
  platformMetrics: {
    schools: number;
    activeSchools: number;
    mrr: number;
    enterprise: number;
  };
  addStudent: (input: Omit<Student, "id" | "academicSession" | "status">) => void;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addFeeItem: (item: Omit<FeeStructureItem, "id" | "academicSession">) => void;
  addInstallment: (item: Omit<Installment, "id" | "academicSession">) => void;
  recordPayment: (input: {
    studentId: string;
    dueIds: string[];
    method: PaymentMethod;
    amount: number;
  }) => { payment: Payment; receipt: Receipt };
  sendReminder: (dueId: string, channel: CommunicationLog["channel"]) => void;
  addScholarship: (
    input: Omit<Scholarship, "id" | "status"> & { status?: ScholarshipStatus },
  ) => void;
  updateScholarshipStatus: (id: string, status: ScholarshipStatus) => void;
  upsertFineRule: (rule: FineRule) => void;
  applyFinesToOverdue: () => number;
  queueAICall: (
    dueId: string,
    language: AICallLog["language"],
    callType?: AICallType,
  ) => AICallLog | null;
  sendGentleRandomReminders: (count?: number) => number;
  updateGentleReminderSettings: (patch: Partial<GentleReminderSettings>) => void;
  updateAICallStatus: (
    id: string,
    status: AICallLog["status"],
    extras?: Partial<Pick<AICallLog, "paymentLinkSent" | "summary">>,
  ) => void;
  createTicket: (
    input: Omit<SupportTicket, "id" | "status" | "createdAt" | "updatedAt" | "parentId"> & {
      parentId?: string;
    },
  ) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  bookTeacherMeeting: (input: {
    slotId: string;
    studentId: string;
    topic: MeetingTopic;
    mode: MeetingMode;
    notes?: string;
  }) => { ok: true; meeting: TeacherMeeting } | { ok: false; error: string };
  cancelTeacherMeeting: (meetingId: string) => void;
  rateTeacher: (input: {
    teacherId: string;
    stars: 1 | 2 | 3 | 4 | 5;
    comment?: string;
  }) => { ok: true } | { ok: false; error: string };
  awardTeacherOfTheYear: (input: {
    teacherId: string;
    academicYear?: string;
    reason: string;
  }) => { ok: true } | { ok: false; error: string };
  getTeacherRatingSummary: (teacherId: string) => {
    average: number;
    count: number;
  };
  toggleGateway: (id: string) => void;
  updateTenant: (id: string, patch: Partial<School>) => void;
  getStudent: (id: string) => Student | undefined;
  getParentStudents: (parentId: string) => Student[];
  getOpenDues: (studentIds?: string[]) => StudentFeeDue[];
}

const STORAGE_KEY = "edufee360_state_v3";
const USER_KEY = "edufee360_user_v3";

const AppContext = createContext<AppContextValue | null>(null);

function normalizeAICall(call: AICallLog): AICallLog {
  return {
    ...call,
    callType: call.callType ?? "voice",
    script: call.script ?? call.summary,
    avatarName: call.avatarName ?? "School AI Host",
  };
}

function mergeAccounts(
  base: SessionUser[],
  raw: SessionUser[] | undefined,
): SessionUser[] {
  const byId = new Map(base.map((a) => [a.id, a]));
  for (const account of raw ?? []) {
    const existing = byId.get(account.id);
    byId.set(account.id, existing ? { ...existing, ...account } : account);
  }
  // Keep any demo account that was renamed in seed but missing from older storage
  for (const demo of base) {
    if (![...byId.values()].some((a) => a.email.toLowerCase() === demo.email.toLowerCase())) {
      byId.set(demo.id, demo);
    }
  }
  return Array.from(byId.values());
}

function mergeTeachers(
  base: ReturnType<typeof createInitialState>["teachers"],
  raw: ReturnType<typeof createInitialState>["teachers"] | undefined,
) {
  if (!raw?.length) return base;
  const byId = new Map(base.map((t) => [t.id, t]));
  for (const teacher of raw) {
    const existing = byId.get(teacher.id);
    byId.set(
      teacher.id,
      existing
        ? {
            ...existing,
            ...teacher,
            classAssignments:
              teacher.classAssignments?.length > 0
                ? teacher.classAssignments
                : existing.classAssignments,
            timeline:
              teacher.timeline?.length > 0 ? teacher.timeline : existing.timeline,
            classes: teacher.classes?.length ? teacher.classes : existing.classes,
          }
        : teacher,
    );
  }
  return Array.from(byId.values());
}

function mergeState(raw: Partial<AppState>): AppState {
  const base = createInitialState();
  return {
    ...base,
    ...raw,
    school: { ...base.school, ...(raw.school ?? {}) },
    tenantSchools: raw.tenantSchools ?? base.tenantSchools,
    scholarships: raw.scholarships ?? base.scholarships,
    fineRules: raw.fineRules ?? base.fineRules,
    aiCalls: (raw.aiCalls ?? base.aiCalls).map(normalizeAICall),
    tickets: raw.tickets ?? base.tickets,
    gateways: raw.gateways ?? base.gateways,
    teachers: mergeTeachers(base.teachers, raw.teachers),
    teacherSlots: raw.teacherSlots ?? base.teacherSlots,
    teacherMeetings: raw.teacherMeetings ?? base.teacherMeetings,
    teacherRatings: raw.teacherRatings ?? base.teacherRatings,
    teacherYearAwards: raw.teacherYearAwards ?? base.teacherYearAwards,
    gentleReminders: {
      ...base.gentleReminders,
      ...(raw.gentleReminders ?? {}),
      channels: raw.gentleReminders?.channels ?? base.gentleReminders.channels,
    },
    accounts: mergeAccounts(base.accounts, raw.accounts),
  };
}

function withActiveSchool(prev: AppState, account: SessionUser): AppState {
  if (account.schoolId === "platform") return prev;
  const sch = prev.tenantSchools.find((s) => s.id === account.schoolId);
  if (!sch || sch.id === prev.school.id) return prev;
  return { ...prev, school: sch };
}

function computeMetrics(state: AppState) {
  const open = state.dues.filter((d) => d.status !== "paid");
  const totalDue = open.reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const overdue = open
    .filter((d) => d.status === "overdue")
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const upcoming = open
    .filter((d) => d.status === "upcoming")
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const dueToday = open
    .filter((d) => d.status === "due_today")
    .reduce((s, d) => s + outstanding(d.amount, d.fine, d.paidAmount), 0);
  const collected = state.payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + p.amount, 0);
  const billed = state.dues.reduce((s, d) => s + d.amount + d.fine, 0);
  const pendingStudents = new Set(open.map((d) => d.studentId)).size;
  return {
    totalDue,
    overdue,
    collected,
    collectionRate: collectionRate(collected, billed),
    pendingStudents,
    upcoming,
    dueToday,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createInitialState);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem("edufee360_state_v2") ??
        localStorage.getItem("edufee360_state_v1");
      if (raw) setState(mergeState(JSON.parse(raw) as Partial<AppState>));
      const u =
        localStorage.getItem(USER_KEY) ??
        localStorage.getItem("edufee360_user_v2") ??
        localStorage.getItem("edufee360_user_v1");
      if (u) setUser(JSON.parse(u) as SessionUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user, ready]);

  const login = useCallback((userId: string) => {
    setState((prev) => {
      const account = prev.accounts.find((u) => u.id === userId);
      if (!account) {
        setUser(null);
        return prev;
      }
      setUser(publicUser(account));
      return withActiveSchool(prev, account);
    });
  }, []);

  const loginWithCredentials = useCallback((email: string, password: string): AuthResult => {
    const normalized = email.trim().toLowerCase();
    let result: AuthResult = { ok: false, error: "No account found for that email." };
    setState((prev) => {
      const account = prev.accounts.find((u) => u.email.toLowerCase() === normalized);
      if (!account) return prev;
      if ((account.password ?? "demo123") !== password) {
        result = { ok: false, error: "Incorrect password. Demo accounts use demo123." };
        return prev;
      }
      const session = publicUser(account);
      setUser(session);
      result = { ok: true, user: session };
      return withActiveSchool(prev, account);
    });
    return result;
  }, []);

  const registerSchool = useCallback((input: RegisterSchoolInput): AuthResult => {
    const email = input.email.trim().toLowerCase();
    if (!input.schoolName.trim() || !input.adminName.trim() || !email || !input.password) {
      return { ok: false, error: "Please fill in all required fields." };
    }
    if (input.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }

    let result: AuthResult = { ok: false, error: "Could not create school account." };
    setState((prev) => {
      if (prev.accounts.some((a) => a.email.toLowerCase() === email)) {
        result = { ok: false, error: "An account with this email already exists. Sign in instead." };
        return prev;
      }

      const schoolId = uid("sch");
      const plan: SubscriptionPlan = input.plan ?? "starter";
      const newSchool: School = {
        id: schoolId,
        name: input.schoolName.trim(),
        logoInitials: initialsFromName(input.schoolName),
        city: input.city.trim() || "India",
        academicSession: "2025-26",
        gstin: "PENDING",
        plan,
        studentsLimit: plan === "enterprise" ? 99999 : plan === "growth" ? 2000 : 500,
        branches: 1,
        status: "trial",
        mrr: plan === "enterprise" ? 24999 : plan === "growth" ? 7999 : 2999,
      };

      const account: SessionUser = {
        id: uid("usr"),
        name: input.adminName.trim(),
        email,
        role: "school_admin",
        schoolId,
        password: input.password,
        schoolName: newSchool.name,
        phone: input.phone.trim(),
        createdAt: new Date().toISOString(),
      };

      const session = publicUser(account);
      setUser(session);
      result = { ok: true, user: session };

      return {
        ...prev,
        school: newSchool,
        tenantSchools: [newSchool, ...prev.tenantSchools],
        accounts: [...prev.accounts, account],
      };
    });
    return result;
  }, []);

  const registerParent = useCallback((input: RegisterParentInput): AuthResult => {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim() || !email || !input.password || !input.schoolId) {
      return { ok: false, error: "Please fill in all required fields." };
    }
    if (input.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }

    let result: AuthResult = { ok: false, error: "Could not create parent account." };
    setState((prev) => {
      if (prev.accounts.some((a) => a.email.toLowerCase() === email)) {
        result = { ok: false, error: "An account with this email already exists. Sign in instead." };
        return prev;
      }
      const school =
        prev.tenantSchools.find((s) => s.id === input.schoolId) ??
        (prev.school.id === input.schoolId ? prev.school : undefined);
      if (!school) {
        result = { ok: false, error: "Choose a school to link your parent account." };
        return prev;
      }

      const parentId = uid("par");
      const phone = input.phone.trim() || "+91 90000 00000";
      const parent = {
        id: parentId,
        name: input.name.trim(),
        mobile: phone,
        email,
      };

      const childName = input.childName?.trim();
      const students = [...prev.students];
      const dues = [...prev.dues];
      if (childName) {
        const studentId = uid("stu");
        students.unshift({
          id: studentId,
          admissionNo: `ADM-${String(students.length + 1).padStart(4, "0")}`,
          name: childName,
          className: input.childClass?.trim() || "Grade 5",
          section: input.childSection?.trim() || "A",
          parentId,
          parentName: parent.name,
          mobile: phone,
          email,
          academicSession: school.academicSession,
          status: "active",
        });
        // Seed one upcoming due so the parent portal isn't empty
        const installment = prev.installments[0];
        if (installment) {
          dues.unshift({
            id: uid("due"),
            studentId,
            installmentId: installment.id,
            installmentName: installment.name,
            amount: installment.amount,
            fine: 0,
            paidAmount: 0,
            dueDate: installment.dueDate,
            status: "upcoming",
          });
        }
      }

      const account: SessionUser = {
        id: uid("usr"),
        name: parent.name,
        email,
        role: "parent",
        parentId,
        schoolId: school.id,
        password: input.password,
        schoolName: school.name,
        phone,
        createdAt: new Date().toISOString(),
      };

      const session = publicUser(account);
      setUser(session);
      result = { ok: true, user: session };

      return withActiveSchool(
        {
          ...prev,
          parents: [parent, ...prev.parents],
          students,
          dues,
          accounts: [...prev.accounts, account],
        },
        account,
      );
    });
    return result;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const addStudent = useCallback(
    (input: Omit<Student, "id" | "academicSession" | "status">) => {
      setState((prev) => ({
        ...prev,
        students: [
          {
            ...input,
            id: uid("stu"),
            academicSession: prev.school.academicSession,
            status: "active",
          },
          ...prev.students,
        ],
      }));
    },
    [],
  );

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const addFeeItem = useCallback(
    (item: Omit<FeeStructureItem, "id" | "academicSession">) => {
      setState((prev) => ({
        ...prev,
        feeStructures: [
          ...prev.feeStructures,
          { ...item, id: uid("fs"), academicSession: prev.school.academicSession },
        ],
      }));
    },
    [],
  );

  const addInstallment = useCallback(
    (item: Omit<Installment, "id" | "academicSession">) => {
      setState((prev) => ({
        ...prev,
        installments: [
          ...prev.installments,
          { ...item, id: uid("ins"), academicSession: prev.school.academicSession },
        ],
      }));
    },
    [],
  );

  const recordPayment = useCallback(
    (input: {
      studentId: string;
      dueIds: string[];
      method: PaymentMethod;
      amount: number;
    }) => {
      const paymentId = uid("pay");
      const receiptId = uid("rec");
      const now = new Date().toISOString();
      const transactionId = `TXN-RZ-${Math.floor(100000 + Math.random() * 900000)}`;
      let payment!: Payment;
      let receipt!: Receipt;

      setState((prev) => {
        let remaining = input.amount;
        const dues = prev.dues.map((d) => {
          if (!input.dueIds.includes(d.id)) return d;
          const need = outstanding(d.amount, d.fine, d.paidAmount);
          const apply = Math.min(need, remaining);
          remaining -= apply;
          const paidAmount = d.paidAmount + apply;
          const total = d.amount + d.fine;
          const status =
            paidAmount >= total
              ? ("paid" as const)
              : paidAmount > 0
                ? ("partial" as const)
                : d.status;
          return { ...d, paidAmount, status };
        });

        payment = {
          id: paymentId,
          studentId: input.studentId,
          amount: input.amount,
          method: input.method,
          status: "success",
          transactionId,
          paidAt: now,
          dueIds: input.dueIds,
          gateway: "Razorpay",
        };

        const receiptNo = nextReceiptNo(prev.receipts.map((r) => r.receiptNo));
        receipt = {
          id: receiptId,
          receiptNo,
          paymentId,
          studentId: input.studentId,
          amount: input.amount,
          issuedAt: now,
          gstAmount: 0,
        };

        const student = prev.students.find((s) => s.id === input.studentId);
        const communication: CommunicationLog = {
          id: uid("com"),
          channel: "sms",
          event: "Payment Success",
          recipient: student?.mobile ?? "",
          studentId: input.studentId,
          message: `Payment of ₹${input.amount.toLocaleString("en-IN")} received. Receipt ${receiptNo} issued.`,
          sentAt: now,
          status: "sent",
        };

        return {
          ...prev,
          dues,
          payments: [payment, ...prev.payments],
          receipts: [receipt, ...prev.receipts],
          communications: [communication, ...prev.communications],
        };
      });

      return { payment, receipt };
    },
    [],
  );

  const sendReminder = useCallback(
    (dueId: string, channel: CommunicationLog["channel"]) => {
      setState((prev) => {
        const due = prev.dues.find((d) => d.id === dueId);
        if (!due) return prev;
        const student = prev.students.find((s) => s.id === due.studentId);
        if (!student) return prev;
        const amt = outstanding(due.amount, due.fine, due.paidAmount);
        const log: CommunicationLog = {
          id: uid("com"),
          channel,
          event: "Due Reminder",
          recipient: channel === "email" ? student.email : student.mobile,
          studentId: student.id,
          message: `Dear Parent, Your child’s fee of ₹${amt.toLocaleString("en-IN")} is due on ${due.dueDate} for ${student.name}. Please pay before the due date.`,
          sentAt: new Date().toISOString(),
          status: "sent",
        };
        return { ...prev, communications: [log, ...prev.communications] };
      });
    },
    [],
  );

  const addScholarship = useCallback(
    (input: Omit<Scholarship, "id" | "status"> & { status?: ScholarshipStatus }) => {
      setState((prev) => ({
        ...prev,
        scholarships: [
          {
            ...input,
            id: uid("schlr"),
            status: input.status ?? "pending",
          },
          ...prev.scholarships,
        ],
      }));
    },
    [],
  );

  const updateScholarshipStatus = useCallback((id: string, status: ScholarshipStatus) => {
    setState((prev) => ({
      ...prev,
      scholarships: prev.scholarships.map((s) => (s.id === id ? { ...s, status } : s)),
      communications:
        status === "approved"
          ? [
              {
                id: uid("com"),
                channel: "push" as const,
                event: "Scholarship Approved",
                recipient: prev.students.find(
                  (st) => st.id === prev.scholarships.find((x) => x.id === id)?.studentId,
                )?.mobile ?? "",
                studentId: prev.scholarships.find((x) => x.id === id)?.studentId,
                message: "Scholarship request approved. Updated fee dues will reflect shortly.",
                sentAt: new Date().toISOString(),
                status: "sent" as const,
              },
              ...prev.communications,
            ]
          : prev.communications,
    }));
  }, []);

  const upsertFineRule = useCallback((rule: FineRule) => {
    setState((prev) => {
      const exists = prev.fineRules.some((f) => f.id === rule.id);
      return {
        ...prev,
        fineRules: exists
          ? prev.fineRules.map((f) => (f.id === rule.id ? rule : f))
          : [...prev.fineRules, rule],
      };
    });
  }, []);

  const applyFinesToOverdue = useCallback(() => {
    let applied = 0;
    setState((prev) => {
      const daily = prev.fineRules.find((f) => f.active && f.mode === "daily");
      const fixed = prev.fineRules.find((f) => f.active && f.mode === "fixed");
      const dues = prev.dues.map((d) => {
        if (d.status !== "overdue") return d;
        const add = (daily?.value ?? 0) * 1 + (fixed && d.fine === 0 ? fixed.value : 0);
        if (add <= 0) return d;
        applied += 1;
        return { ...d, fine: d.fine + add };
      });
      return { ...prev, dues };
    });
    return applied;
  }, []);

  const queueAICall = useCallback(
    (dueId: string, language: AICallLog["language"], callType: AICallType = "video") => {
      let created: AICallLog | null = null;
      setState((prev) => {
        const due = prev.dues.find((d) => d.id === dueId);
        if (!due) return prev;
        const student = prev.students.find((s) => s.id === due.studentId);
        if (!student) return prev;
        const amt = outstanding(due.amount, due.fine, due.paidAmount);
        const amountLabel = formatINR(amt);
        const script = buildVideoScript({
          language,
          parentName: student.parentName,
          studentName: student.name,
          schoolName: prev.school.name,
          amountLabel,
          installmentName: due.installmentName,
        });
        const call: AICallLog = {
          id: uid("ai"),
          studentId: student.id,
          dueId: due.id,
          parentName: student.parentName,
          mobile: student.mobile,
          language,
          callType,
          amount: amt,
          status: "ringing",
          riskScore: Math.min(95, 40 + Math.round(amt / 500)),
          paymentLinkSent: false,
          calledAt: new Date().toISOString(),
          summary:
            callType === "video"
              ? `AI-generated video call ringing for ${student.parentName}.`
              : `AI voice reminder ringing for ${student.parentName}.`,
          script,
          avatarName: pickRandom(AVATAR_NAMES),
        };
        created = call;
        const communication: CommunicationLog = {
          id: uid("com"),
          channel: "push",
          event: callType === "video" ? "AI Video Call" : "AI Voice Call",
          recipient: student.mobile,
          studentId: student.id,
          message:
            callType === "video"
              ? `${prev.school.name} is calling you with a gentle AI video reminder about ${student.name}'s fee of ${amountLabel}.`
              : `${prev.school.name} is calling about ${student.name}'s pending fee of ${amountLabel}.`,
          sentAt: new Date().toISOString(),
          status: "sent",
        };
        return {
          ...prev,
          aiCalls: [call, ...prev.aiCalls],
          communications: [communication, ...prev.communications],
        };
      });
      return created;
    },
    [],
  );

  const sendGentleRandomReminders = useCallback((count?: number) => {
    let sent = 0;
    setState((prev) => {
      if (!prev.gentleReminders.enabled) return prev;
      const open = prev.dues.filter((d) => d.status !== "paid");
      const cap = count ?? prev.gentleReminders.dailyCap;
      const picked = shuffleTake(open, cap);
      if (picked.length === 0) return prev;

      const logs: CommunicationLog[] = picked.map((due) => {
        const student = prev.students.find((s) => s.id === due.studentId);
        const template = pickRandom(GENTLE_TEMPLATES);
        const amt = formatINR(outstanding(due.amount, due.fine, due.paidAmount));
        const channel = randomChannels(prev.gentleReminders.channels);
        const message = template.build(
          student?.parentName.split(" ")[0] ?? "Parent",
          student?.name ?? "your child",
          amt,
          prev.school.name,
        );
        sent += 1;
        return {
          id: uid("com"),
          channel,
          event: template.event,
          recipient: channel === "email" ? student?.email ?? "" : student?.mobile ?? "",
          studentId: due.studentId,
          message,
          sentAt: new Date().toISOString(),
          status: "sent" as const,
        };
      });

      return {
        ...prev,
        communications: [...logs, ...prev.communications],
        gentleReminders: {
          ...prev.gentleReminders,
          lastBatchAt: new Date().toISOString(),
        },
      };
    });
    return sent;
  }, []);

  const updateGentleReminderSettings = useCallback((patch: Partial<GentleReminderSettings>) => {
    setState((prev) => ({
      ...prev,
      gentleReminders: { ...prev.gentleReminders, ...patch },
    }));
  }, []);

  const updateAICallStatus = useCallback(
    (
      id: string,
      status: AICallLog["status"],
      extras?: Partial<Pick<AICallLog, "paymentLinkSent" | "summary">>,
    ) => {
      setState((prev) => ({
        ...prev,
        aiCalls: prev.aiCalls.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                paymentLinkSent: extras?.paymentLinkSent ?? c.paymentLinkSent,
                summary: extras?.summary ?? c.summary,
              }
            : c,
        ),
      }));
    },
    [],
  );

  const createTicket = useCallback(
    (
      input: Omit<SupportTicket, "id" | "status" | "createdAt" | "updatedAt" | "parentId"> & {
        parentId?: string;
      },
    ) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        tickets: [
          {
            id: uid("tkt"),
            parentId: input.parentId ?? "",
            studentId: input.studentId,
            subject: input.subject,
            category: input.category,
            description: input.description,
            status: "open",
            createdAt: now,
            updatedAt: now,
          },
          ...prev.tickets,
        ],
      }));
    },
    [],
  );

  const updateTicketStatus = useCallback((id: string, status: TicketStatus) => {
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
      ),
    }));
  }, []);

  const bookTeacherMeeting = useCallback(
    (input: {
      slotId: string;
      studentId: string;
      topic: MeetingTopic;
      mode: MeetingMode;
      notes?: string;
    }): { ok: true; meeting: TeacherMeeting } | { ok: false; error: string } => {
      if (!user?.parentId) {
        return { ok: false, error: "Only parents can book teacher meetings." };
      }
      const parentId = user.parentId;
      let result: { ok: true; meeting: TeacherMeeting } | { ok: false; error: string } = {
        ok: false,
        error: "Could not book this slot.",
      };

      setState((prev) => {
        const slot = prev.teacherSlots.find((s) => s.id === input.slotId);
        if (!slot) {
          result = { ok: false, error: "That time slot is no longer available." };
          return prev;
        }
        if (slot.status !== "open") {
          result = { ok: false, error: "Someone already booked this 20-minute slot." };
          return prev;
        }
        const student = prev.students.find((s) => s.id === input.studentId);
        if (!student || student.parentId !== parentId) {
          result = { ok: false, error: "Choose one of your linked children." };
          return prev;
        }
        const teacher = prev.teachers.find((t) => t.id === slot.teacherId);
        if (!teacher) {
          result = { ok: false, error: "Teacher not found." };
          return prev;
        }

        const meeting: TeacherMeeting = {
          id: uid("mtg"),
          slotId: slot.id,
          teacherId: teacher.id,
          parentId,
          studentId: student.id,
          topic: input.topic,
          mode: input.mode,
          notes: input.notes?.trim() ?? "",
          status: "booked",
          bookedAt: new Date().toISOString(),
        };
        result = { ok: true, meeting };

        return {
          ...prev,
          teacherSlots: prev.teacherSlots.map((s) =>
            s.id === slot.id ? { ...s, status: "booked" as const } : s,
          ),
          teacherMeetings: [meeting, ...prev.teacherMeetings],
          communications: [
            {
              id: uid("com"),
              channel: "email",
              event: "Teacher Meeting Booked",
              recipient: user.email,
              studentId: student.id,
              message: `Meeting with ${teacher.name} booked for ${slot.startAt.slice(0, 16).replace("T", " ")} (20 min) regarding ${input.topic}.`,
              sentAt: new Date().toISOString(),
              status: "sent" as const,
            },
            ...prev.communications,
          ],
        };
      });

      return result;
    },
    [user],
  );

  const cancelTeacherMeeting = useCallback((meetingId: string) => {
    setState((prev) => {
      const meeting = prev.teacherMeetings.find((m) => m.id === meetingId);
      if (!meeting || meeting.status !== "booked") return prev;
      return {
        ...prev,
        teacherMeetings: prev.teacherMeetings.map((m) =>
          m.id === meetingId ? { ...m, status: "cancelled" as const } : m,
        ),
        teacherSlots: prev.teacherSlots.map((s) =>
          s.id === meeting.slotId ? { ...s, status: "open" as const } : s,
        ),
      };
    });
  }, []);

  const rateTeacher = useCallback(
    (input: {
      teacherId: string;
      stars: 1 | 2 | 3 | 4 | 5;
      comment?: string;
    }): { ok: true } | { ok: false; error: string } => {
      if (!user) return { ok: false, error: "Sign in to rate a teacher." };
      if (user.role === "parent" || user.role === "student") {
        return { ok: false, error: "Teacher ratings are managed from the school panel." };
      }
      let result: { ok: true } | { ok: false; error: string } = {
        ok: false,
        error: "Could not save rating.",
      };
      setState((prev) => {
        if (!prev.teachers.some((t) => t.id === input.teacherId)) {
          result = { ok: false, error: "Teacher not found." };
          return prev;
        }
        const rating: TeacherRating = {
          id: uid("trate"),
          teacherId: input.teacherId,
          stars: input.stars,
          comment: input.comment?.trim() ?? "",
          ratedBy: user.name,
          ratedByRole: user.role,
          ratedAt: new Date().toISOString(),
        };
        result = { ok: true };
        return {
          ...prev,
          teacherRatings: [rating, ...prev.teacherRatings],
        };
      });
      return result;
    },
    [user],
  );

  const awardTeacherOfTheYear = useCallback(
    (input: {
      teacherId: string;
      academicYear?: string;
      reason: string;
    }): { ok: true } | { ok: false; error: string } => {
      if (!user || user.role !== "school_admin") {
        return { ok: false, error: "Only the school admin can declare Teacher of the Year." };
      }
      if (!input.reason.trim()) {
        return { ok: false, error: "Add a short reason for the award." };
      }
      let result: { ok: true } | { ok: false; error: string } = {
        ok: false,
        error: "Could not save award.",
      };
      setState((prev) => {
        const teacher = prev.teachers.find((t) => t.id === input.teacherId);
        if (!teacher) {
          result = { ok: false, error: "Teacher not found." };
          return prev;
        }
        const academicYear = input.academicYear ?? prev.school.academicSession;
        const award: TeacherYearAward = {
          id: uid("tya"),
          teacherId: teacher.id,
          academicYear,
          title: "Teacher of the Year",
          reason: input.reason.trim(),
          awardedAt: new Date().toISOString(),
          awardedBy: user.name,
        };
        result = { ok: true };
        return {
          ...prev,
          teacherYearAwards: [
            award,
            ...prev.teacherYearAwards.filter((a) => a.academicYear !== academicYear),
          ],
        };
      });
      return result;
    },
    [user],
  );

  const getTeacherRatingSummary = useCallback(
    (teacherId: string) => {
      const ratings = state.teacherRatings.filter((r) => r.teacherId === teacherId);
      if (ratings.length === 0) return { average: 0, count: 0 };
      const average = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;
      return { average: Math.round(average * 10) / 10, count: ratings.length };
    },
    [state.teacherRatings],
  );

  const toggleGateway = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      gateways: prev.gateways.map((g) =>
        g.id === id ? { ...g, enabled: !g.enabled } : g,
      ) as PaymentGatewayConfig[],
    }));
  }, []);

  const updateTenant = useCallback((id: string, patch: Partial<School>) => {
    setState((prev) => ({
      ...prev,
      tenantSchools: prev.tenantSchools.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      school: prev.school.id === id ? { ...prev.school, ...patch } : prev.school,
    }));
  }, []);

  const getStudent = useCallback(
    (id: string) => state.students.find((s) => s.id === id),
    [state.students],
  );

  const getParentStudents = useCallback(
    (parentId: string) => state.students.filter((s) => s.parentId === parentId),
    [state.students],
  );

  const getOpenDues = useCallback(
    (studentIds?: string[]) =>
      state.dues.filter(
        (d) => d.status !== "paid" && (!studentIds || studentIds.includes(d.studentId)),
      ),
    [state.dues],
  );

  const metrics = useMemo(() => computeMetrics(state), [state]);
  const platformMetrics = useMemo(() => {
    const schools = state.tenantSchools.length;
    const activeSchools = state.tenantSchools.filter((s) => s.status === "active").length;
    const mrr = state.tenantSchools.reduce((s, t) => s + t.mrr, 0);
    const enterprise = state.tenantSchools.filter((s) => s.plan === "enterprise").length;
    return { schools, activeSchools, mrr, enterprise };
  }, [state.tenantSchools]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      accounts: state.accounts,
      login,
      loginWithCredentials,
      registerSchool,
      registerParent,
      logout,
      state,
      metrics,
      platformMetrics,
      addStudent,
      updateStudent,
      addFeeItem,
      addInstallment,
      recordPayment,
      sendReminder,
      addScholarship,
      updateScholarshipStatus,
      upsertFineRule,
      applyFinesToOverdue,
      queueAICall,
      sendGentleRandomReminders,
      updateGentleReminderSettings,
      updateAICallStatus,
      createTicket,
      updateTicketStatus,
      bookTeacherMeeting,
      cancelTeacherMeeting,
      rateTeacher,
      awardTeacherOfTheYear,
      getTeacherRatingSummary,
      toggleGateway,
      updateTenant,
      getStudent,
      getParentStudents,
      getOpenDues,
    }),
    [
      ready,
      user,
      login,
      loginWithCredentials,
      registerSchool,
      registerParent,
      logout,
      state,
      metrics,
      platformMetrics,
      addStudent,
      updateStudent,
      addFeeItem,
      addInstallment,
      recordPayment,
      sendReminder,
      addScholarship,
      updateScholarshipStatus,
      upsertFineRule,
      applyFinesToOverdue,
      queueAICall,
      sendGentleRandomReminders,
      updateGentleReminderSettings,
      updateAICallStatus,
      createTicket,
      updateTicketStatus,
      bookTeacherMeeting,
      cancelTeacherMeeting,
      rateTeacher,
      awardTeacherOfTheYear,
      getTeacherRatingSummary,
      toggleGateway,
      updateTenant,
      getStudent,
      getParentStudents,
      getOpenDues,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { demoUsers, DEMO_TODAY };
