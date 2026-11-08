"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/Field";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      // Ensure seed data exists before login
      await fetch("/api/seed", { method: "POST" });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setIsLoading(false);
      } else {
        // Success - redirect to dashboard (middleware will handle role routing)
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid email or password.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <Logo
        className="mb-8"
        markClassName="h-9 w-9 text-brass"
        wordmarkClassName="text-xl text-paper"
      />

      <div className="w-full max-w-sm rounded-lg border border-brass/15 bg-paper p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-xl font-medium text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-stone">
            Welcome back to the investment club.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md border border-debit/30 bg-debit/5 px-3 py-2 text-sm text-debit"
            >
              {error}
            </p>
          )}
          <TextField label="Email" type="email" name="email" required />
          <TextField
            label="Password"
            type="password"
            name="password"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brass px-4 py-2 font-medium text-paper transition-colors hover:bg-brass/90 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone">
          No account?{" "}
          <Link href="/register" className="font-medium text-ink underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
