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

export type DueStatus = "upcoming" | "due_today" | "overdue" | "paid" | "partial";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cash";

export type PaymentStatus = "success" | "failed" | "pending" | "refunded";

export type NotificationChannel = "sms" | "email" | "whatsapp" | "push";

export type ScholarshipType =
  | "Merit Based"
  | "Sports Quota"
  | "Staff Child"
  | "Need Based"
  | "Government Sponsored";

export type ScholarshipStatus = "pending" | "approved" | "rejected" | "expired";

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
  admissionNo: string;
  name: string;
  className: string;
  section: string;
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

export interface Scholarship {
  id: string;
  studentId: string;
  type: ScholarshipType;
  mode: "percentage" | "fixed";
  value: number;
  effectiveFrom: string;
  expiresOn: string;
  status: ScholarshipStatus;
  notes: string;
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

export type MeetingMode = "in_person" | "video" | "phone";

export type MeetingBookingStatus = "booked" | "completed" | "cancelled";

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
  timeline: TeacherTimelineEvent[];
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
