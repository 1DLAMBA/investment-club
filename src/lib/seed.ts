import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "changeme123";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";

const SEED_COMPANIES = [
  {
    name: "Acme Renewables",
    sector: "Energy",
    description: "Solar farm expansion in Nevada.",
    initialValue: 50000,
    currentValue: 78500,
  },
  {
    name: "Northwind Logistics",
    sector: "Transport",
    description: "Regional freight consolidation and warehousing.",
    initialValue: 75000,
    currentValue: 62000,
  },
  {
    name: "Harbor & Vine Foods",
    sector: "Consumer",
    description: "Small-batch preserves and specialty grocery distribution.",
    initialValue: 30000,
    currentValue: 45200,
  },
  {
    name: "Cobalt Robotics Lab",
    sector: "Technology",
    description: "Warehouse automation and inspection robots.",
    initialValue: 120000,
    currentValue: 165000,
  },
  {
    name: "Greenfield Urban Farms",
    sector: "Agriculture",
    description: "Vertical farming units for mid-size grocery chains.",
    initialValue: 45000,
    currentValue: 51800,
  },
  {
    name: "Lumen Health Diagnostics",
    sector: "Healthcare",
    description: "At-home lab testing kits with same-week results.",
    initialValue: 80000,
    currentValue: 92500,
  },
  {
    name: "Ridgeline Outdoor Co.",
    sector: "Consumer",
    description: "Durable outdoor gear sold direct-to-consumer.",
    initialValue: 35000,
    currentValue: 28500,
  },
  {
    name: "Pinecrest Property Group",
    sector: "Real Estate",
    description: "Small multifamily renovation and rental portfolio.",
    initialValue: 200000,
    currentValue: 247000,
  },
  {
    name: "Clearwater Analytics",
    sector: "Technology",
    description: "Billing and reconciliation software for utilities.",
    initialValue: 65000,
    currentValue: 89500,
  },
  {
    name: "Amberline Craft Brewing",
    sector: "Consumer",
    description: "Regional taproom chain with a growing bottling line.",
    initialValue: 28000,
    currentValue: 36800,
  },
  {
    name: "Solstice Payments",
    sector: "Fintech",
    description: "Point-of-sale payment processing for small retailers.",
    initialValue: 90000,
    currentValue: 125000,
  },
];

function generateHistoricalData(
  initialValue: number,
  currentValue: number,
  points: number = 36,
): number[] {
  const data: number[] = [];
  const volatility = 0.02 + Math.random() * 0.03;
  let value = initialValue;

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const targetValue = initialValue + (currentValue - initialValue) * progress;
    const noise = (Math.random() - 0.5) * value * volatility;
    const trend = (targetValue - value) * 0.1;
    value = Math.max(value + noise + trend, initialValue * 0.5);
    data.push(value);
  }

  data[data.length - 1] = currentValue;
  return data;
}

let isSeeding = false;

export async function ensureSeedData() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: SEED_ADMIN_EMAIL },
    });

    if (!admin) {
      const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
      admin = await prisma.user.create({
        data: {
          email: SEED_ADMIN_EMAIL,
          name: SEED_ADMIN_NAME,
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log(`Created admin user: ${SEED_ADMIN_EMAIL}`);
    }

    // Seed companies
    let created = 0;
    for (const company of SEED_COMPANIES) {
      const existing = await prisma.company.findFirst({
        where: { name: company.name },
      });
      if (existing) continue;

      const historicalData = generateHistoricalData(
        company.initialValue,
        company.currentValue,
      );

      await prisma.company.create({
        data: {
          name: company.name,
          sector: company.sector,
          description: company.description,
          initialValue: company.initialValue,
          currentValue: company.currentValue,
          historicalData,
          createdById: admin.id,
        },
      });
      created += 1;
    }

    if (created > 0) {
      console.log(`Seeded ${created} new companies.`);
    }
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    isSeeding = false;
  }
}
