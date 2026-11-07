export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="15.5" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <path
        d="M11 16.5H29M13.5 23.5H26.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "h-8 w-8 text-brass",
  wordmarkClassName = "text-lg",
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span
        className={`font-display font-medium tracking-tight ${wordmarkClassName}`}
      >
        Investment Club
      </span>
    </span>
  );
}
