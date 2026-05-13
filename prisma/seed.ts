import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.technician.deleteMany();

  const [alice, bob] = await Promise.all([
    prisma.manager.create({ data: { name: "Alice Chen", email: "alice@brix.com" } }),
    prisma.manager.create({ data: { name: "Bob Hartley", email: "bob@brix.com" } }),
  ]);

  await Promise.all([
    prisma.technician.create({ data: { name: "Sam Rivera", email: "sam@brix.com" } }),
    prisma.technician.create({ data: { name: "Jordan Lee", email: "jordan@brix.com" } }),
    prisma.technician.create({ data: { name: "Casey Kim", email: "casey@brix.com" } }),
  ]);

  await Promise.all([
    prisma.quote.create({
      data: {
        title: "HVAC Installation – Unit 4B",
        description: "Supply and install ducted air conditioning system for 3-bed apartment.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Refrigerant Recharge – Commercial",
        description: "Recharge R-410A refrigerant on rooftop unit at 22 George St.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Duct Cleaning – Office Level 3",
        description: "Full duct cleaning and sanitisation for 400sqm open-plan office.",
        managerId: bob.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Split System Service – Retail",
        description: "Annual maintenance and filter replacement for 6 split systems.",
        managerId: bob.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Emergency Repair – Compressor Fault",
        description: "Diagnose and repair compressor fault on warehouse cooling unit.",
        managerId: alice.id,
      },
    }),
  ]);

  console.log("Database seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
