import type {
  AICallLog,
  CommunicationLog,
  FeeStructureItem,
  FineRule,
  Installment,
  Parent,
  Payment,
  PaymentGatewayConfig,
  Receipt,
  Scholarship,
  School,
  SessionUser,
  Student,
  StudentFeeDue,
  SupportTicket,
  Teacher,
  TeacherMeeting,
  TeacherRating,
  TeacherSlot,
  TeacherWeeklyWindow,
  TeacherYearAward,
} from "./types";

export const SLOT_MINUTES = 20;

export const school: School = {
  id: "sch_001",
  name: "Horizon Public School",
  logoInitials: "HP",
  city: "Pune",
  academicSession: "2025-26",
  gstin: "27AABCH1234M1Z5",
  plan: "growth",
  studentsLimit: 2000,
  branches: 2,
  status: "active",
  mrr: 7999,
};

export const tenantSchools: School[] = [
  school,
  {
    id: "sch_002",
    name: "Greenfield Academy",
    logoInitials: "GA",
    city: "Bengaluru",
    academicSession: "2025-26",
    gstin: "29AABCG9988K1Z2",
    plan: "starter",
    studentsLimit: 500,
    branches: 1,
    status: "trial",
    mrr: 2999,
  },
  {
    id: "sch_003",
    name: "National Coaching Hub",
    logoInitials: "NC",
    city: "Delhi",
    academicSession: "2025-26",
    gstin: "07AABCN4411P1Z8",
    plan: "enterprise",
    studentsLimit: 99999,
    branches: 6,
    status: "active",
    mrr: 24999,
  },
];

export const parents: Parent[] = [
  {
    id: "par_001",
    name: "Rajesh Sharma",
    mobile: "+91 98765 43210",
    email: "rajesh.sharma@email.com",
  },
  {
    id: "par_002",
    name: "Priya Patel",
    mobile: "+91 98220 11884",
    email: "priya.patel@email.com",
  },
  {
    id: "par_003",
    name: "Amit Verma",
    mobile: "+91 97654 22110",
    email: "amit.verma@email.com",
  },
  {
    id: "par_004",
    name: "Neha Kapoor",
    mobile: "+91 99001 44556",
    email: "neha.kapoor@email.com",
  },
];

export const students: Student[] = [
  {
    id: "stu_001",
    admissionNo: "ADM-2025-0142",
    name: "Aarav Sharma",
    className: "Class 5",
    section: "A",
    parentId: "par_001",
    parentName: "Rajesh Sharma",
    mobile: "+91 98765 43210",
    email: "rajesh.sharma@email.com",
    academicSession: "2025-26",
    status: "active",
  },
  {
    id: "stu_002",
    admissionNo: "ADM-2025-0087",
    name: "Ananya Patel",
    className: "Class 3",
    section: "B",
    parentId: "par_002",
    parentName: "Priya Patel",
    mobile: "+91 98220 11884",
    email: "priya.patel@email.com",
    academicSession: "2025-26",
    status: "active",
  },
  {
    id: "stu_003",
    admissionNo: "ADM-2025-0211",
    name: "Vihaan Verma",
    className: "Class 8",
    section: "A",
    parentId: "par_003",
    parentName: "Amit Verma",
    mobile: "+91 97654 22110",
    email: "amit.verma@email.com",
    academicSession: "2025-26",
    status: "active",
  },
  {
    id: "stu_004",
    admissionNo: "ADM-2025-0034",
    name: "Ishita Kapoor",
    className: "Class 1",
    section: "A",
    parentId: "par_004",
    parentName: "Neha Kapoor",
    mobile: "+91 99001 44556",
    email: "neha.kapoor@email.com",
    academicSession: "2025-26",
    status: "active",
  },
  {
    id: "stu_005",
    admissionNo: "ADM-2024-1190",
    name: "Kabir Sharma",
    className: "Class 5",
    section: "A",
    parentId: "par_001",
    parentName: "Rajesh Sharma",
    mobile: "+91 98765 43210",
    email: "rajesh.sharma@email.com",
    academicSession: "2025-26",
    status: "active",
  },
  {
    id: "stu_006",
    admissionNo: "ADM-2025-0178",
    name: "Meera Joshi",
    className: "Class 8",
    section: "B",
    parentId: "par_003",
    parentName: "Amit Verma",
    mobile: "+91 97654 22110",
    email: "amit.verma@email.com",
    academicSession: "2025-26",
    status: "transferred",
  },
];

export const feeStructures: FeeStructureItem[] = [
  { id: "fs_01", className: "Class 1", feeType: "Admission Fee", amount: 5000, academicSession: "2025-26" },
  { id: "fs_02", className: "Class 1", feeType: "Tuition Fee", amount: 30000, academicSession: "2025-26" },
  { id: "fs_03", className: "Class 1", feeType: "Transport Fee", amount: 12000, academicSession: "2025-26" },
  { id: "fs_04", className: "Class 3", feeType: "Admission Fee", amount: 5000, academicSession: "2025-26" },
  { id: "fs_05", className: "Class 3", feeType: "Tuition Fee", amount: 36000, academicSession: "2025-26" },
  { id: "fs_06", className: "Class 3", feeType: "Library Fee", amount: 2000, academicSession: "2025-26" },
  { id: "fs_07", className: "Class 5", feeType: "Tuition Fee", amount: 40000, academicSession: "2025-26" },
  { id: "fs_08", className: "Class 5", feeType: "Transport Fee", amount: 14000, academicSession: "2025-26" },
  { id: "fs_09", className: "Class 5", feeType: "Examination Fee", amount: 3000, academicSession: "2025-26" },
  { id: "fs_10", className: "Class 8", feeType: "Tuition Fee", amount: 48000, academicSession: "2025-26" },
  { id: "fs_11", className: "Class 8", feeType: "Laboratory Fee", amount: 5000, academicSession: "2025-26" },
  { id: "fs_12", className: "Class 8", feeType: "Sports Fee", amount: 2500, academicSession: "2025-26" },
];

export const installments: Installment[] = [
  { id: "ins_q1_c5", className: "Class 5", plan: "quarterly", name: "Q1", amount: 14250, dueDate: "2025-04-10", academicSession: "2025-26" },
  { id: "ins_q2_c5", className: "Class 5", plan: "quarterly", name: "Q2", amount: 14250, dueDate: "2025-07-10", academicSession: "2025-26" },
  { id: "ins_q3_c5", className: "Class 5", plan: "quarterly", name: "Q3", amount: 14250, dueDate: "2025-10-10", academicSession: "2025-26" },
  { id: "ins_q4_c5", className: "Class 5", plan: "quarterly", name: "Q4", amount: 14250, dueDate: "2026-01-10", academicSession: "2025-26" },
  { id: "ins_q1_c1", className: "Class 1", plan: "quarterly", name: "Q1", amount: 11750, dueDate: "2025-04-10", academicSession: "2025-26" },
  { id: "ins_q2_c1", className: "Class 1", plan: "quarterly", name: "Q2", amount: 11750, dueDate: "2025-07-10", academicSession: "2025-26" },
  { id: "ins_q3_c1", className: "Class 1", plan: "quarterly", name: "Q3", amount: 11750, dueDate: "2025-10-10", academicSession: "2025-26" },
  { id: "ins_q4_c1", className: "Class 1", plan: "quarterly", name: "Q4", amount: 11750, dueDate: "2026-01-10", academicSession: "2025-26" },
  { id: "ins_q1_c3", className: "Class 3", plan: "quarterly", name: "Q1", amount: 10750, dueDate: "2025-04-10", academicSession: "2025-26" },
  { id: "ins_q2_c3", className: "Class 3", plan: "quarterly", name: "Q2", amount: 10750, dueDate: "2025-07-10", academicSession: "2025-26" },
  { id: "ins_s1_c8", className: "Class 8", plan: "half_yearly", name: "Semester 1", amount: 27750, dueDate: "2025-04-15", academicSession: "2025-26" },
  { id: "ins_s2_c8", className: "Class 8", plan: "half_yearly", name: "Semester 2", amount: 27750, dueDate: "2025-10-15", academicSession: "2025-26" },
];

/** Reference "today" for consistent demo due categories */
export const DEMO_TODAY = "2026-08-02";

export const dues: StudentFeeDue[] = [
  {
    id: "due_001",
    studentId: "stu_001",
    installmentId: "ins_q3_c5",
    installmentName: "Q3 Tuition + Transport",
    amount: 14250,
    fine: 150,
    paidAmount: 0,
    dueDate: "2025-10-10",
    status: "overdue",
  },
  {
    id: "due_002",
    studentId: "stu_001",
    installmentId: "ins_q4_c5",
    installmentName: "Q4 Tuition + Transport",
    amount: 14250,
    fine: 0,
    paidAmount: 0,
    dueDate: "2026-01-10",
    status: "overdue",
  },
  {
    id: "due_003",
    studentId: "stu_005",
    installmentId: "ins_q3_c5",
    installmentName: "Q3 Tuition + Transport",
    amount: 14250,
    fine: 100,
    paidAmount: 0,
    dueDate: "2025-10-10",
    status: "overdue",
  },
  {
    id: "due_004",
    studentId: "stu_002",
    installmentId: "ins_q2_c3",
    installmentName: "Q2 Tuition",
    amount: 10750,
    fine: 0,
    paidAmount: 5000,
    dueDate: "2025-07-10",
    status: "partial",
  },
  {
    id: "due_005",
    studentId: "stu_004",
    installmentId: "ins_q3_c1",
    installmentName: "Q3 Fee",
    amount: 11750,
    fine: 0,
    paidAmount: 0,
    dueDate: "2026-08-02",
    status: "due_today",
  },
  {
    id: "due_006",
    studentId: "stu_003",
    installmentId: "ins_s2_c8",
    installmentName: "Semester 2",
    amount: 27750,
    fine: 0,
    paidAmount: 0,
    dueDate: "2026-08-09",
    status: "upcoming",
  },
  {
    id: "due_007",
    studentId: "stu_002",
    installmentId: "ins_q1_c3",
    installmentName: "Q1 Tuition",
    amount: 10750,
    fine: 0,
    paidAmount: 10750,
    dueDate: "2025-04-10",
    status: "paid",
  },
  {
    id: "due_008",
    studentId: "stu_001",
    installmentId: "ins_q1_c5",
    installmentName: "Q1 Tuition + Transport",
    amount: 14250,
    fine: 0,
    paidAmount: 14250,
    dueDate: "2025-04-10",
    status: "paid",
  },
  {
    id: "due_009",
    studentId: "stu_001",
    installmentId: "ins_q2_c5",
    installmentName: "Q2 Tuition + Transport",
    amount: 14250,
    fine: 0,
    paidAmount: 14250,
    dueDate: "2025-07-10",
    status: "paid",
  },
];

export const payments: Payment[] = [
  {
    id: "pay_001",
    studentId: "stu_001",
    amount: 14250,
    method: "upi",
    status: "success",
    transactionId: "TXN-RZ-884201",
    paidAt: "2025-04-08T10:22:00+05:30",
    dueIds: ["due_008"],
    gateway: "Razorpay",
  },
  {
    id: "pay_002",
    studentId: "stu_001",
    amount: 14250,
    method: "card",
    status: "success",
    transactionId: "TXN-RZ-901145",
    paidAt: "2025-07-09T16:05:00+05:30",
    dueIds: ["due_009"],
    gateway: "Razorpay",
  },
  {
    id: "pay_003",
    studentId: "stu_002",
    amount: 10750,
    method: "netbanking",
    status: "success",
    transactionId: "TXN-PU-220981",
    paidAt: "2025-04-09T11:40:00+05:30",
    dueIds: ["due_007"],
    gateway: "PayU",
  },
  {
    id: "pay_004",
    studentId: "stu_002",
    amount: 5000,
    method: "upi",
    status: "success",
    transactionId: "TXN-RZ-993310",
    paidAt: "2025-08-01T09:15:00+05:30",
    dueIds: ["due_004"],
    gateway: "Razorpay",
  },
];

export const receipts: Receipt[] = [
  {
    id: "rec_001",
    receiptNo: "REC-2025-000088",
    paymentId: "pay_001",
    studentId: "stu_001",
    amount: 14250,
    issuedAt: "2025-04-08T10:22:10+05:30",
    gstAmount: 0,
  },
  {
    id: "rec_002",
    receiptNo: "REC-2025-000156",
    paymentId: "pay_002",
    studentId: "stu_001",
    amount: 14250,
    issuedAt: "2025-07-09T16:05:12+05:30",
    gstAmount: 0,
  },
  {
    id: "rec_003",
    receiptNo: "REC-2025-000091",
    paymentId: "pay_003",
    studentId: "stu_002",
    amount: 10750,
    issuedAt: "2025-04-09T11:40:20+05:30",
    gstAmount: 0,
  },
  {
    id: "rec_004",
    receiptNo: "REC-2026-000012",
    paymentId: "pay_004",
    studentId: "stu_002",
    amount: 5000,
    issuedAt: "2025-08-01T09:15:08+05:30",
    gstAmount: 0,
  },
];

export const communications: CommunicationLog[] = [
  {
    id: "com_001",
    channel: "whatsapp",
    event: "Due Reminder",
    recipient: "+91 98765 43210",
    studentId: "stu_001",
    message:
      "Dear Parent, Your child’s fee of ₹14,250 is overdue for Aarav Sharma. Please pay at the earliest.",
    sentAt: "2026-07-28T09:00:00+05:30",
    status: "sent",
  },
  {
    id: "com_002",
    channel: "sms",
    event: "Payment Success",
    recipient: "+91 98220 11884",
    studentId: "stu_002",
    message: "Payment of ₹5,000 received for Ananya Patel. Receipt REC-2026-000012 issued.",
    sentAt: "2025-08-01T09:15:30+05:30",
    status: "sent",
  },
  {
    id: "com_003",
    channel: "email",
    event: "Fee Generated",
    recipient: "neha.kapoor@email.com",
    studentId: "stu_004",
    message: "Q3 fee of ₹11,750 for Ishita Kapoor is due today. Pay online via EduFee360.",
    sentAt: "2026-08-02T08:00:00+05:30",
    status: "sent",
  },
  {
    id: "com_004",
    channel: "sms",
    event: "Due Reminder",
    recipient: "+91 97654 22110",
    studentId: "stu_003",
    message: "Reminder: Semester 2 fee ₹27,750 for Vihaan Verma is due on 09 Aug 2026.",
    sentAt: "2026-08-01T18:30:00+05:30",
    status: "queued",
  },
];

export const scholarships: Scholarship[] = [
  {
    id: "schlr_001",
    studentId: "stu_002",
    type: "Merit Based",
    mode: "percentage",
    value: 20,
    effectiveFrom: "2025-04-01",
    expiresOn: "2026-03-31",
    status: "approved",
    notes: "Top 5% class rank — 20% tuition waiver",
  },
  {
    id: "schlr_002",
    studentId: "stu_003",
    type: "Sports Quota",
    mode: "fixed",
    value: 10000,
    effectiveFrom: "2025-04-01",
    expiresOn: "2026-03-31",
    status: "pending",
    notes: "State-level athletics — awaiting principal approval",
  },
  {
    id: "schlr_003",
    studentId: "stu_005",
    type: "Staff Child",
    mode: "percentage",
    value: 50,
    effectiveFrom: "2025-04-01",
    expiresOn: "2026-03-31",
    status: "approved",
    notes: "Faculty dependent discount",
  },
];

export const fineRules: FineRule[] = [
  {
    id: "fine_01",
    name: "Fixed late fee",
    mode: "fixed",
    value: 100,
    graceDays: 3,
    active: true,
  },
  {
    id: "fine_02",
    name: "Daily delay fine",
    mode: "daily",
    value: 10,
    graceDays: 0,
    active: true,
  },
  {
    id: "fine_03",
    name: "Percentage overdue",
    mode: "percentage",
    value: 2,
    graceDays: 7,
    active: false,
  },
];

export const aiCalls: AICallLog[] = [
  {
    id: "ai_001",
    studentId: "stu_001",
    dueId: "due_001",
    parentName: "Rajesh Sharma",
    mobile: "+91 98765 43210",
    language: "Hindi",
    callType: "video",
    amount: 14400,
    status: "completed",
    riskScore: 78,
    paymentLinkSent: true,
    calledAt: "2026-07-30T11:20:00+05:30",
    summary: "AI video call completed. Parent watched full message and opened the payment link.",
    script:
      "नमस्ते राजेश जी, मैं Horizon Public School की AI सहायक हूँ। आरव शर्मा की Q3 फीस अभी बाकी है। कृपया सुविधा होने पर पेमेंट लिंक से भुगतान कर दें।",
    avatarName: "Asha — School AI Host",
  },
  {
    id: "ai_002",
    studentId: "stu_005",
    dueId: "due_003",
    parentName: "Rajesh Sharma",
    mobile: "+91 98765 43210",
    language: "English",
    callType: "voice",
    amount: 14350,
    status: "no_answer",
    riskScore: 64,
    paymentLinkSent: false,
    calledAt: "2026-07-31T17:05:00+05:30",
    summary: "No answer after 2 rings. Queued for a gentler video retry.",
    script:
      "Hello Rajesh, this is an AI reminder from Horizon Public School about Kabir Sharma’s pending fee.",
    avatarName: "Kabir — Collection Concierge",
  },
  {
    id: "ai_003",
    studentId: "stu_002",
    dueId: "due_004",
    parentName: "Priya Patel",
    mobile: "+91 98220 11884",
    language: "English",
    callType: "video",
    amount: 5750,
    status: "queued",
    riskScore: 41,
    paymentLinkSent: false,
    calledAt: "2026-08-02T10:00:00+05:30",
    summary: "Gentle AI video reminder queued for partial dues.",
    script:
      "Hello Priya, this is an AI video message from Horizon Public School. A partial fee for Ananya Patel is still open. Please pay when convenient.",
    avatarName: "Meera — Parent Care Avatar",
  },
];

export const gentleReminderSettings: {
  enabled: boolean;
  dailyCap: number;
  channels: Array<"whatsapp" | "sms" | "push" | "email">;
  tone: "very_gentle" | "gentle" | "firm_polite";
  lastBatchAt?: string;
} = {
  enabled: true,
  dailyCap: 5,
  channels: ["whatsapp", "sms", "push"],
  tone: "gentle",
  lastBatchAt: undefined,
};

export const tickets: SupportTicket[] = [
  {
    id: "tkt_001",
    parentId: "par_001",
    studentId: "stu_001",
    subject: "Q3 fine looks incorrect",
    category: "payment",
    description: "Fine of ₹150 applied — please recheck grace period.",
    status: "in_progress",
    createdAt: "2026-07-29T14:10:00+05:30",
    updatedAt: "2026-07-30T09:00:00+05:30",
  },
  {
    id: "tkt_002",
    parentId: "par_002",
    studentId: "stu_002",
    subject: "Need receipt PDF for April payment",
    category: "receipt",
    description: "Unable to download REC-2025-000091 from the app.",
    status: "resolved",
    createdAt: "2026-07-20T11:00:00+05:30",
    updatedAt: "2026-07-21T16:40:00+05:30",
  },
];

export const gateways: PaymentGatewayConfig[] = [
  {
    id: "gw_rz",
    name: "Razorpay",
    enabled: true,
    webhookUrl: "https://api.edufee360.com/webhooks/razorpay",
    autoReconcile: true,
    retryFailed: true,
    refundsEnabled: true,
    lastWebhookAt: "2026-08-01T09:15:10+05:30",
  },
  {
    id: "gw_pu",
    name: "PayU",
    enabled: true,
    webhookUrl: "https://api.edufee360.com/webhooks/payu",
    autoReconcile: true,
    retryFailed: true,
    refundsEnabled: true,
    lastWebhookAt: "2025-04-09T11:40:25+05:30",
  },
  {
    id: "gw_cf",
    name: "Cashfree",
    enabled: false,
    webhookUrl: "https://api.edufee360.com/webhooks/cashfree",
    autoReconcile: true,
    retryFailed: true,
    refundsEnabled: false,
  },
  {
    id: "gw_st",
    name: "Stripe",
    enabled: false,
    webhookUrl: "https://api.edufee360.com/webhooks/stripe",
    autoReconcile: true,
    retryFailed: true,
    refundsEnabled: true,
  },
  {
    id: "gw_pt",
    name: "Paytm",
    enabled: false,
    webhookUrl: "https://api.edufee360.com/webhooks/paytm",
    autoReconcile: false,
    retryFailed: true,
    refundsEnabled: false,
  },
];

export const teachers: Teacher[] = [
  {
    id: "tch_001",
    name: "Ms. Kavita Nair",
    subject: "Mathematics",
    specialty: "Learning support & concept clearing",
    classes: ["Class 5", "Class 8"],
    classAssignments: [
      { className: "Class 5", section: "A", subject: "Mathematics" },
      { className: "Class 5", section: "B", subject: "Mathematics" },
      { className: "Class 8", section: "A", subject: "Mathematics" },
    ],
    bio: "Helps students who need extra clarity in maths — calm, structured sessions.",
    room: "Block B · Room 204",
    avatarInitials: "KN",
    email: "kavita.nair@horizon.edu",
    phone: "+91 98111 22001",
    joinedOn: "2019-06-10",
    yearsExperience: 11,
    highestQualification: "M.Sc. Mathematics, B.Ed.",
    timeline: [
      {
        id: "tl_kn_1",
        year: "2012",
        title: "B.Sc. Mathematics",
        organization: "Savitribai Phule Pune University",
        kind: "education",
        description: "Graduated with distinction; focus on algebra and pedagogy electives.",
      },
      {
        id: "tl_kn_2",
        year: "2014",
        title: "M.Sc. Mathematics + B.Ed.",
        organization: "SPPU / Tilak College of Education",
        kind: "education",
        description: "Completed dual track in advanced maths and secondary education.",
      },
      {
        id: "tl_kn_3",
        year: "2014–2019",
        title: "Maths Teacher",
        organization: "Green Valley High School",
        kind: "career",
        description: "Taught Classes 6–10; ran after-school concept clinics.",
      },
      {
        id: "tl_kn_4",
        year: "2019–present",
        title: "Senior Mathematics Teacher",
        organization: "Horizon Public School",
        kind: "career",
        description: "Leads Class 5 & 8 maths; mentors struggling learners.",
      },
      {
        id: "tl_kn_5",
        year: "2023",
        title: "Certificate in Remedial Pedagogy",
        organization: "NCERT Online",
        kind: "certification",
        description: "Specialised training for learning-support classrooms.",
      },
    ],
  },
  {
    id: "tch_002",
    name: "Mr. Rohan Deshmukh",
    subject: "Science",
    specialty: "Special education liaison",
    classes: ["Class 3", "Class 5", "Class 1"],
    classAssignments: [
      { className: "Class 1", section: "A", subject: "EVS / Science foundations" },
      { className: "Class 3", section: "B", subject: "Science" },
      { className: "Class 5", section: "A", subject: "Science" },
    ],
    bio: "Coordinates with parents on learning plans, attention support, and classroom strategies.",
    room: "Counselling Suite · 1F",
    avatarInitials: "RD",
    email: "rohan.deshmukh@horizon.edu",
    phone: "+91 98111 22002",
    joinedOn: "2020-04-01",
    yearsExperience: 9,
    highestQualification: "M.Sc. Zoology, Diploma in Special Education",
    timeline: [
      {
        id: "tl_rd_1",
        year: "2014",
        title: "B.Sc. Life Sciences",
        organization: "University of Mumbai",
        kind: "education",
        description: "Foundation in biology with community science outreach.",
      },
      {
        id: "tl_rd_2",
        year: "2016",
        title: "M.Sc. Zoology",
        organization: "University of Mumbai",
        kind: "education",
        description: "Research project on enquiry-based science learning.",
      },
      {
        id: "tl_rd_3",
        year: "2017–2020",
        title: "Science & Inclusion Teacher",
        organization: "Aspire Inclusive Academy",
        kind: "career",
        description: "Supported mixed-ability classrooms and IEP meetings.",
      },
      {
        id: "tl_rd_4",
        year: "2019",
        title: "Diploma in Special Education",
        organization: "RCI-recognised institute",
        kind: "certification",
        description: "Focus on ADHD-friendly teaching and parent coaching.",
      },
      {
        id: "tl_rd_5",
        year: "2020–present",
        title: "Science Teacher & SpEd Liaison",
        organization: "Horizon Public School",
        kind: "career",
        description: "Bridges classroom teachers, counsellors, and parents.",
      },
    ],
  },
  {
    id: "tch_003",
    name: "Ms. Fatima Sheikh",
    subject: "English",
    specialty: "Reading & communication",
    classes: ["Class 1", "Class 3", "Class 5"],
    classAssignments: [
      { className: "Class 1", section: "A", subject: "English" },
      { className: "Class 3", section: "B", subject: "English" },
      { className: "Class 5", section: "A", subject: "English" },
      { className: "Class 5", section: "B", subject: "English Literature" },
    ],
    bio: "Parent meetings about reading progress, language confidence, and homework habits.",
    room: "Library annex",
    avatarInitials: "FS",
    email: "fatima.sheikh@horizon.edu",
    phone: "+91 98111 22003",
    joinedOn: "2018-07-15",
    yearsExperience: 13,
    highestQualification: "M.A. English Literature, B.Ed.",
    timeline: [
      {
        id: "tl_fs_1",
        year: "2009",
        title: "B.A. English",
        organization: "Jamia Millia Islamia",
        kind: "education",
        description: "Literature major with theatre and debate electives.",
      },
      {
        id: "tl_fs_2",
        year: "2011",
        title: "M.A. English + B.Ed.",
        organization: "Jamia Millia Islamia",
        kind: "education",
        description: "Special interest in early literacy methods.",
      },
      {
        id: "tl_fs_3",
        year: "2012–2018",
        title: "English Teacher",
        organization: "St. Mary's Primary School",
        kind: "career",
        description: "Built reading clubs and parent storytelling workshops.",
      },
      {
        id: "tl_fs_4",
        year: "2018–present",
        title: "Lead English Teacher (Primary)",
        organization: "Horizon Public School",
        kind: "career",
        description: "Owns English for Classes 1–5 and library reading programme.",
      },
      {
        id: "tl_fs_5",
        year: "2022",
        title: "Best Communicator Award",
        organization: "Horizon Public School",
        kind: "award",
        description: "Recognised for parent engagement and student confidence gains.",
      },
    ],
  },
  {
    id: "tch_004",
    name: "Mr. Arjun Malhotra",
    subject: "Career & guidance",
    specialty: "Career counselling",
    classes: ["Class 8"],
    classAssignments: [
      { className: "Class 8", section: "A", subject: "Life skills & career guidance" },
      { className: "Class 8", section: "B", subject: "Life skills & career guidance" },
    ],
    bio: "Discusses subject choices, study planning, and next-step guidance for older students.",
    room: "Guidance Cell",
    avatarInitials: "AM",
    email: "arjun.malhotra@horizon.edu",
    phone: "+91 98111 22004",
    joinedOn: "2021-01-18",
    yearsExperience: 8,
    highestQualification: "MBA, Certified Career Counsellor",
    timeline: [
      {
        id: "tl_am_1",
        year: "2014",
        title: "B.Com.",
        organization: "Delhi University",
        kind: "education",
        description: "Commerce graduate with psychology electives.",
      },
      {
        id: "tl_am_2",
        year: "2016",
        title: "MBA (HR)",
        organization: "NMIMS",
        kind: "education",
        description: "People development and organisational behaviour.",
      },
      {
        id: "tl_am_3",
        year: "2016–2021",
        title: "Career Coach",
        organization: "Pathfinder Mentors",
        kind: "career",
        description: "Guided Class 8–12 students on streams and soft skills.",
      },
      {
        id: "tl_am_4",
        year: "2020",
        title: "Certified Career Counsellor",
        organization: "India Career Development Association",
        kind: "certification",
        description: "Assessment tools and parent counselling frameworks.",
      },
      {
        id: "tl_am_5",
        year: "2021–present",
        title: "Guidance Counsellor",
        organization: "Horizon Public School",
        kind: "career",
        description: "Runs Class 8 guidance periods and family planning meetings.",
      },
    ],
  },
];

export const teacherRatings: TeacherRating[] = [
  {
    id: "trate_001",
    teacherId: "tch_003",
    stars: 5,
    comment: "Parents leave meetings feeling heard. Outstanding reading progress notes.",
    ratedBy: "Sunita Desai",
    ratedByRole: "school_admin",
    ratedAt: "2026-06-12T10:00:00",
  },
  {
    id: "trate_002",
    teacherId: "tch_003",
    stars: 5,
    comment: "Runs the library hour brilliantly.",
    ratedBy: "Karan Mehta",
    ratedByRole: "accountant",
    ratedAt: "2026-07-01T09:30:00",
  },
  {
    id: "trate_003",
    teacherId: "tch_001",
    stars: 5,
    comment: "Patient with struggling maths students. Clear lesson plans.",
    ratedBy: "Sunita Desai",
    ratedByRole: "school_admin",
    ratedAt: "2026-05-20T11:15:00",
  },
  {
    id: "trate_004",
    teacherId: "tch_001",
    stars: 4,
    comment: "Strong results in Class 8 term tests.",
    ratedBy: "Leena Iyer",
    ratedByRole: "support_agent",
    ratedAt: "2026-07-18T14:00:00",
  },
  {
    id: "trate_005",
    teacherId: "tch_002",
    stars: 5,
    comment: "Excellent special-education coordination with families.",
    ratedBy: "Sunita Desai",
    ratedByRole: "school_admin",
    ratedAt: "2026-06-28T16:20:00",
  },
  {
    id: "trate_006",
    teacherId: "tch_004",
    stars: 4,
    comment: "Helpful career sessions for Class 8 parents.",
    ratedBy: "Sunita Desai",
    ratedByRole: "school_admin",
    ratedAt: "2026-04-10T12:00:00",
  },
];

export const teacherYearAwards: TeacherYearAward[] = [
  {
    id: "tya_001",
    teacherId: "tch_003",
    academicYear: "2024-25",
    title: "Teacher of the Year",
    reason: "Highest parent engagement and reading programme impact across primary classes.",
    awardedAt: "2025-03-28T17:00:00",
    awardedBy: "Sunita Desai",
  },
];

export const teacherWindows: TeacherWeeklyWindow[] = [
  // Kavita — Mon, Wed 4:00–6:00
  { teacherId: "tch_001", dayOfWeek: 1, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { teacherId: "tch_001", dayOfWeek: 3, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  // Rohan — Tue, Thu 3:00–5:00
  { teacherId: "tch_002", dayOfWeek: 2, startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 },
  { teacherId: "tch_002", dayOfWeek: 4, startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 },
  // Fatima — Mon, Fri 10:00–12:00
  { teacherId: "tch_003", dayOfWeek: 1, startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { teacherId: "tch_003", dayOfWeek: 5, startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  // Arjun — Sat 9:00–11:00
  { teacherId: "tch_004", dayOfWeek: 6, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoLocal(date: string, hour: number, minute: number) {
  return `${date}T${pad2(hour)}:${pad2(minute)}:00`;
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function generateTeacherSlots(
  fromDate = DEMO_TODAY,
  daysAhead = 14,
  windows = teacherWindows,
): TeacherSlot[] {
  const slots: TeacherSlot[] = [];
  let seq = 1;
  for (let offset = 0; offset < daysAhead; offset++) {
    const date = addDays(fromDate, offset);
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    for (const window of windows.filter((w) => w.dayOfWeek === dayOfWeek)) {
      let minutes = window.startHour * 60 + window.startMinute;
      const endMinutes = window.endHour * 60 + window.endMinute;
      while (minutes + SLOT_MINUTES <= endMinutes) {
        const startH = Math.floor(minutes / 60);
        const startM = minutes % 60;
        const endTotal = minutes + SLOT_MINUTES;
        const endH = Math.floor(endTotal / 60);
        const endM = endTotal % 60;
        slots.push({
          id: `tslot_${String(seq).padStart(4, "0")}`,
          teacherId: window.teacherId,
          startAt: toIsoLocal(date, startH, startM),
          endAt: toIsoLocal(date, endH, endM),
          status: "open",
        });
        seq += 1;
        minutes += SLOT_MINUTES;
      }
    }
  }
  return slots;
}

export const teacherSlots: TeacherSlot[] = generateTeacherSlots();

export const teacherMeetings: TeacherMeeting[] = [];

export const demoUsers: SessionUser[] = [
  {
    id: "usr_super",
    name: "Ananya Rao",
    email: "platform@edufee360.com",
    role: "super_admin",
    schoolId: "platform",
    password: "demo123",
  },
  {
    id: "usr_admin",
    name: "Sunita Desai",
    email: "admin@horizon.edu",
    role: "school_admin",
    schoolId: school.id,
    password: "demo123",
    schoolName: school.name,
  },
  {
    id: "usr_acct",
    name: "Karan Mehta",
    email: "accounts@horizon.edu",
    role: "accountant",
    schoolId: school.id,
    password: "demo123",
    schoolName: school.name,
  },
  {
    id: "usr_support",
    name: "Leena Iyer",
    email: "support@edufee360.com",
    role: "support_agent",
    schoolId: school.id,
    password: "demo123",
  },
  {
    id: "usr_parent",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@email.com",
    role: "parent",
    parentId: "par_001",
    schoolId: school.id,
    password: "demo123",
    phone: "+91 98765 43210",
    schoolName: school.name,
  },
];

export function createInitialState() {
  return {
    school,
    tenantSchools: [...tenantSchools],
    parents: [...parents],
    students: [...students],
    feeStructures: [...feeStructures],
    installments: [...installments],
    dues: [...dues],
    payments: [...payments],
    receipts: [...receipts],
    communications: [...communications],
    scholarships: [...scholarships],
    fineRules: [...fineRules],
    aiCalls: [...aiCalls],
    tickets: [...tickets],
    gateways: [...gateways],
    teachers: [...teachers],
    teacherSlots: [...teacherSlots],
    teacherMeetings: [...teacherMeetings],
    teacherRatings: [...teacherRatings],
    teacherYearAwards: [...teacherYearAwards],
    gentleReminders: {
      enabled: gentleReminderSettings.enabled,
      dailyCap: gentleReminderSettings.dailyCap,
      channels: [...gentleReminderSettings.channels],
      tone: gentleReminderSettings.tone,
      lastBatchAt: gentleReminderSettings.lastBatchAt,
    },
    accounts: [...demoUsers],
  };
}
