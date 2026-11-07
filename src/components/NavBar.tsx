import Link from "next/link";
import { logout } from "@/lib/actions";
import { LogoMark } from "@/components/Logo";

export function NavBar({
  name,
  role,
}: {
  name: string;
  role: "ADMIN" | "INVESTOR";
}) {
  const homeHref = role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-10 border-b border-brass/20 bg-vault">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={homeHref}
          className="flex min-w-0 items-center gap-2 text-paper"
        >
          <LogoMark className="h-7 w-7 shrink-0 text-brass" />
          <span className="truncate font-display text-base font-medium tracking-tight sm:text-lg">
            Investment Club
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <span className="hidden max-w-[10rem] truncate text-sm text-mist sm:inline">
            {name}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-paper hover:text-brass"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
