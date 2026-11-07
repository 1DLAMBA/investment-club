import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_COMPANIES = [
  {
    name: "Acme Renewables",
    sector: "Energy",
    description: "Solar farm expansion in Nevada.",
  },
  {
    name: "Northwind Logistics",
    sector: "Transport",
    description: "Regional freight consolidation and warehousing.",
  },
  {
    name: "Harbor & Vine Foods",
    sector: "Consumer",
    description: "Small-batch preserves and specialty grocery distribution.",
  },
  {
    name: "Cobalt Robotics Lab",
    sector: "Technology",
    description: "Warehouse automation and inspection robots.",
  },
  {
    name: "Greenfield Urban Farms",
    sector: "Agriculture",
    description: "Vertical farming units for mid-size grocery chains.",
  },
  {
    name: "Lumen Health Diagnostics",
    sector: "Healthcare",
    description: "At-home lab testing kits with same-week results.",
  },
  {
    name: "Ridgeline Outdoor Co.",
    sector: "Consumer",
    description: "Durable outdoor gear sold direct-to-consumer.",
  },
  {
    name: "Pinecrest Property Group",
    sector: "Real Estate",
    description: "Small multifamily renovation and rental portfolio.",
  },
  {
    name: "Clearwater Analytics",
    sector: "Technology",
    description: "Billing and reconciliation software for utilities.",
  },
  {
    name: "Amberline Craft Brewing",
    sector: "Consumer",
    description: "Regional taproom chain with a growing bottling line.",
  },
  {
    name: "Solstice Payments",
    sector: "Fintech",
    description: "Point-of-sale payment processing for small retailers.",
  },
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await prisma.user.create({
      data: { email, name, passwordHash, role: "ADMIN" },
    });
    console.log(`Created admin user: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  let created = 0;
  for (const company of SEED_COMPANIES) {
    const existing = await prisma.company.findFirst({
      where: { name: company.name },
    });
    if (existing) continue;

    await prisma.company.create({
      data: { ...company, createdById: admin.id },
    });
    created += 1;
  }

  console.log(`Seeded ${created} new compan${created === 1 ? "y" : "ies"}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
