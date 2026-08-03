"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type {
  MeetingChatMessage,
  MeetingMode,
  Teacher,
  TeacherMeeting,
} from "@/lib/types";

type EngageMode = Extract<MeetingMode, "video" | "phone" | "chat">;

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MeetingEngageModal({
  meeting,
  teacher,
  studentName,
  mode,
  messages,
  onClose,
  onSendChat,
  onStart,
  onEnd,
}: {
  meeting: TeacherMeeting;
  teacher: Teacher;
  studentName: string;
  mode: EngageMode;
  messages: MeetingChatMessage[];
  onClose: () => void;
  onSendChat: (text: string) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const [phase, setPhase] = useState<"connecting" | "live" | "ended">(
    mode === "chat" ? "live" : "connecting",
  );
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(
    () => [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [messages],
  );

  useEffect(() => {
    onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "chat") return;
    if (phase !== "connecting") return;
    const t = window.setTimeout(() => setPhase("live"), 1600);
    return () => window.clearTimeout(t);
  }, [mode, phase]);

  useEffect(() => {
    if (phase !== "live" || mode === "chat") return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase, mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  function finish() {
    setPhase("ended");
    onEnd();
  }

  function send() {
    if (!draft.trim()) return;
    onSendChat(draft);
    setDraft("");
  }

  const title =
    mode === "video"
      ? "In-app video meeting"
      : mode === "phone"
        ? "In-app voice call"
        : "In-app teacher chat";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,12,16,0.72)] p-3 backdrop-blur-sm sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`relative w-full overflow-hidden rounded-[1.6rem] bg-white shadow-2xl ${
            mode === "chat" ? "max-w-lg" : "max-w-md"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                {title}
              </p>
              <p className="truncate font-semibold tracking-[-0.02em]">
                {teacher.name} · {meeting.topic}
              </p>
              <p className="text-xs text-[var(--muted)]">About {studentName}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (phase === "live" && mode !== "chat") finish();
                onClose();
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--bg)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {mode === "chat" ? (
            <div className="flex h-[min(70vh,520px)] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg)] px-4 py-4">
                {thread.length === 0 ? (
                  <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
                    Say hello to start the conversation. Everything stays inside EduFee360.
                  </p>
                ) : (
                  thread.map((m) => {
                    const mine = m.senderRole === "parent";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                            mine
                              ? "bg-[var(--ink)] text-white"
                              : "border border-[var(--line)] bg-white text-[var(--ink)]"
                          }`}
                        >
                          <p className={`text-[0.65rem] font-semibold ${mine ? "text-white/60" : "text-[var(--muted)]"}`}>
                            {m.senderName}
                          </p>
                          <p className="mt-1 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-[var(--line)] bg-white p-3">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Write a message…"
                    className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <Button type="button" onClick={send} disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-center text-[0.7rem] text-[var(--muted)]">
                  Secure school chat · no WhatsApp / phone app needed
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0d1a22] text-white">
              <div className="relative aspect-[9/13] overflow-hidden sm:aspect-[4/5]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,166,126,0.35),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(36,91,255,0.28),transparent_50%),linear-gradient(180deg,#14343f,#0d1a22)]" />

                {phase === "connecting" ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white/10 text-2xl font-bold">
                      {teacher.avatarInitials}
                    </span>
                    <p className="text-lg font-semibold">Connecting to {teacher.name}…</p>
                    <p className="text-sm text-white/65">
                      {mode === "video" ? "Starting secure video room" : "Starting secure voice line"}
                    </p>
                    <Badge tone="accent">In-platform · no external app</Badge>
                  </div>
                ) : null}

                {phase === "live" ? (
                  <div className="relative z-10 flex h-full flex-col p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/55">
                          Live · {formatElapsed(elapsed)}
                        </p>
                        <p className="mt-1 font-semibold">{teacher.name}</p>
                        <p className="text-sm text-white/65">{teacher.subject}</p>
                      </div>
                      <Badge tone="success">On EduFee360</Badge>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      {mode === "video" && !cameraOff ? (
                        <div className="relative w-full max-w-[220px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/10 shadow-xl">
                          <div className="aspect-[3/4] bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(0,166,126,0.25))]" />
                          <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold">
                            {teacher.name}
                          </p>
                        </div>
                      ) : (
                        <span className="grid h-28 w-28 place-items-center rounded-full bg-white/10 text-3xl font-bold">
                          {teacher.avatarInitials}
                        </span>
                      )}
                      <p className="max-w-xs text-center text-sm text-white/75">
                        {mode === "video"
                          ? cameraOff
                            ? "Camera off — voice continues in-app."
                            : "Demo video room with your child’s teacher. Stay on this screen."
                          : muted
                            ? "You are muted."
                            : "Voice call connected inside the parent portal."}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pb-2">
                      <button
                        type="button"
                        onClick={() => setMuted((v) => !v)}
                        className="grid h-12 w-12 place-items-center rounded-full bg-white/10"
                        aria-label={muted ? "Unmute" : "Mute"}
                      >
                        {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>
                      {mode === "video" ? (
                        <button
                          type="button"
                          onClick={() => setCameraOff((v) => !v)}
                          className="grid h-12 w-12 place-items-center rounded-full bg-white/10"
                          aria-label={cameraOff ? "Camera on" : "Camera off"}
                        >
                          {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={finish}
                        className="grid h-14 w-14 place-items-center rounded-full bg-[var(--danger)] text-white shadow-lg"
                        aria-label="End call"
                      >
                        <PhoneOff className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {phase === "ended" ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <CheckEnded mode={mode} />
                    <p className="text-lg font-semibold">Session ended</p>
                    <p className="text-sm text-white/65">
                      You met for {formatElapsed(elapsed)} about {meeting.topic}. Summary stays in
                      your meetings list.
                    </p>
                    <Button type="button" variant="soft" onClick={onClose}>
                      Back to meetings
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CheckEnded({ mode }: { mode: EngageMode }) {
  if (mode === "video") return <Video className="h-8 w-8 text-[var(--accent)]" />;
  if (mode === "phone") return <Phone className="h-8 w-8 text-[var(--accent)]" />;
  return <MessageCircle className="h-8 w-8 text-[var(--accent)]" />;
}
