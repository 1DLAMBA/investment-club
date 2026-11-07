import Link from "next/link";
import { loginUser } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/Field";
import { Logo } from "@/components/Logo";
import { ActionForm } from "@/components/ActionForm";

export default function LoginPage() {
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

        <ActionForm action={loginUser} className="space-y-4">
          <TextField label="Email" type="email" name="email" required />
          <TextField
            label="Password"
            type="password"
            name="password"
            required
          />
          <SubmitButton className="w-full">Sign in</SubmitButton>
        </ActionForm>

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
