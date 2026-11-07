"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p
        role="alert"
        className="max-w-sm rounded-md border border-debit/30 bg-paper px-4 py-3 text-sm text-debit"
      >
        {error.message || "Something went wrong."}
      </p>
      <button
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-md border border-ink/15 bg-paper px-4 text-sm font-medium text-ink hover:bg-ink/5"
      >
        Try again
      </button>
    </div>
  );
}
