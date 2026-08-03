import type { Parent, Student } from "./types";

const FIRST_M = [
  "Aarav", "Vihaan", "Kabir", "Reyansh", "Arjun", "Advait", "Ishaan", "Vivaan",
  "Shaurya", "Atharv", "Rohan", "Kunal", "Yash", "Dev", "Krish", "Ayaan",
  "Rudra", "Neil", "Samar", "Dhruv", "Harsh", "Om", "Parth", "Rian",
  "Veer", "Laksh", "Aadi", "Kian", "Manav", "Nirvaan",
];

const FIRST_F = [
  "Ananya", "Ishita", "Meera", "Aanya", "Diya", "Kiara", "Myra", "Sara",
  "Anika", "Pari", "Riya", "Saanvi", "Navya", "Avni", "Ira", "Zara",
  "Trisha", "Nisha", "Pooja", "Kavya", "Shreya", "Tanvi", "Isha", "Aarohi",
  "Mira", "Prisha", "Siya", "Vanya", "Aisha", "Keya",
];

const LAST = [
  "Sharma", "Patel", "Verma", "Kapoor", "Joshi", "Singh", "Mehta", "Nair",
  "Reddy", "Iyer", "Khan", "Desai", "Gupta", "Malhotra", "Chopra", "Bose",
  "Pillai", "Rao", "Banerjee", "Kulkarni", "Saxena", "Agarwal", "Bhat", "Menon",
  "Chatterjee", "Shetty", "Pandey", "Tripathi", "Jain", "Das",
];

const PARENT_FIRST = [
  "Rajesh", "Priya", "Amit", "Neha", "Suresh", "Kavita", "Vikram", "Anjali",
  "Sanjay", "Deepa", "Ramesh", "Sunita", "Manoj", "Pooja", "Ashok", "Rekha",
  "Nitin", "Meena", "Prakash", "Seema", "Ajay", "Nandini", "Rahul", "Sneha",
  "Kiran", "Divya", "Gaurav", "Ritu", "Harish", "Swati",
];

const HOUSES = ["Emerald", "Sapphire", "Ruby", "Topaz"] as const;
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const STREETS = [
  "Palm Grove, Baner",
  "Lake View Apts, Kalyani Nagar",
  "Senapati Bapat Road",
  "Orchid Society, Wakad",
  "FC Road",
  "Koregaon Park",
  "Aundh Road",
  "Viman Nagar Phase 2",
  "Hinjewadi Phase 1",
  "Kothrud Karve Nagar",
  "Hadapsar Magarpatta",
  "Balewadi High Street",
  "Pimple Saudagar",
  "Baner Road",
  "Model Colony",
];

/** Rough real-school strength: ~750 across Classes 1–12 */
const CLASS_STRENGTH: Record<string, number> = {
  "Class 1": 72,
  "Class 2": 72,
  "Class 3": 70,
  "Class 4": 70,
  "Class 5": 68,
  "Class 6": 66,
  "Class 7": 64,
  "Class 8": 64,
  "Class 9": 58,
  "Class 10": 56,
  "Class 11": 46,
  "Class 12": 44,
};

function pad(n: number, width = 3) {
  return String(n).padStart(width, "0");
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function birthYearForClass(classNum: number) {
  // Session 2025-26 approx ages
  return 2025 - (5 + classNum);
}

function sectionsForStrength(count: number): string[] {
  if (count >= 60) return ["A", "B", "C"];
  return ["A", "B"];
}

function splitAcrossSections(total: number, sections: string[]): Record<string, number> {
  const base = Math.floor(total / sections.length);
  let rem = total % sections.length;
  const out: Record<string, number> = {};
  for (const s of sections) {
    out[s] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
  }
  return out;
}

function phoneForIndex(i: number) {
  const base = 9000000000 + ((i * 7919) % 899999999);
  const s = String(base);
  return `+91 ${s.slice(0, 5)} ${s.slice(5)}`;
}

export function buildParents(): Parent[] {
  const demo: Parent[] = [
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

  // ~1 parent per ~2.5 students → ~300 parents for 750 students
  const generated: Parent[] = [];
  for (let i = 5; i <= 300; i++) {
    const first = PARENT_FIRST[(i * 3) % PARENT_FIRST.length];
    const last = LAST[(i * 7) % LAST.length];
    const name = `${first} ${last}`;
    const mobile = phoneForIndex(i + 40);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@email.com`;
    generated.push({
      id: `par_${pad(i)}`,
      name,
      mobile,
      email,
    });
  }

  return [...demo, ...generated];
}

const FEATURED: Student[] = [
  {
    id: "stu_001",
    admissionNo: "ADM-2025-0142",
    name: "Aarav Sharma",
    className: "Class 5",
    section: "A",
    rollNo: "A01",
    gender: "Male",
    dateOfBirth: "2015-08-14",
    bloodGroup: "B+",
    address: "14 Palm Grove, Baner, Pune",
    house: "Emerald",
    dateOfJoining: "2020-04-02",
    avatarInitials: "AS",
    emergencyContact: "+91 98765 43210",
    remarks: "Strong in maths; transport user",
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
    rollNo: "B04",
    gender: "Female",
    dateOfBirth: "2017-03-22",
    bloodGroup: "O+",
    address: "9 Lake View Apts, Kalyani Nagar, Pune",
    house: "Sapphire",
    dateOfJoining: "2021-06-15",
    avatarInitials: "AP",
    emergencyContact: "+91 98220 11884",
    remarks: "Reading support recommended",
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
    rollNo: "A07",
    gender: "Male",
    dateOfBirth: "2012-11-05",
    bloodGroup: "A+",
    address: "27 Senapati Bapat Road, Pune",
    house: "Ruby",
    dateOfJoining: "2018-04-10",
    avatarInitials: "VV",
    emergencyContact: "+91 97654 22110",
    remarks: "Sports quota athlete",
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
    rollNo: "A05",
    gender: "Female",
    dateOfBirth: "2019-06-18",
    bloodGroup: "AB+",
    address: "3 Orchid Society, Wakad, Pune",
    house: "Topaz",
    dateOfJoining: "2024-04-01",
    avatarInitials: "IK",
    emergencyContact: "+91 99001 44556",
    remarks: "New admission 2024-25",
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
    rollNo: "A02",
    gender: "Male",
    dateOfBirth: "2015-01-30",
    bloodGroup: "B+",
    address: "14 Palm Grove, Baner, Pune",
    house: "Emerald",
    dateOfJoining: "2020-04-02",
    avatarInitials: "KS",
    emergencyContact: "+91 98765 43210",
    remarks: "Sibling of Aarav Sharma",
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
    rollNo: "B03",
    gender: "Female",
    dateOfBirth: "2012-09-12",
    bloodGroup: "O+",
    address: "55 FC Road, Pune",
    house: "Sapphire",
    dateOfJoining: "2019-04-08",
    avatarInitials: "MJ",
    emergencyContact: "+91 97654 22110",
    remarks: "Transferred mid-session",
    parentId: "par_003",
    parentName: "Amit Verma",
    mobile: "+91 97654 22110",
    email: "amit.verma@email.com",
    academicSession: "2025-26",
    status: "active",
  },
];

export function buildStudents(parents: Parent[]): Student[] {
  const usedAdmission = new Set(FEATURED.map((s) => s.admissionNo));
  const usedSlots = new Set(
    FEATURED.map((s) => `${s.className}|${s.section}|${s.rollNo}`),
  );

  // Count featured already placed per class/section
  const featuredCount: Record<string, number> = {};
  for (const s of FEATURED) {
    const key = `${s.className}|${s.section}`;
    featuredCount[key] = (featuredCount[key] ?? 0) + 1;
  }

  let nextId = 7;
  let admSeq = 1;
  const generated: Student[] = [];

  function nextAdmissionNo(): string {
    while (true) {
      const candidate = `ADM-2025-${pad(admSeq, 4)}`;
      admSeq += 1;
      if (!usedAdmission.has(candidate)) {
        usedAdmission.add(candidate);
        return candidate;
      }
    }
  }

  const classNames = Object.keys(CLASS_STRENGTH);

  for (const className of classNames) {
    const classNum = Number(className.replace(/\D/g, ""));
    const total = CLASS_STRENGTH[className];
    const sections = sectionsForStrength(total);
    const perSection = splitAcrossSections(total, sections);

    for (const section of sections) {
      const target = perSection[section];
      const already = featuredCount[`${className}|${section}`] ?? 0;
      let placed = already;
      let roll = 1;

      while (placed < target) {
        const rollNo = `${section}${pad(roll, 2)}`;
        const slot = `${className}|${section}|${rollNo}`;
        roll += 1;
        if (usedSlots.has(slot)) continue;

        const idx = nextId;
        const female = idx % 2 === 0;
        const first = female
          ? FIRST_F[idx % FIRST_F.length]
          : FIRST_M[idx % FIRST_M.length];
        // Offset last name so we don't repeat the same full name often
        const last = LAST[(idx * 11 + classNum * 3) % LAST.length];
        const name = `${first} ${last}`;
        const parent = parents[4 + ((idx - 1) % Math.max(1, parents.length - 4))] ?? parents[0];
        const by = birthYearForClass(classNum);
        const month = pad(((idx * 5) % 12) + 1, 2);
        const day = pad(((idx * 7) % 28) + 1, 2);
        const joinYear = Math.min(2025, by + 5);
        const statusRoll = idx % 97;
        const status: Student["status"] =
          statusRoll === 0 ? "archived" : statusRoll === 1 ? "transferred" : "active";

        generated.push({
          id: `stu_${pad(idx)}`,
          admissionNo: nextAdmissionNo(),
          name,
          className,
          section,
          rollNo,
          gender: female ? "Female" : "Male",
          dateOfBirth: `${by}-${month}-${day}`,
          bloodGroup: BLOOD[idx % BLOOD.length],
          address: `${(idx % 80) + 1} ${STREETS[idx % STREETS.length]}, Pune`,
          house: HOUSES[idx % HOUSES.length],
          dateOfJoining: `${joinYear}-04-${pad((idx % 20) + 1, 2)}`,
          avatarInitials: initialsOf(name),
          emergencyContact: parent.mobile,
          remarks: status === "active" ? "" : status === "transferred" ? "TC issued" : "Inactive",
          parentId: parent.id,
          parentName: parent.name,
          mobile: parent.mobile,
          email: parent.email,
          academicSession: "2025-26",
          status,
        });

        usedSlots.add(slot);
        placed += 1;
        nextId += 1;
      }
    }
  }

  const all = [...FEATURED, ...generated].sort((a, b) => {
    const na = Number(a.id.replace(/\D/g, ""));
    const nb = Number(b.id.replace(/\D/g, ""));
    return na - nb;
  });

  // Guarantee unique system IDs + admission numbers
  const ids = new Set<string>();
  const adms = new Set<string>();
  for (const s of all) {
    if (ids.has(s.id)) throw new Error(`Duplicate student id ${s.id}`);
    if (adms.has(s.admissionNo)) throw new Error(`Duplicate admission ${s.admissionNo}`);
    ids.add(s.id);
    adms.add(s.admissionNo);
  }

  if (all.length !== 750) {
    throw new Error(`Expected 750 students, got ${all.length}`);
  }

  return all;
}
