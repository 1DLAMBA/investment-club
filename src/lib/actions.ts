"use server";

import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";

/**
 * Next.js strips thrown Error messages from Server Actions in production
 * builds (only a generic message reaches the client, for security). Expected,
 * user-facing validation failures are returned as data instead, via
 * useActionState — that's the only way the real message shows up in prod.
 */
export type ActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function loginUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Invalid email or password." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password." };
    }

    const redirectTo = user.role === "ADMIN" ? "/admin" : "/dashboard";
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return {
      error:
        "Name, email, and a password of at least 8 characters are required.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "INVESTOR" },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export async function createCompany(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim() || null;

  if (!name || !description) {
    return { error: "Name and description are required." };
  }

  await prisma.company.create({
    data: { name, description, sector, createdById: session.user.id },
  });

  revalidatePath("/admin");
}

export async function updateCompany(
  companyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "OPEN") as
    | "OPEN"
    | "CLOSED";

  if (!name || !description) {
    return { error: "Name and description are required." };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { name, description, sector, status },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}`);
}

export async function creditWallet(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const amountRaw = String(formData.get("amount") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const amount = new Prisma.Decimal(amountRaw || "0");

  if (amount.lessThanOrEqualTo(0)) {
    return { error: "Amount must be greater than zero." };
  }

  await prisma.walletTransaction.create({
    data: {
      userId,
      amount,
      type: "ADMIN_CREDIT",
      note,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/admin/users/${userId}`);
}

/**
 * Investors tell the admin which company they want in and the admin places
 * the investment on their behalf — there is no self-serve invest button.
 */
export async function investForUser(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const amount = new Prisma.Decimal(amountRaw || "0");

  if (!companyId) {
    return { error: "Choose a company to invest in." };
  }

  if (amount.lessThanOrEqualTo(0)) {
    return { error: "Amount must be greater than zero." };
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  if (!company || company.status !== "OPEN") {
    return { error: "This company is not open for investment." };
  }

  const balance = await getWalletBalance(userId);
  if (amount.greaterThan(balance)) {
    return { error: "That user's wallet balance is too low for this amount." };
  }

  await prisma.$transaction([
    prisma.investment.create({
      data: { userId, companyId, amount },
    }),
    prisma.walletTransaction.create({
      data: {
        userId,
        amount: amount.negated(),
        type: "INVESTMENT",
        note: `Invested in ${company.name}`,
        createdById: session.user.id,
      },
    }),
  ]);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}

export async function getWalletBalance(userId: string) {
  const result = await prisma.walletTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? new Prisma.Decimal(0);
}

export async function logout() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/login" });
}
