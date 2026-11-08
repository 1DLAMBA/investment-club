"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref,
  label = "Back",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // If we got here via a link inside the app, history has more than
        // this one entry — go back to it. Otherwise (direct link, new tab)
        // there's nothing to go back to, so land on a sensible parent page.
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-paper"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          d="M12.5 15L7.5 10L12.5 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
