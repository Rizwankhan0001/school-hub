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
import {
  collectionRate,
  evaluateScholarshipEligibility,
  normalizePhone,
  outstanding,
  uid,
  nextReceiptNo,
  formatINR,
  maskPhone,
} from "./format";
import type { ScholarshipEligibilityInput } from "./format";
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
  Parent,
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
  StaffSalary,
  StaffMember,
  StaffPersonType,
  SalaryPayoutMethod,
  SalaryStatus,
  SubscriptionPlan,
  SupportTicket,
  Teacher,
  TeacherMeeting,
  TeacherRating,
  TeacherYearAward,
  MeetingMode,
  MeetingTopic,
  TicketStatus,
  MeetingChatMessage,
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

export type ActivateParentInput = {
  phone: string;
  password: string;
  email?: string;
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
  loginWithPhonePassword: (phone: string, password: string) => AuthResult;
  requestParentOtp: (
    phone: string,
  ) => { ok: true; demoOtp: string; maskedPhone: string } | { ok: false; error: string };
  loginWithParentOtp: (phone: string, otp: string) => AuthResult;
  activateParentBySchoolMobile: (input: ActivateParentInput) => AuthResult;
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
  recordStaffSalaryPayout: (input: {
    salaryId: string;
    payoutMethod: SalaryPayoutMethod;
  }) => { ok: true; salary: StaffSalary } | { ok: false; error: string };
  holdStaffSalary: (salaryId: string, notes?: string) => { ok: true } | { ok: false; error: string };
  addStaffSalary: (
    input: Omit<StaffSalary, "id" | "netAmount" | "status" | "paidAt" | "payoutMethod"> & {
      status?: SalaryStatus;
    },
  ) => void;
  sendReminder: (dueId: string, channel: CommunicationLog["channel"]) => void;
  addScholarship: (
    input: Omit<Scholarship, "id" | "status"> & { status?: ScholarshipStatus },
  ) => void;
  applyScholarshipAsParent: (
    input: Omit<
      Scholarship,
      "id" | "status" | "appliedBy" | "reviewNotes" | "autoReviewedAt"
    >,
  ) => { ok: true; id: string } | { ok: false; error: string };
  updateScholarshipStatus: (id: string, status: ScholarshipStatus) => void;
  autoReviewScholarship: (
    id: string,
  ) => { ok: true; decision: "approved" | "rejected"; reason: string } | { ok: false; error: string };
  autoReviewPendingScholarships: () => {
    reviewed: number;
    approved: number;
    rejected: number;
  };
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
  sendMeetingChat: (
    meetingId: string,
    text: string,
  ) => { ok: true } | { ok: false; error: string };
  startMeetingSession: (meetingId: string) => void;
  endMeetingSession: (meetingId: string) => void;
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
  getStaffPerson: (
    personType: StaffPersonType,
    personId: string,
  ) =>
    | {
        type: "teacher";
        teacher: Teacher;
        name: string;
        subtitle: string;
        phone: string;
        monthlySalary: number;
      }
    | {
        type: "staff";
        staff: StaffMember;
        name: string;
        subtitle: string;
        phone: string;
        monthlySalary: number;
      }
    | undefined;
  getParentStudents: (parentId: string) => Student[];
  getOpenDues: (studentIds?: string[]) => StudentFeeDue[];
}

const STORAGE_KEY = "edufee360_state_v3";
const USER_KEY = "edufee360_user_v3";

const AppContext = createContext<AppContextValue | null>(null);

function buildTeacherChatReply(parentText: string, topic: string, teacherName: string) {
  const lower = parentText.toLowerCase();
  if (lower.includes("thank")) {
    return `You're welcome. I'm here if you need anything else about ${topic}.`;
  }
  if (lower.includes("homework") || lower.includes("assignment")) {
    return `Thanks for flagging that. I'll review the recent homework and share a short plan for ${topic} before our next class.`;
  }
  if (lower.includes("exam") || lower.includes("test")) {
    return `Understood. Let's focus on exam prep — I'll share 2–3 practice areas and we can revisit progress in chat.`;
  }
  if (lower.includes("behav") || lower.includes("attention")) {
    return `I hear you. We'll keep classroom check-ins gentle and consistent — I'll update you here after the next few sessions.`;
  }
  return `Thanks for sharing. I've noted this about ${topic}. ${teacherName.split(" ").slice(-1)[0]} here — let's keep coordinating in this chat so everything stays on the platform.`;
}

const DEMO_PARENT_OTP = "123456";

type OtpChallenge = { phone: string; otp: string; sentAt: string };

function findSchoolParentRecord(
  prev: AppState,
  phone: string,
): Parent | null {
  const digits = normalizePhone(phone);
  if (digits.length < 10) return null;
  const byParent = prev.parents.find((p) => normalizePhone(p.mobile) === digits);
  if (byParent) return byParent;
  const student = prev.students.find((s) => normalizePhone(s.mobile) === digits);
  if (!student) return null;
  const linked = prev.parents.find((p) => p.id === student.parentId);
  if (linked) return linked;
  return {
    id: student.parentId,
    name: student.parentName,
    mobile: student.mobile,
    email: student.email,
  };
}

function findParentAccount(prev: AppState, phone: string, parentId?: string) {
  const digits = normalizePhone(phone);
  return prev.accounts.find((a) => {
    if (a.role !== "parent") return false;
    if (parentId && a.parentId === parentId) return true;
    return normalizePhone(a.phone ?? "") === digits;
  });
}

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

function mergeStudents(
  base: ReturnType<typeof createInitialState>["students"],
  raw: ReturnType<typeof createInitialState>["students"] | undefined,
) {
  if (!raw?.length) return base;
  const byId = new Map(raw.map((s) => [s.id, s]));
  for (const demo of base) {
    const saved = byId.get(demo.id);
    if (!saved) {
      byId.set(demo.id, demo);
      continue;
    }
    // Prefer richer profile fields from seed when local copy is thin
    byId.set(demo.id, {
      ...demo,
      ...saved,
      rollNo: saved.rollNo ?? demo.rollNo,
      gender: saved.gender ?? demo.gender,
      dateOfBirth: saved.dateOfBirth ?? demo.dateOfBirth,
      bloodGroup: saved.bloodGroup ?? demo.bloodGroup,
      address: saved.address ?? demo.address,
      house: saved.house ?? demo.house,
      dateOfJoining: saved.dateOfJoining ?? demo.dateOfJoining,
      avatarInitials: saved.avatarInitials ?? demo.avatarInitials,
      emergencyContact: saved.emergencyContact ?? demo.emergencyContact,
      remarks: saved.remarks ?? demo.remarks,
    });
  }
  return Array.from(byId.values());
}

function mergeTeachers(
  base: ReturnType<typeof createInitialState>["teachers"],
  raw: ReturnType<typeof createInitialState>["teachers"] | undefined,
) {
  if (!raw?.length) return base;
  const byId = new Map(raw.map((t) => [t.id, t]));
  // Prefer current seed roster when it is richer (classes 1–12 expansion, new fields)
  for (const demo of base) {
    const saved = byId.get(demo.id);
    if (!saved) {
      byId.set(demo.id, demo);
      continue;
    }
    const seedRicher =
      (demo.classAssignments?.length ?? 0) >= (saved.classAssignments?.length ?? 0) ||
      (demo.classes?.length ?? 0) > (saved.classes?.length ?? 0) ||
      Boolean(demo.department && !saved.department);
    byId.set(
      demo.id,
      seedRicher
        ? {
            ...saved,
            ...demo,
            classAssignments: demo.classAssignments,
            timeline: demo.timeline?.length ? demo.timeline : saved.timeline,
            classes: demo.classes,
            languagesSpoken: demo.languagesSpoken ?? saved.languagesSpoken ?? [],
            highlights: demo.highlights ?? saved.highlights ?? [],
            department: demo.department ?? saved.department ?? "Specialist",
            monthlySalary: demo.monthlySalary ?? saved.monthlySalary ?? 40000,
          }
        : {
            ...demo,
            ...saved,
            classAssignments:
              saved.classAssignments?.length > 0
                ? saved.classAssignments
                : demo.classAssignments,
            timeline: saved.timeline?.length > 0 ? saved.timeline : demo.timeline,
            classes: saved.classes?.length ? saved.classes : demo.classes,
            languagesSpoken: saved.languagesSpoken ?? demo.languagesSpoken ?? [],
            highlights: saved.highlights ?? demo.highlights ?? [],
            department: saved.department ?? demo.department ?? "Specialist",
            monthlySalary: saved.monthlySalary ?? demo.monthlySalary ?? 40000,
          },
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
    feeStructures:
      (raw.feeStructures?.length ?? 0) >= base.feeStructures.length
        ? (raw.feeStructures as AppState["feeStructures"])
        : base.feeStructures,
    installments:
      (raw.installments?.length ?? 0) >= base.installments.length
        ? (raw.installments as AppState["installments"])
        : base.installments,
    students:
      (raw.students?.length ?? 0) >= base.students.length
        ? mergeStudents(base.students, raw.students as AppState["students"])
        : base.students,
    parents:
      (raw.parents?.length ?? 0) >= base.parents.length
        ? (raw.parents as AppState["parents"])
        : base.parents,
    feePaymentOptions:
      raw.feePaymentOptions && raw.feePaymentOptions.length > 0
        ? raw.feePaymentOptions
        : base.feePaymentOptions,
    scholarships: raw.scholarships ?? base.scholarships,
    scholarshipPrograms:
      raw.scholarshipPrograms && raw.scholarshipPrograms.length > 0
        ? raw.scholarshipPrograms
        : base.scholarshipPrograms,
    fineRules: raw.fineRules ?? base.fineRules,
    aiCalls: (raw.aiCalls ?? base.aiCalls).map(normalizeAICall),
    tickets: raw.tickets ?? base.tickets,
    gateways: raw.gateways ?? base.gateways,
    teachers: mergeTeachers(base.teachers, raw.teachers),
    teacherSlots:
      (raw.teacherSlots?.length ?? 0) >= base.teacherSlots.length
        ? (raw.teacherSlots as AppState["teacherSlots"])
        : base.teacherSlots,
    teacherMeetings: raw.teacherMeetings ?? base.teacherMeetings,
    meetingChats: raw.meetingChats ?? base.meetingChats,
    teacherRatings:
      (raw.teacherRatings?.length ?? 0) >= base.teacherRatings.length
        ? (raw.teacherRatings as AppState["teacherRatings"])
        : base.teacherRatings,
    teacherYearAwards: raw.teacherYearAwards ?? base.teacherYearAwards,
    staffMembers:
      raw.staffMembers && raw.staffMembers.length > 0
        ? raw.staffMembers.map((s) => ({
            ...s,
            monthlySalary:
              typeof s.monthlySalary === "number" && s.monthlySalary > 0
                ? s.monthlySalary
                : 25000,
          }))
        : base.staffMembers,
    staffSalaries:
      raw.staffSalaries && raw.staffSalaries.length > 0
        ? raw.staffSalaries
        : base.staffSalaries,
    gentleReminders: {
      ...base.gentleReminders,
      ...(raw.gentleReminders ?? {}),
      channels: raw.gentleReminders?.channels ?? base.gentleReminders.channels,
    },
    accounts: mergeAccounts(base.accounts, raw.accounts),
    otpChallenges: [],
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

  const loginWithPhonePassword = useCallback((phone: string, password: string): AuthResult => {
    const digits = normalizePhone(phone);
    if (digits.length < 10) {
      return { ok: false, error: "Enter the 10-digit mobile number registered with the school." };
    }
    let result: AuthResult = {
      ok: false,
      error: "No parent account for this number. Activate it with your school-registered mobile first.",
    };
    setState((prev) => {
      const schoolParent = findSchoolParentRecord(prev, phone);
      if (!schoolParent) {
        result = {
          ok: false,
          error: "This number is not in school records. Ask the school office to register your mobile.",
        };
        return prev;
      }
      const account = findParentAccount(prev, phone, schoolParent.id);
      if (!account) {
        result = {
          ok: false,
          error: "Mobile is registered at school, but portal access isn’t activated. Create a password below or use OTP.",
        };
        return prev;
      }
      if ((account.password ?? "demo123") !== password) {
        result = { ok: false, error: "Incorrect password. Demo parents use demo123." };
        return prev;
      }
      const session = publicUser(account);
      setUser(session);
      result = { ok: true, user: session };
      return withActiveSchool(prev, account);
    });
    return result;
  }, []);

  const requestParentOtp = useCallback(
    (
      phone: string,
    ): { ok: true; demoOtp: string; maskedPhone: string } | { ok: false; error: string } => {
      const digits = normalizePhone(phone);
      if (digits.length < 10) {
        return { ok: false, error: "Enter the 10-digit mobile registered with the school." };
      }
      let outcome:
        | { ok: true; demoOtp: string; maskedPhone: string }
        | { ok: false; error: string } = {
        ok: false,
        error: "Could not send OTP.",
      };
      setState((prev) => {
        const schoolParent = findSchoolParentRecord(prev, phone);
        if (!schoolParent) {
          outcome = {
            ok: false,
            error: "This number is not registered with the school. Contact the office.",
          };
          return prev;
        }
        const challenge: OtpChallenge = {
          phone: digits,
          otp: DEMO_PARENT_OTP,
          sentAt: new Date().toISOString(),
        };
        const rest = (prev.otpChallenges ?? []).filter((c) => c.phone !== digits);
        outcome = {
          ok: true,
          demoOtp: DEMO_PARENT_OTP,
          maskedPhone: maskPhone(schoolParent.mobile),
        };
        return { ...prev, otpChallenges: [challenge, ...rest] };
      });
      return outcome;
    },
    [],
  );

  const ensureParentAccount = useCallback(
    (prev: AppState, schoolParent: Parent, password?: string): { next: AppState; account: SessionUser } => {
      const existing = findParentAccount(prev, schoolParent.mobile, schoolParent.id);
      if (existing) {
        const account =
          password && existing.password !== password
            ? { ...existing, password, phone: schoolParent.mobile }
            : { ...existing, phone: existing.phone || schoolParent.mobile };
        return {
          next: {
            ...prev,
            accounts: prev.accounts.map((a) => (a.id === account.id ? account : a)),
            parents: prev.parents.some((p) => p.id === schoolParent.id)
              ? prev.parents
              : [schoolParent, ...prev.parents],
          },
          account,
        };
      }
      const account: SessionUser = {
        id: uid("usr"),
        name: schoolParent.name,
        email: schoolParent.email,
        role: "parent",
        parentId: schoolParent.id,
        schoolId: prev.school.id,
        password: password || "demo123",
        schoolName: prev.school.name,
        phone: schoolParent.mobile,
        createdAt: new Date().toISOString(),
      };
      return {
        next: {
          ...prev,
          accounts: [...prev.accounts, account],
          parents: prev.parents.some((p) => p.id === schoolParent.id)
            ? prev.parents
            : [schoolParent, ...prev.parents],
        },
        account,
      };
    },
    [],
  );

  const loginWithParentOtp = useCallback(
    (phone: string, otp: string): AuthResult => {
      const digits = normalizePhone(phone);
      const code = otp.trim();
      if (digits.length < 10 || !code) {
        return { ok: false, error: "Enter mobile number and the OTP." };
      }
      let result: AuthResult = { ok: false, error: "Invalid or expired OTP." };
      setState((prev) => {
        const challenge = (prev.otpChallenges ?? []).find((c) => c.phone === digits);
        if (!challenge || challenge.otp !== code) {
          result = { ok: false, error: "Incorrect OTP. Demo OTP is 123456 after you request it." };
          return prev;
        }
        const schoolParent = findSchoolParentRecord(prev, phone);
        if (!schoolParent) {
          result = { ok: false, error: "Mobile not found in school records." };
          return prev;
        }
        const { next, account } = ensureParentAccount(prev, schoolParent);
        const cleaned = {
          ...next,
          otpChallenges: (next.otpChallenges ?? []).filter((c) => c.phone !== digits),
        };
        const session = publicUser(account);
        setUser(session);
        result = { ok: true, user: session };
        return withActiveSchool(cleaned, account);
      });
      return result;
    },
    [ensureParentAccount],
  );

  const activateParentBySchoolMobile = useCallback(
    (input: ActivateParentInput): AuthResult => {
      const digits = normalizePhone(input.phone);
      if (digits.length < 10) {
        return { ok: false, error: "Enter the mobile number registered with the school." };
      }
      if (!input.password || input.password.length < 6) {
        return { ok: false, error: "Create a password with at least 6 characters." };
      }
      let result: AuthResult = { ok: false, error: "Could not activate parent account." };
      setState((prev) => {
        const schoolParent = findSchoolParentRecord(prev, input.phone);
        if (!schoolParent) {
          result = {
            ok: false,
            error: "This number isn’t in school records. Ask the school to update your registered mobile.",
          };
          return prev;
        }
        const already = findParentAccount(prev, input.phone, schoolParent.id);
        if (already && already.password && already.createdAt) {
          // Allow re-setting password for demo if they want, but prefer sign-in
          result = {
            ok: false,
            error: "Portal access already exists for this number. Sign in with password or OTP.",
          };
          return prev;
        }
        if (already && !already.createdAt) {
          // Demo seed parent account — set password / ensure phone and sign in
          const account = {
            ...already,
            password: input.password,
            phone: schoolParent.mobile,
            email: input.email?.trim() || already.email,
          };
          const session = publicUser(account);
          setUser(session);
          result = { ok: true, user: session };
          return withActiveSchool(
            {
              ...prev,
              accounts: prev.accounts.map((a) => (a.id === account.id ? account : a)),
            },
            account,
          );
        }
        const email =
          input.email?.trim().toLowerCase() ||
          schoolParent.email ||
          `parent${digits.slice(-4)}@school.parent`;
        if (
          prev.accounts.some(
            (a) => a.email.toLowerCase() === email && normalizePhone(a.phone ?? "") !== digits,
          )
        ) {
          result = { ok: false, error: "That email is already used by another account." };
          return prev;
        }
        const parentRecord = {
          ...schoolParent,
          email: schoolParent.email || email,
          mobile: schoolParent.mobile,
        };
        const { next, account } = ensureParentAccount(
          {
            ...prev,
            parents: prev.parents.some((p) => p.id === parentRecord.id)
              ? prev.parents.map((p) => (p.id === parentRecord.id ? parentRecord : p))
              : [parentRecord, ...prev.parents],
          },
          parentRecord,
          input.password,
        );
        const withEmail = {
          ...next,
          accounts: next.accounts.map((a) =>
            a.id === account.id ? { ...a, email, password: input.password } : a,
          ),
        };
        const finalAccount = withEmail.accounts.find((a) => a.id === account.id)!;
        const session = publicUser(finalAccount);
        setUser(session);
        result = { ok: true, user: session };
        return withActiveSchool(withEmail, finalAccount);
      });
      return result;
    },
    [ensureParentAccount],
  );

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
      setState((prev) => {
        const admissionNo =
          input.admissionNo.trim() ||
          `ADM-${prev.school.academicSession.slice(0, 4)}-${String(prev.students.length + 1).padStart(4, "0")}`;
        const initials =
          input.avatarInitials ||
          input.name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("") ||
          "ST";
        return {
          ...prev,
          students: [
            {
              ...input,
              admissionNo,
              avatarInitials: initials,
              id: uid("stu"),
              academicSession: prev.school.academicSession,
              status: "active",
            },
            ...prev.students,
          ],
        };
      });
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

  const recordStaffSalaryPayout = useCallback(
    (input: {
      salaryId: string;
      payoutMethod: SalaryPayoutMethod;
    }): { ok: true; salary: StaffSalary } | { ok: false; error: string } => {
      let updated: StaffSalary | null = null;
      let error: string | null = null;

      setState((prev) => {
        const row = prev.staffSalaries.find((s) => s.id === input.salaryId);
        if (!row) {
          error = "Salary line not found.";
          return prev;
        }
        if (row.status === "paid") {
          error = "This salary is already paid.";
          return prev;
        }
        const salary: StaffSalary = {
          ...row,
          status: "paid",
          paidAt: new Date().toISOString(),
          payoutMethod: input.payoutMethod,
        };
        updated = salary;
        return {
          ...prev,
          staffSalaries: prev.staffSalaries.map((s) =>
            s.id === row.id ? salary : s,
          ),
        };
      });

      if (error || !updated) return { ok: false, error: error ?? "Could not pay salary." };
      return { ok: true, salary: updated };
    },
    [],
  );

  const holdStaffSalary = useCallback(
    (salaryId: string, notes?: string): { ok: true } | { ok: false; error: string } => {
      let error: string | null = null;
      setState((prev) => {
        const row = prev.staffSalaries.find((s) => s.id === salaryId);
        if (!row) {
          error = "Salary line not found.";
          return prev;
        }
        if (row.status === "paid") {
          error = "Cannot hold a salary that is already paid.";
          return prev;
        }
        return {
          ...prev,
          staffSalaries: prev.staffSalaries.map((s) =>
            s.id === salaryId
              ? {
                  ...s,
                  status: "on_hold" as const,
                  notes: notes?.trim() || s.notes || "On hold by accounts.",
                }
              : s,
          ),
        };
      });
      if (error) return { ok: false, error };
      return { ok: true };
    },
    [],
  );

  const addStaffSalary = useCallback(
    (
      input: Omit<StaffSalary, "id" | "netAmount" | "status" | "paidAt" | "payoutMethod"> & {
        status?: SalaryStatus;
      },
    ) => {
      const deductions = Math.max(0, input.deductions);
      const gross = Math.max(0, input.grossAmount);
      setState((prev) => ({
        ...prev,
        staffSalaries: [
          {
            id: uid("sal"),
            personType: input.personType,
            personId: input.personId,
            periodKey: input.periodKey,
            periodLabel: input.periodLabel,
            grossAmount: gross,
            deductions,
            netAmount: Math.max(0, gross - deductions),
            payBy: input.payBy,
            status: input.status ?? "due",
            notes: input.notes,
          },
          ...prev.staffSalaries,
        ],
      }));
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
      setState((prev) => {
        const program = input.programId
          ? prev.scholarshipPrograms.find((p) => p.id === input.programId)
          : undefined;
        return {
          ...prev,
          scholarships: [
            {
              ...input,
              id: uid("schlr"),
              status: input.status ?? "pending",
              appliedBy: input.appliedBy ?? "admin",
              basis: input.basis ?? program?.basis,
              type: input.type ?? program?.type ?? "Merit Based",
            },
            ...prev.scholarships,
          ],
        };
      });
    },
    [],
  );

  const applyScholarshipAsParent = useCallback(
    (
      input: Omit<
        Scholarship,
        "id" | "status" | "appliedBy" | "reviewNotes" | "autoReviewedAt"
      >,
    ): { ok: true; id: string } | { ok: false; error: string } => {
      if (!user?.parentId) {
        return { ok: false, error: "Only parents can apply from the parent portal." };
      }
      const student = state.students.find((s) => s.id === input.studentId);
      if (!student || student.parentId !== user.parentId) {
        return { ok: false, error: "You can only apply for your own children." };
      }
      const program = input.programId
        ? state.scholarshipPrograms.find((p) => p.id === input.programId)
        : undefined;
      if (!program || !program.active) {
        return { ok: false, error: "This scholarship scheme is not available." };
      }
      const alreadyPending = state.scholarships.some(
        (s) =>
          s.studentId === input.studentId &&
          s.programId === input.programId &&
          (s.status === "pending" || s.status === "approved"),
      );
      if (alreadyPending) {
        return {
          ok: false,
          error: "An application for this scheme is already pending or approved for this student.",
        };
      }
      if (!input.documentsConfirmed) {
        return { ok: false, error: "Please confirm that required documents are ready." };
      }

      const id = uid("schlr");
      setState((prev) => ({
        ...prev,
        scholarships: [
          {
            ...input,
            id,
            status: "pending",
            appliedBy: "parent",
            basis: input.basis ?? program.basis,
            type: input.type ?? program.type,
          },
          ...prev.scholarships,
        ],
        communications: [
          {
            id: uid("com"),
            channel: "push" as const,
            event: "Scholarship Applied",
            recipient: student.mobile,
            studentId: student.id,
            message: `Your application for ${program.name} was submitted and is awaiting school review.`,
            sentAt: new Date().toISOString(),
            status: "sent" as const,
          },
          ...prev.communications,
        ],
      }));
      return { ok: true, id };
    },
    [user, state.students, state.scholarshipPrograms, state.scholarships],
  );

  const applyScholarshipDecision = useCallback(
    (
      prev: ReturnType<typeof createInitialState>,
      id: string,
      status: ScholarshipStatus,
      extras?: Partial<Pick<Scholarship, "mode" | "value" | "reviewNotes" | "autoReviewedAt">>,
    ) => {
      const current = prev.scholarships.find((s) => s.id === id);
      if (!current) return prev;
      const wasApproved = current.status === "approved";
      const willApprove = status === "approved";
      let programs = prev.scholarshipPrograms;
      if (current.programId && willApprove && !wasApproved) {
        programs = programs.map((p) =>
          p.id === current.programId
            ? { ...p, seatsFilled: Math.min(p.maxSeats, p.seatsFilled + 1) }
            : p,
        );
      }
      if (current.programId && wasApproved && (status === "rejected" || status === "expired")) {
        programs = programs.map((p) =>
          p.id === current.programId
            ? { ...p, seatsFilled: Math.max(0, p.seatsFilled - 1) }
            : p,
        );
      }

      const student = prev.students.find((st) => st.id === current.studentId);
      const program = current.programId
        ? prev.scholarshipPrograms.find((p) => p.id === current.programId)
        : undefined;
      const notice =
        status === "approved"
          ? {
              id: uid("com"),
              channel: "push" as const,
              event: "Scholarship Approved",
              recipient: student?.mobile ?? "",
              studentId: current.studentId,
              message:
                extras?.reviewNotes ||
                `Scholarship approved${program ? ` under ${program.name}` : ""}. Updated fee dues will reflect shortly.`,
              sentAt: new Date().toISOString(),
              status: "sent" as const,
            }
          : status === "rejected"
            ? {
                id: uid("com"),
                channel: "push" as const,
                event: "Scholarship Rejected",
                recipient: student?.mobile ?? "",
                studentId: current.studentId,
                message:
                  extras?.reviewNotes ||
                  `Scholarship application was not approved${program ? ` for ${program.name}` : ""}.`,
                sentAt: new Date().toISOString(),
                status: "sent" as const,
              }
            : null;

      return {
        ...prev,
        scholarshipPrograms: programs,
        scholarships: prev.scholarships.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                mode: extras?.mode ?? s.mode,
                value: extras?.value ?? s.value,
                reviewNotes: extras?.reviewNotes ?? s.reviewNotes,
                autoReviewedAt: extras?.autoReviewedAt ?? s.autoReviewedAt,
              }
            : s,
        ),
        communications: notice ? [notice, ...prev.communications] : prev.communications,
      };
    },
    [],
  );

  const updateScholarshipStatus = useCallback(
    (id: string, status: ScholarshipStatus) => {
      setState((prev) => applyScholarshipDecision(prev, id, status));
    },
    [applyScholarshipDecision],
  );

  const autoReviewScholarship = useCallback(
    (
      id: string,
    ):
      | { ok: true; decision: "approved" | "rejected"; reason: string }
      | { ok: false; error: string } => {
      const current = state.scholarships.find((s) => s.id === id);
      if (!current) return { ok: false, error: "Application not found." };
      if (current.status !== "pending") {
        return { ok: false, error: "Only pending applications can be auto-reviewed." };
      }
      const program = current.programId
        ? state.scholarshipPrograms.find((p) => p.id === current.programId)
        : undefined;
      if (!program) {
        return { ok: false, error: "Scholarship scheme not found for this application." };
      }

      const seatsAvailable = program.seatsFilled < program.maxSeats;
      const input: ScholarshipEligibilityInput = {
        qualifyingScore: current.qualifyingScore,
        annualIncome: current.annualIncome,
        sportsLevel: current.sportsLevel,
        staffChildConfirmed: current.staffChildConfirmed,
        governmentSanctionConfirmed: current.governmentSanctionConfirmed,
        documentsConfirmed: current.documentsConfirmed ?? current.appliedBy !== "parent",
        seatsAvailable,
      };
      const review = evaluateScholarshipEligibility(program, input);
      const reviewedAt = new Date().toISOString();

      setState((prev) =>
        applyScholarshipDecision(prev, id, review.decision, {
          mode: review.mode,
          value: review.value,
          reviewNotes: review.reason,
          autoReviewedAt: reviewedAt,
        }),
      );

      return { ok: true, decision: review.decision, reason: review.reason };
    },
    [state.scholarships, state.scholarshipPrograms, applyScholarshipDecision],
  );

  const autoReviewPendingScholarships = useCallback(() => {
    let reviewed = 0;
    let approved = 0;
    let rejected = 0;

    setState((prev) => {
      let next = prev;
      const pending = prev.scholarships.filter((s) => s.status === "pending");
      reviewed = 0;
      approved = 0;
      rejected = 0;
      for (const app of pending) {
        const live = next.scholarships.find((s) => s.id === app.id);
        if (!live || live.status !== "pending") continue;
        const program = live.programId
          ? next.scholarshipPrograms.find((p) => p.id === live.programId)
          : undefined;
        if (!program) continue;

        reviewed += 1;
        const seatsAvailable = program.seatsFilled < program.maxSeats;
        const review = evaluateScholarshipEligibility(program, {
          qualifyingScore: live.qualifyingScore,
          annualIncome: live.annualIncome,
          sportsLevel: live.sportsLevel,
          staffChildConfirmed: live.staffChildConfirmed,
          governmentSanctionConfirmed: live.governmentSanctionConfirmed,
          documentsConfirmed: live.documentsConfirmed ?? live.appliedBy !== "parent",
          seatsAvailable,
        });
        if (review.decision === "approved") approved += 1;
        else rejected += 1;
        next = applyScholarshipDecision(next, live.id, review.decision, {
          mode: review.mode,
          value: review.value,
          reviewNotes: review.reason,
          autoReviewedAt: new Date().toISOString(),
        });
      }
      return next;
    });

    return { reviewed, approved, rejected };
  }, [applyScholarshipDecision]);

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
        const teachesClass =
          teacher.classes.includes(student.className) ||
          teacher.classAssignments.some((a) => a.className === student.className);
        if (!teachesClass) {
          result = {
            ok: false,
            error: `${teacher.name} does not teach ${student.className}. Choose a teacher for your child's class.`,
          };
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
          sessionStatus: "idle",
        };
        result = { ok: true, meeting };

        const welcomeChat: MeetingChatMessage[] =
          input.mode === "chat"
            ? [
                {
                  id: uid("mchat"),
                  meetingId: meeting.id,
                  senderRole: "teacher",
                  senderName: teacher.name,
                  text: `Hello! This is ${teacher.name}. We can chat here about ${input.topic} for ${student.name}. How can I help?`,
                  sentAt: new Date().toISOString(),
                },
              ]
            : [];

        return {
          ...prev,
          teacherSlots: prev.teacherSlots.map((s) =>
            s.id === slot.id ? { ...s, status: "booked" as const } : s,
          ),
          teacherMeetings: [meeting, ...prev.teacherMeetings],
          meetingChats: [...welcomeChat, ...prev.meetingChats],
          communications: [
            {
              id: uid("com"),
              channel: "email",
              event: "Teacher Meeting Booked",
              recipient: user.email,
              studentId: student.id,
              message: `Meeting with ${teacher.name} booked for ${slot.startAt.slice(0, 16).replace("T", " ")} (20 min) regarding ${input.topic} · mode: ${input.mode}. Join from Parent Portal → Meetings.`,
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

  const startMeetingSession = useCallback((meetingId: string) => {
    setState((prev) => ({
      ...prev,
      teacherMeetings: prev.teacherMeetings.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              sessionStatus: "active" as const,
              lastEngagedAt: new Date().toISOString(),
            }
          : m,
      ),
    }));
  }, []);

  const endMeetingSession = useCallback((meetingId: string) => {
    setState((prev) => ({
      ...prev,
      teacherMeetings: prev.teacherMeetings.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              sessionStatus: "ended" as const,
              status: m.status === "booked" ? ("completed" as const) : m.status,
              lastEngagedAt: new Date().toISOString(),
            }
          : m,
      ),
    }));
  }, []);

  const sendMeetingChat = useCallback(
    (meetingId: string, text: string): { ok: true } | { ok: false; error: string } => {
      const trimmed = text.trim();
      if (!trimmed) return { ok: false, error: "Type a message first." };
      if (!user?.parentId) return { ok: false, error: "Sign in as a parent to chat." };

      const meeting = state.teacherMeetings.find((m) => m.id === meetingId);
      if (!meeting || meeting.parentId !== user.parentId) {
        return { ok: false, error: "Meeting not found." };
      }
      if (meeting.status === "cancelled") {
        return { ok: false, error: "This meeting was cancelled." };
      }

      const teacher = state.teachers.find((t) => t.id === meeting.teacherId);
      const parentName = user.name;
      const parentMsg: MeetingChatMessage = {
        id: uid("mchat"),
        meetingId,
        senderRole: "parent",
        senderName: parentName,
        text: trimmed,
        sentAt: new Date().toISOString(),
      };

      // Simulated in-platform teacher reply (demo)
      const reply: MeetingChatMessage = {
        id: uid("mchat"),
        meetingId,
        senderRole: "teacher",
        senderName: teacher?.name ?? "Teacher",
        text: buildTeacherChatReply(trimmed, meeting.topic, teacher?.name ?? "your teacher"),
        sentAt: new Date(Date.now() + 900).toISOString(),
      };

      setState((prev) => ({
        ...prev,
        meetingChats: [reply, parentMsg, ...prev.meetingChats],
        teacherMeetings: prev.teacherMeetings.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                sessionStatus: m.sessionStatus === "ended" ? m.sessionStatus : "active",
                lastEngagedAt: new Date().toISOString(),
              }
            : m,
        ),
      }));

      return { ok: true };
    },
    [user, state.teacherMeetings, state.teachers],
  );

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

  const getStaffPerson = useCallback(
    (personType: StaffPersonType, personId: string) => {
      if (personType === "teacher") {
        const teacher = state.teachers.find((t) => t.id === personId);
        if (!teacher) return undefined;
        return {
          type: "teacher" as const,
          teacher,
          name: teacher.name,
          subtitle: `${teacher.department} · ${teacher.subject}`,
          phone: teacher.phone,
          monthlySalary: teacher.monthlySalary ?? 40000,
        };
      }
      const staff = state.staffMembers.find((s) => s.id === personId);
      if (!staff) return undefined;
      return {
        type: "staff" as const,
        staff,
        name: staff.name,
        subtitle: `${staff.department} · ${staff.roleTitle}`,
        phone: staff.phone,
        monthlySalary: staff.monthlySalary,
      };
    },
    [state.teachers, state.staffMembers],
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
      loginWithPhonePassword,
      requestParentOtp,
      loginWithParentOtp,
      activateParentBySchoolMobile,
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
      recordStaffSalaryPayout,
      holdStaffSalary,
      addStaffSalary,
      sendReminder,
      addScholarship,
      applyScholarshipAsParent,
      updateScholarshipStatus,
      autoReviewScholarship,
      autoReviewPendingScholarships,
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
      sendMeetingChat,
      startMeetingSession,
      endMeetingSession,
      rateTeacher,
      awardTeacherOfTheYear,
      getTeacherRatingSummary,
      toggleGateway,
      updateTenant,
      getStudent,
      getStaffPerson,
      getParentStudents,
      getOpenDues,
    }),
    [
      ready,
      user,
      login,
      loginWithCredentials,
      loginWithPhonePassword,
      requestParentOtp,
      loginWithParentOtp,
      activateParentBySchoolMobile,
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
      recordStaffSalaryPayout,
      holdStaffSalary,
      addStaffSalary,
      sendReminder,
      addScholarship,
      applyScholarshipAsParent,
      updateScholarshipStatus,
      autoReviewScholarship,
      autoReviewPendingScholarships,
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
      sendMeetingChat,
      startMeetingSession,
      endMeetingSession,
      rateTeacher,
      awardTeacherOfTheYear,
      getTeacherRatingSummary,
      toggleGateway,
      updateTenant,
      getStudent,
      getStaffPerson,
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
