import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking admin user in database...\n");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    console.log(`❌ No user found with email: ${adminEmail}`);
    console.log("\nAll users in database:");
    const allUsers = await prisma.user.findMany();
    console.log(JSON.stringify(allUsers, null, 2));
  } else {
    console.log(`✅ User found:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";
    const valid = await bcrypt.compare(adminPassword, user.passwordHash);
    console.log(`\nPassword validation: ${valid ? "✅ Valid" : "❌ Invalid"}`);

    if (!valid) {
      console.log(`\nTesting with default password 'changeme123':`);
      const validDefault = await bcrypt.compare("changeme123", user.passwordHash);
      console.log(`Default password: ${validDefault ? "✅ Valid" : "❌ Invalid"}`);
    }
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
