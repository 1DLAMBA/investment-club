"use client";

import { useFormStatus } from "react-dom";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
