"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const variants =
    variant === "primary"
      ? "bg-brass text-ink hover:bg-brass-dark"
      : "border border-ink/15 bg-transparent text-ink hover:bg-ink/5";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${base} ${variants} ${className}`}
    >
      {pending && <Spinner />}
      <span>{pending ? "Working…" : children}</span>
    </button>
  );
}
