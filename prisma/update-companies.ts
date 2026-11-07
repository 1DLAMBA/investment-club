import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

const COMPANY_DATA = [
  {
    name: "Acme Renewables",
    initialValue: 50000,
    currentValue: 78500,
  },
  {
    name: "Northwind Logistics",
    initialValue: 75000,
    currentValue: 62000,
  },
  {
    name: "Harbor & Vine Foods",
    initialValue: 30000,
    currentValue: 45200,
  },
  {
    name: "Cobalt Robotics Lab",
    initialValue: 120000,
    currentValue: 165000,
  },
  {
    name: "Greenfield Urban Farms",
    initialValue: 45000,
    currentValue: 51800,
  },
  {
    name: "Lumen Health Diagnostics",
    initialValue: 80000,
    currentValue: 92500,
  },
  {
    name: "Ridgeline Outdoor Co.",
    initialValue: 35000,
    currentValue: 28500,
  },
  {
    name: "Pinecrest Property Group",
    initialValue: 200000,
    currentValue: 247000,
  },
  {
    name: "Clearwater Analytics",
    initialValue: 65000,
    currentValue: 89500,
  },
  {
    name: "Amberline Craft Brewing",
    initialValue: 28000,
    currentValue: 36800,
  },
  {
    name: "Solstice Payments",
    initialValue: 90000,
    currentValue: 125000,
  },
];

async function main() {
  let updated = 0;

  for (const data of COMPANY_DATA) {
    const company = await prisma.company.findFirst({
      where: { name: data.name },
    });

    if (company) {
      const historicalData = generateHistoricalData(
        data.initialValue,
        data.currentValue,
      );

      await prisma.company.update({
        where: { id: company.id },
        data: {
          initialValue: data.initialValue,
          currentValue: data.currentValue,
          historicalData,
        },
      });

      console.log(`Updated: ${company.name}`);
      updated += 1;
    }
  }

  console.log(`Updated ${updated} companies.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
