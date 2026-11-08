"use server";

import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { isOwnerAdmin } from "@/lib/admin";

/**
 * Next.js strips thrown Error messages from Server Actions in production
 * builds (only a generic message reaches the client, for security). Expected,
 * user-facing validation failures are returned as data instead, via
 * useActionState — that's the only way the real message shows up in prod.
 */
export type ActionState = { error?: string; success?: boolean } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session;
}

async function requireInvestor() {
  const session = await auth();
  if (!session) {
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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  return { success: true };
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
  const currentValueRaw = String(formData.get("currentValue") ?? "");
  const currentValue = new Prisma.Decimal(currentValueRaw || "0");

  if (!name || !description) {
    return { error: "Name and description are required." };
  }

  if (currentValue.lessThan(0)) {
    return { error: "Active money can't be negative." };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { name, description, sector, status, currentValue },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}

/**
 * Only the owner admin (SEED_ADMIN_EMAIL) can call this — see isOwnerAdmin.
 */
export async function createAdmin(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  if (!isOwnerAdmin(session.user.email ?? "")) {
    return { error: "Only the primary admin account can add other admins." };
  }

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
    data: { name, email, passwordHash, role: "ADMIN" },
  });

  revalidatePath("/admin");
  return { success: true };
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

  await placeInvestment({
    userId,
    companyId,
    companyName: company.name,
    amount,
    adminId: session.user.id,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}

async function placeInvestment(opts: {
  userId: string;
  companyId: string;
  companyName: string;
  amount: Prisma.Decimal;
  adminId: string;
}) {
  await prisma.$transaction([
    prisma.investment.create({
      data: {
        userId: opts.userId,
        companyId: opts.companyId,
        amount: opts.amount,
      },
    }),
    prisma.walletTransaction.create({
      data: {
        userId: opts.userId,
        amount: opts.amount.negated(),
        type: "INVESTMENT",
        note: `Invested in ${opts.companyName}`,
        createdById: opts.adminId,
      },
    }),
  ]);
}

/**
 * Investors can't invest themselves, but they CAN ask: this creates a
 * pending request an admin reviews on the company/user's behalf.
 */
export async function requestInvestment(
  companyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInvestor();

  const amountRaw = String(formData.get("amount") ?? "");
  const amount = new Prisma.Decimal(amountRaw || "0");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (amount.lessThanOrEqualTo(0)) {
    return { error: "Amount must be greater than zero." };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.status !== "OPEN") {
    return { error: "This company is not open for investment." };
  }

  await prisma.investmentRequest.create({
    data: { userId: session.user.id, companyId, amount, note },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function approveInvestmentRequest(
  requestId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const request = await prisma.investmentRequest.findUnique({
    where: { id: requestId },
    include: { company: true },
  });
  if (!request || request.status !== "PENDING") {
    return { error: "This request has already been resolved." };
  }
  if (request.company.status !== "OPEN") {
    return { error: "This company is no longer open for investment." };
  }

  const balance = await getWalletBalance(request.userId);
  if (request.amount.greaterThan(balance)) {
    return { error: "This member's wallet balance is too low for this amount." };
  }

  await placeInvestment({
    userId: request.userId,
    companyId: request.companyId,
    companyName: request.company.name,
    amount: request.amount,
    adminId: session.user.id,
  });

  await prisma.investmentRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", resolvedAt: new Date(), resolvedById: session.user.id },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/users/${request.userId}`);
  revalidatePath(`/admin/companies/${request.companyId}`);
  revalidatePath(`/companies/${request.companyId}`);
  revalidatePath("/dashboard");
}

export async function rejectInvestmentRequest(
  requestId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const request = await prisma.investmentRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.status !== "PENDING") {
    return { error: "This request has already been resolved." };
  }

  await prisma.investmentRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", resolvedAt: new Date(), resolvedById: session.user.id },
  });

  revalidatePath("/admin");
}

export async function updateAvatar(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireInvestor();

  const avatarUrl = String(formData.get("avatarUrl") ?? "");

  if (!avatarUrl.startsWith("data:image/")) {
    return { error: "Please choose an image file." };
  }
  if (avatarUrl.length > 300_000) {
    return { error: "That image is too large. Try a smaller photo." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/admin/users/${session.user.id}`);
}

/**
 * Scoped to investor accounts only. An admin's id can appear as
 * createdById/resolvedById on OTHER members' wallet transactions and
 * investment requests (every credit, invest-for, approve, reject is
 * attributed to the admin who did it) — cascading a delete through that
 * would wipe other people's real financial history. An investor's id never
 * appears on anyone else's records, so deleting one is safe to cascade.
 */
export async function deleteUser(
  userId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "This member no longer exists." };
  }
  if (target.role !== "INVESTOR") {
    return { error: "Admin accounts can't be deleted from here." };
  }

  await prisma.$transaction([
    prisma.walletTransaction.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.investmentRequest.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin");
  redirect("/admin");
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
