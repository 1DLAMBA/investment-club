"use client";

import { useActionState } from "react";
import { deleteUser, type ActionState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const action = deleteUser.bind(null, userId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Permanently delete ${userName}? This removes their account, wallet history, and investments. This can't be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      {state?.error && (
        <p role="alert" className="mb-3 text-sm text-debit">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-debit/30 px-4 py-2.5 text-sm font-medium text-debit transition-colors hover:bg-debit/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {isPending ? "Deleting…" : "Permanently delete this member"}
      </button>
    </form>
  );
}
