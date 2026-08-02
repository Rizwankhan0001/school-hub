import type { NotificationChannel } from "./types";

export const GENTLE_TEMPLATES = [
  {
    event: "Gentle Reminder",
    build: (parent: string, student: string, amount: string, school: string) =>
      `Hi ${parent}, a soft note from ${school}: ${student}'s fee of ${amount} is still open. Pay anytime that works for you — we’re here to help.`,
  },
  {
    event: "Friendly Nudge",
    build: (parent: string, student: string, amount: string, school: string) =>
      `Dear ${parent}, just a gentle reminder from ${school}. ${amount} is pending for ${student}. No rush panic — a quick payment keeps everything smooth.`,
  },
  {
    event: "Kind Follow-up",
    build: (parent: string, student: string, amount: string, school: string) =>
      `${parent} ji, ${school} here with a warm reminder. ${student}'s installment of ${amount} is awaiting payment. Tap your parent portal when convenient.`,
  },
  {
    event: "Soft Due Note",
    build: (parent: string, student: string, amount: string, school: string) =>
      `Hello ${parent}, hoping you’re well. A small reminder: ${amount} remains for ${student}. Pay securely online whenever you’re ready.`,
  },
  {
    event: "Courteous Ping",
    build: (parent: string, student: string, amount: string, school: string) =>
      `From ${school}: a polite nudge that ${student}'s fee (${amount}) is still due. Thank you for supporting on-time collections.`,
  },
];

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function shuffleTake<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.max(0, Math.min(count, copy.length)));
}

export function buildVideoScript(input: {
  language: "English" | "Hindi" | "Marathi" | "Tamil";
  parentName: string;
  studentName: string;
  schoolName: string;
  amountLabel: string;
  installmentName: string;
}): string {
  const first = input.parentName.split(" ")[0] ?? "there";
  if (input.language === "Hindi") {
    return `नमस्ते ${first} जी, मैं ${input.schoolName} की AI सहायक हूँ। ${input.studentName} की ${input.installmentName} फीस ${input.amountLabel} अभी बाकी है। कृपया जब सुविधा हो, पेमेंट लिंक से भुगतान कर दें। धन्यवाद।`;
  }
  if (input.language === "Marathi") {
    return `नमस्कार ${first}, मी ${input.schoolName} ची AI सहाय्यक आहे. ${input.studentName} ची ${input.installmentName} फी ${input.amountLabel} बाकी आहे. सोयीनुसार पेमेंट लिंकवरून भरा. धन्यवाद.`;
  }
  if (input.language === "Tamil") {
    return `வணக்கம் ${first}, நான் ${input.schoolName} AI உதவியாளர். ${input.studentName} கான ${input.installmentName} கட்டணம் ${input.amountLabel} நிலுவையில் உள்ளது. வசதியான நேரத்தில் இணைப்பு வழியாக செலுத்துங்கள். நன்றி.`;
  }
  return `Hello ${first}, this is an AI video message from ${input.schoolName}. ${input.studentName}'s ${input.installmentName} of ${input.amountLabel} is still pending. Whenever convenient, please complete payment using the secure link we shared. Thank you for your support.`;
}

export const AVATAR_NAMES = [
  "Asha — School AI Host",
  "Kabir — Collection Concierge",
  "Meera — Parent Care Avatar",
  "Arjun — Fee Desk Assistant",
];

export function randomChannels(allowed: NotificationChannel[]): NotificationChannel {
  return pickRandom(allowed.length ? allowed : (["sms", "whatsapp", "push"] as NotificationChannel[]));
}
