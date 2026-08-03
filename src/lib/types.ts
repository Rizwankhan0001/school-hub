export type Role =
  | "super_admin"
  | "school_admin"
  | "accountant"
  | "parent"
  | "student"
  | "support_agent";

export type FeeType =
  | "Admission Fee"
  | "Tuition Fee"
  | "Transport Fee"
  | "Hostel Fee"
  | "Library Fee"
  | "Laboratory Fee"
  | "Examination Fee"
  | "Sports Fee"
  | "Annual Fee"
  | "Miscellaneous Fee";

export type InstallmentPlan = "monthly" | "quarterly" | "half_yearly" | "annual";

export type FeePaymentCode = "annual_full" | "half_yearly" | "quarterly" | "monthly";

export interface FeePaymentOption {
  id: string;
  code: FeePaymentCode;
  name: string;
  tagline: string;
  description: string;
  installments: number;
  /** Percent off annual structure total */
  discountPercent: number;
  /** Optional convenience fee on the payable total */
  surchargePercent: number;
  highlight?: boolean;
  howItWorks: string[];
}

export type DueStatus = "upcoming" | "due_today" | "overdue" | "paid" | "partial";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cash";

export type PaymentStatus = "success" | "failed" | "pending" | "refunded";

export type NotificationChannel = "sms" | "email" | "whatsapp" | "push";

export type ScholarshipType =
  | "Merit Based"
  | "Sports Quota"
  | "Staff Child"
  | "Need Based"
  | "Government Sponsored"
  | "Scholarship Test";

export type ScholarshipStatus = "pending" | "approved" | "rejected" | "expired";

export type ScholarshipBasis =
  | "percentage_marks"
  | "scholarship_test"
  | "need_based_quota"
  | "sports_achievement"
  | "staff_child"
  | "government_quota";

export type ScholarshipAwardMode = "percentage" | "fixed" | "slab";

export interface ScholarshipAwardSlab {
  label: string;
  minScore: number;
  maxScore: number;
  mode: "percentage" | "fixed";
  value: number;
}

export interface ScholarshipProgram {
  id: string;
  name: string;
  type: ScholarshipType;
  basis: ScholarshipBasis;
  summary: string;
  conditions: string[];
  awardMode: ScholarshipAwardMode;
  /** Used when awardMode is percentage or fixed */
  awardValue: number;
  awardSlabs?: ScholarshipAwardSlab[];
  covers: string;
  maxAwardLabel: string;
  maxSeats: number;
  seatsFilled: number;
  academicSession: string;
  documentsRequired: string[];
  active: boolean;
}

export type FineMode = "fixed" | "daily" | "percentage";

export type SubscriptionPlan = "starter" | "growth" | "enterprise";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type AICallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "no_answer";

export type AICallType = "voice" | "video";

export type GatewayName = "Razorpay" | "PayU" | "Cashfree" | "Stripe" | "Paytm";

export interface School {
  id: string;
  name: string;
  logoInitials: string;
  city: string;
  academicSession: string;
  gstin: string;
  plan: SubscriptionPlan;
  studentsLimit: number;
  branches: number;
  status: "active" | "trial" | "suspended";
  mrr: number;
}

export interface Parent {
  id: string;
  name: string;
  mobile: string;
  email: string;
}

export interface Student {
  id: string;
  /** Unique student ID shown in school records (same as admission number in demo) */
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  rollNo?: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  house?: string;
  dateOfJoining?: string;
  avatarInitials?: string;
  emergencyContact?: string;
  remarks?: string;
  parentId: string;
  parentName: string;
  mobile: string;
  email: string;
  academicSession: string;
  status: "active" | "transferred" | "archived";
}

export interface FeeStructureItem {
  id: string;
  className: string;
  feeType: FeeType;
  amount: number;
  academicSession: string;
}

export interface Installment {
  id: string;
  className: string;
  plan: InstallmentPlan;
  name: string;
  amount: number;
  dueDate: string;
  academicSession: string;
}

export interface StudentFeeDue {
  id: string;
  studentId: string;
  installmentId: string;
  installmentName: string;
  amount: number;
  fine: number;
  paidAmount: number;
  dueDate: string;
  status: DueStatus;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  paidAt: string;
  dueIds: string[];
  gateway: GatewayName | string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  paymentId: string;
  studentId: string;
  amount: number;
  issuedAt: string;
  gstAmount: number;
}

export interface CommunicationLog {
  id: string;
  channel: NotificationChannel;
  event: string;
  recipient: string;
  studentId?: string;
  message: string;
  sentAt: string;
  status: "sent" | "failed" | "queued";
}

export type ScholarshipApplicant = "admin" | "parent";

export type SportsAchievementLevel = "district" | "state" | "national";

export interface Scholarship {
  id: string;
  studentId: string;
  programId?: string;
  type: ScholarshipType;
  basis?: ScholarshipBasis;
  mode: "percentage" | "fixed";
  value: number;
  qualifyingScore?: number;
  annualIncome?: number;
  sportsLevel?: SportsAchievementLevel;
  staffChildConfirmed?: boolean;
  governmentSanctionConfirmed?: boolean;
  documentsConfirmed?: boolean;
  appliedBy?: ScholarshipApplicant;
  effectiveFrom: string;
  expiresOn: string;
  status: ScholarshipStatus;
  notes: string;
  reviewNotes?: string;
  autoReviewedAt?: string;
}

export interface FineRule {
  id: string;
  name: string;
  mode: FineMode;
  value: number;
  graceDays: number;
  active: boolean;
}

export interface AICallLog {
  id: string;
  studentId: string;
  dueId?: string;
  parentName: string;
  mobile: string;
  language: "English" | "Hindi" | "Marathi" | "Tamil";
  callType: AICallType;
  amount: number;
  status: AICallStatus;
  riskScore: number;
  paymentLinkSent: boolean;
  calledAt: string;
  summary: string;
  script: string;
  avatarName: string;
}

export interface GentleReminderSettings {
  enabled: boolean;
  dailyCap: number;
  channels: NotificationChannel[];
  tone: "very_gentle" | "gentle" | "firm_polite";
  lastBatchAt?: string;
}

export interface SupportTicket {
  id: string;
  parentId: string;
  studentId?: string;
  subject: string;
  category: "payment" | "receipt" | "scholarship" | "general";
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: GatewayName;
  enabled: boolean;
  webhookUrl: string;
  autoReconcile: boolean;
  retryFailed: boolean;
  refundsEnabled: boolean;
  lastWebhookAt?: string;
}

export type MeetingTopic =
  | "Academics"
  | "Behaviour"
  | "Special education"
  | "Career guidance"
  | "Exam prep"
  | "Other";

export type MeetingMode = "in_person" | "video" | "phone" | "chat";

export type MeetingBookingStatus = "booked" | "completed" | "cancelled";

export type MeetingSessionStatus = "idle" | "active" | "ended";

export interface MeetingChatMessage {
  id: string;
  meetingId: string;
  senderRole: "parent" | "teacher";
  senderName: string;
  text: string;
  sentAt: string;
}

export interface TeacherClassAssignment {
  className: string;
  section?: string;
  subject: string;
}

export interface TeacherTimelineEvent {
  id: string;
  year: string;
  title: string;
  organization: string;
  kind: "education" | "career" | "certification" | "award";
  description: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  specialty: string;
  department: "Primary" | "Middle" | "Senior" | "Specialist";
  classes: string[];
  classAssignments: TeacherClassAssignment[];
  bio: string;
  room: string;
  avatarInitials: string;
  email: string;
  phone: string;
  joinedOn: string;
  yearsExperience: number;
  highestQualification: string;
  languagesSpoken: string[];
  highlights: string[];
  timeline: TeacherTimelineEvent[];
  /** Monthly gross salary the school pays this teacher */
  monthlySalary: number;
}

/** Non-teaching school employees (office, transport, security, etc.) */
export type StaffDepartment =
  | "Administration"
  | "Accounts"
  | "Transport"
  | "Support"
  | "Security"
  | "Library"
  | "Lab";

export interface StaffMember {
  id: string;
  name: string;
  roleTitle: string;
  department: StaffDepartment;
  employeeCode: string;
  email: string;
  phone: string;
  joinedOn: string;
  avatarInitials: string;
  status: "active" | "inactive";
  /** Monthly gross used when creating salary lines */
  monthlySalary: number;
}

export type StaffPersonType = "teacher" | "staff";

export type SalaryStatus = "due" | "paid" | "on_hold";

export type SalaryPayoutMethod = "bank_transfer" | "upi" | "cheque" | "cash";

/** Monthly salary the school owes teachers & other staff (accountant pays out) */
export interface StaffSalary {
  id: string;
  personType: StaffPersonType;
  personId: string;
  /** e.g. 2026-07 */
  periodKey: string;
  /** e.g. July 2026 */
  periodLabel: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  payBy: string;
  status: SalaryStatus;
  paidAt?: string;
  payoutMethod?: SalaryPayoutMethod;
  notes?: string;
}

export interface TeacherRating {
  id: string;
  teacherId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  ratedBy: string;
  ratedByRole: Role;
  ratedAt: string;
}

export interface TeacherYearAward {
  id: string;
  teacherId: string;
  academicYear: string;
  title: string;
  reason: string;
  awardedAt: string;
  awardedBy: string;
}

/** Weekly recurring availability window used to generate 20-minute slots */
export interface TeacherWeeklyWindow {
  teacherId: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface TeacherSlot {
  id: string;
  teacherId: string;
  startAt: string;
  endAt: string;
  status: "open" | "booked";
}

export interface TeacherMeeting {
  id: string;
  slotId: string;
  teacherId: string;
  parentId: string;
  studentId: string;
  topic: MeetingTopic;
  mode: MeetingMode;
  notes: string;
  status: MeetingBookingStatus;
  bookedAt: string;
  sessionStatus?: MeetingSessionStatus;
  lastEngagedAt?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  parentId?: string;
  schoolId: string;
  /** Demo-only credential stored locally — not for production */
  password?: string;
  schoolName?: string;
  phone?: string;
  createdAt?: string;
}
