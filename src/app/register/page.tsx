import Link from "next/link";
import { registerUser } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/Field";
import { Logo } from "@/components/Logo";
import { ActionForm } from "@/components/ActionForm";

export default function RegisterPage() {
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

        <ActionForm action={registerUser} className="space-y-4">
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
          <SubmitButton className="w-full">Create account</SubmitButton>
        </ActionForm>

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
