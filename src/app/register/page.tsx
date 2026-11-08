"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/Field";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || password.length < 8) {
      setError("Name, email, and a password of at least 8 characters are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registration succeeded but login failed. Please try logging in.");
        setIsLoading(false);
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.");
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
            Create an account
          </h1>
          <p className="mt-1 text-sm text-stone">
            Join the investment club. Funds are added by an admin after you
            send them outside the platform.
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
          <TextField label="Full name" type="text" name="name" required />
          <TextField label="Email" type="email" name="email" required />
          <TextField
            label="Password"
            type="password"
            name="password"
            required
            minLength={8}
            hint="At least 8 characters."
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brass px-4 py-2 font-medium text-paper transition-colors hover:bg-brass/90 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
