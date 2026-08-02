"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Video, Link2, Volume2 } from "lucide-react";
import type { AICallLog } from "@/lib/types";
import { Button } from "@/components/ui";
import { formatINR } from "@/lib/format";

type Phase = "ringing" | "talking" | "done";

export function AIVideoCallModal({
  call,
  schoolName,
  onClose,
  onComplete,
}: {
  call: AICallLog;
  schoolName: string;
  onClose: () => void;
  onComplete: (paymentLinkSent: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>(call.status === "completed" ? "done" : "ringing");
  const [captionIndex, setCaptionIndex] = useState(0);

  const lines = useMemo(() => {
    const parts = call.script
      .split(/(?<=[।.?!])\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : [call.script];
  }, [call.script]);

  useEffect(() => {
    if (phase !== "ringing") return;
    const t = window.setTimeout(() => setPhase("talking"), 1800);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "talking") return;
    if (captionIndex >= lines.length - 1) {
      const t = window.setTimeout(() => setPhase("done"), 1600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCaptionIndex((i) => i + 1), 2200);
    return () => window.clearTimeout(t);
  }, [phase, captionIndex, lines.length]);

  useEffect(() => {
    if (phase === "done") onComplete(true);
    // intentionally once when done
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,20,24,0.72)] p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[#0d242c] text-white shadow-2xl"
        >
          <div className="relative aspect-[9/14] overflow-hidden bg-gradient-to-b from-[#1a4a56] via-[#12343d] to-[#0d242c]">
            <motion.div
              aria-hidden
              className="absolute inset-0 opacity-40"
              animate={{
                background: [
                  "radial-gradient(circle at 30% 20%, rgba(217,75,31,0.35), transparent 45%)",
                  "radial-gradient(circle at 70% 30%, rgba(15,107,124,0.4), transparent 50%)",
                  "radial-gradient(circle at 40% 60%, rgba(217,75,31,0.28), transparent 45%)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />

            <div className="absolute left-4 top-4 right-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                  {schoolName}
                </p>
                <p className="mt-1 text-sm font-semibold">{call.avatarName}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs font-semibold">
                <Video className="h-3.5 w-3.5" />
                AI video
              </span>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <motion.div
                className="relative grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-[#2a6f7c] to-[#d94b1f]"
                animate={
                  phase === "talking"
                    ? { scale: [1, 1.04, 1] }
                    : phase === "ringing"
                      ? { scale: [1, 1.08, 1] }
                      : { scale: 1 }
                }
                transition={{ duration: phase === "ringing" ? 0.9 : 2.2, repeat: Infinity }}
              >
                <span className="font-[family-name:var(--font-display)] text-4xl">
                  {call.avatarName.charAt(0)}
                </span>
                {phase === "ringing" ? (
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/30" />
                ) : null}
              </motion.div>

              <p className="mt-6 text-center text-lg font-semibold tracking-[-0.02em]">
                {phase === "ringing" && "Incoming gentle reminder…"}
                {phase === "talking" && "AI host is speaking"}
                {phase === "done" && "Message complete"}
              </p>
              <p className="mt-1 text-sm text-white/60">
                For {call.parentName} · {formatINR(call.amount)}
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-5 pb-5 pt-16">
              {phase === "talking" || phase === "done" ? (
                <div className="mb-4 flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-sm leading-relaxed backdrop-blur">
                  <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <p>{lines[Math.min(captionIndex, lines.length - 1)]}</p>
                </div>
              ) : (
                <p className="mb-4 text-center text-sm text-white/70">
                  Soft AI video call from your school — no pressure, just a clear fee reminder.
                </p>
              )}

              <div className="flex gap-2">
                {phase === "done" ? (
                  <>
                    <Button
                      className="flex-1 bg-white text-[var(--ink)] hover:bg-white/90"
                      onClick={onClose}
                    >
                      <Link2 className="h-4 w-4" /> Payment link sent
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
                      Close
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full bg-[#b42318] hover:bg-[#912018]"
                    onClick={() => {
                      onComplete(false);
                      onClose();
                    }}
                  >
                    <PhoneOff className="h-4 w-4" /> End call
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
