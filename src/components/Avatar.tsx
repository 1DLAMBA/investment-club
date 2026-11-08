function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  className = "h-12 w-12 text-base",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    // Plain <img>, not next/image: these are data: URLs (client-resized
    // uploads), which next/image's optimizer doesn't accept.
    return (
      <img
        src={avatarUrl}
        alt={`${name}'s profile picture`}
        className={`shrink-0 rounded-full border border-brass/30 object-cover ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name}'s profile picture`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-brass/30 bg-vault font-display font-medium text-brass ${className}`}
    >
      {initials(name)}
    </span>
  );
}
