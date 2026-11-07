"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/lib/actions";

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    // A submission just finished (pending flipped true -> false) with no
    // error. Reload so server-rendered data on this page (stats, lists,
    // etc.) reflects the mutation. router.refresh() was tried first but
    // Next.js's client-side router/prefetch cache kept serving stale RSC
    // payloads for this route after a useActionState-driven submission; a
    // full reload sidesteps that cache entirely and is an acceptable
    // trade-off for an admin tool that mutates occasionally, not per click.
    if (wasPending.current && !isPending && !state?.error) {
      window.location.reload();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p
          role="alert"
          className="col-span-full mb-4 rounded-md border border-debit/30 bg-debit/5 px-3 py-2 text-sm text-debit"
        >
          {state.error}
        </p>
      )}
      {children}
    </form>
  );
}
