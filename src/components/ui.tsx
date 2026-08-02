import { cn } from "@/lib/format";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[-0.01em] transition duration-200 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-[0.95rem]",
        variant === "primary" &&
          "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:translate-y-px",
        variant === "secondary" &&
          "bg-[var(--ink)] text-white hover:bg-[var(--ink-2)] active:translate-y-px",
        variant === "soft" &&
          "bg-[var(--surface-muted)] text-[var(--ink)] hover:bg-[#e8ebf0]",
        variant === "ghost" && "bg-transparent text-[var(--ink)] hover:bg-black/[0.04]",
        variant === "danger" && "bg-[var(--danger)] text-white hover:brightness-95",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.05em]",
        tone === "neutral" && "bg-[var(--surface-muted)] text-[var(--muted)]",
        tone === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        tone === "warning" && "bg-[var(--warn-soft)] text-[var(--warn)]",
        tone === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        tone === "info" && "bg-[var(--info-soft)] text-[var(--info)]",
        tone === "accent" && "bg-[var(--accent-soft)] text-[var(--accent-hover)]",
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[var(--ink-2)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[var(--muted-2)]">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-white px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(0,166,126,0.15)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-white px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(0,166,126,0.15)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-[2rem] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--ink)] sm:text-[2.4rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[0.98rem] leading-relaxed text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger" | "success" | "accent";
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white p-5">
      <p className="plain-label">{label}</p>
      <p
        className={cn(
          "mt-3 font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-none tracking-[-0.04em]",
          tone === "danger" && "text-[var(--danger)]",
          tone === "success" && "text-[var(--success)]",
          tone === "accent" && "text-[var(--accent-2)]",
          tone === "default" && "text-[var(--ink)]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[var(--muted-2)]">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
      <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em]">{title}</h2>
      {action}
    </div>
  );
}
