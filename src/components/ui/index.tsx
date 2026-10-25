"use client";

/**
 * Componentes de interface no padrão shadcn/ui (cva + tailwind-merge),
 * escritos localmente para manter o sistema visual NEXO consistente.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Button */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45 active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: "bg-pink text-white hover:bg-pink-600",
        green: "bg-green text-paper hover:bg-green-700",
        outline: "border border-paper-line bg-paper-card text-ink hover:border-green/40 hover:bg-white",
        ghost: "text-ink-soft hover:bg-green-50 hover:text-green",
        subtle: "bg-green-50 text-green hover:bg-green-100",
        danger: "text-pink-700 hover:bg-pink-50",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4", lg: "h-11 px-6", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
export { buttonVariants };

/* ------------------------------------------------------------------ Card */
export function Card({ className, tone = "paper", ...p }: HTMLAttributes<HTMLDivElement> & { tone?: "paper" | "green" | "pink" | "white" }) {
  const tones = {
    paper: "bg-paper-card border-paper-line text-ink",
    white: "bg-white border-paper-line text-ink",
    green: "bg-green border-green-700 text-paper",
    pink: "bg-pink border-pink-600 text-white",
  };
  return <div className={cn("rounded-2xl border animate-rise min-w-0", tones[tone], className)} {...p} />;
}
export function CardHeader({ title, eyebrow, action, className, description }: { title: ReactNode; eyebrow?: ReactNode; action?: ReactNode; className?: string; description?: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-[.14em] opacity-60">{eyebrow}</div>}
        <h3 className="font-display text-[15px] font-semibold leading-snug">{title}</h3>
        {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
export function CardBody({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-4", className)} {...p} />;
}

/* ----------------------------------------------------------------- Badge */
const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-paper-deep text-ink-soft",
      green: "bg-green-100 text-green-700",
      pink: "bg-pink-100 text-pink-700",
      solidPink: "bg-pink text-white",
      solidGreen: "bg-green text-paper",
      amber: "bg-amber-100 text-amber",
      outline: "border border-paper-line text-ink-soft",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, ...p }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...p} />;
}

/* ----------------------------------------------------------------- Inputs */
const field = "w-full rounded-xl border border-paper-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-mute/70 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/15 transition";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} className={cn(field, "h-10", className)} {...p} />);
Input.displayName = "Input";
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => <textarea ref={ref} className={cn(field, "min-h-[90px] leading-relaxed", className)} {...p} />);
Textarea.displayName = "Textarea";
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, "h-10 cursor-pointer pr-8", className)} {...p}>{children}</select>;
}
export function Label({ children, hint, className }: { children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-ink-soft", className)}>
      {children}
      {hint && <span className="ml-1 font-normal text-ink-mute">{hint}</span>}
    </label>
  );
}
export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={className}><Label hint={hint}>{label}</Label>{children}</div>;
}

/** Campo de lista separada por vírgulas. */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => setText(value.join(", ")), [value]);
  return (
    <Input value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split(",").map((s) => s.trim()).filter(Boolean))} />
  );
}

/* ------------------------------------------------------------------- Tabs */
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[]; className?: string }) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1", className)} role="tablist">
      {items.map((it) => (
        <button key={it.value} role="tab" aria-selected={value === it.value} onClick={() => onChange(it.value)}
          className={cn("relative inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm transition",
            value === it.value ? "bg-green text-paper" : "text-ink-soft hover:bg-paper-deep")}>
          {it.label}
          {it.count !== undefined && <span className={cn("ml-1.5 text-[11px]", value === it.value ? "text-pink-300" : "text-ink-mute")}>{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Dialog */
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-green-900/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal className={cn("animate-rise flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-paper shadow-2xl sm:rounded-2xl", wide ? "sm:max-w-4xl" : "sm:max-w-xl")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <h2 className="font-display text-base font-semibold text-green">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X className="h-4 w-4" /></Button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-paper-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Progress */
export function Progress({ value, max = 100, tone = "green", className, target }: { value: number | null; max?: number; tone?: "green" | "pink"; className?: string; target?: number | null }) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("relative h-1.5 w-full overflow-visible rounded-full bg-paper-deep", className)}>
      <div className={cn("h-full rounded-full transition-all duration-700", tone === "pink" ? "bg-pink" : "bg-green-600")} style={{ width: `${pct}%` }} />
      {target !== undefined && target !== null && (
        <div className="absolute -top-1 h-3.5 w-0.5 rounded bg-pink" style={{ left: `${Math.min(100, (target / max) * 100)}%` }} title={`Meta: ${target}`} />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Empty */
export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paper-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-green-300">{icon}</div>}
      <p className="font-display text-sm font-semibold text-green">{title}</p>
      {children && <p className="mt-1 max-w-sm text-xs text-ink-mute">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-paper-deep", className)} />;
}
