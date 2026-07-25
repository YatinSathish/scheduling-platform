import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function twoHoursAfter(date: Date): Date {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000);
}

function formatJobTime(date: Date): string {
  const day = date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} at ${time}`;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.technician.deleteMany();

  const [alice, bob] = await Promise.all([
    prisma.manager.create({ data: { name: "Alice Chen", email: "alice@example.com" } }),
    prisma.manager.create({ data: { name: "Bob Hartley", email: "bob@example.com" } }),
  ]);

  const [sam, jordan, casey] = await Promise.all([
    prisma.technician.create({ data: { name: "Sam Rivera", email: "sam@example.com" } }),
    prisma.technician.create({ data: { name: "Jordan Lee", email: "jordan@example.com" } }),
    prisma.technician.create({ data: { name: "Casey Kim", email: "casey@example.com" } }),
  ]);

  // --- Unscheduled quotes (available to assign) ---
  await Promise.all([
    prisma.quote.create({
      data: {
        title: "HVAC Installation – Unit 4B",
        description: "Supply and install ducted air conditioning system for 3-bed apartment. Includes all ductwork, ceiling registers, and commissioning.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Refrigerant Recharge – Commercial",
        description: "Recharge R-410A refrigerant on rooftop unit at 22 George St. System showing low pressure warnings.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Duct Cleaning – Office Level 3",
        description: "Full duct cleaning and sanitisation for 400sqm open-plan office. Last serviced over 3 years ago.",
        managerId: bob.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Split System Service – Retail",
        description: "Annual maintenance and filter replacement for 6 split systems across the retail floor.",
        managerId: bob.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Emergency Repair – Compressor Fault",
        description: "Diagnose and repair compressor fault on warehouse cooling unit. Client reporting loud knocking noise and loss of cooling.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Annual Service – Warehouse B",
        description: "Scheduled annual service for 2 large industrial units in Warehouse B. Includes filter change, coil clean, and refrigerant top-up.",
        managerId: bob.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "New System Install – Restaurant Kitchen",
        description: "Install dedicated exhaust and cooling system for commercial kitchen. Must comply with AS 1668.2 ventilation standard.",
        managerId: alice.id,
      },
    }),
    prisma.quote.create({
      data: {
        title: "Filter Replacement – School HVAC",
        description: "Replace HEPA filters across 12 classrooms and 2 admin blocks. Filters due per maintenance schedule.",
        managerId: bob.id,
      },
    }),
  ]);

  // --- Pre-scheduled jobs (already assigned, visible in technician views) ---

  // Sam: upcoming job tomorrow 9am (also blocks that slot for conflict testing)
  const samQuote = await prisma.quote.create({
    data: {
      title: "Cooling System Inspection – CBD Tower",
      description: "Routine inspection and service of 4-zone cooling system on floors 12–15.",
      status: "SCHEDULED",
      managerId: alice.id,
    },
  });
  const samStart = daysFromNow(1, 9);
  const samJob = await prisma.job.create({
    data: {
      quoteId: samQuote.id,
      technicianId: sam.id,
      managerId: alice.id,
      scheduledStart: samStart,
      scheduledEnd: twoHoursAfter(samStart),
      status: "SCHEDULED",
    },
  });
  await prisma.notification.create({
    data: {
      recipientType: "TECHNICIAN",
      technicianId: sam.id,
      jobId: samJob.id,
      message: `New job assigned: "${samQuote.title}" on ${formatJobTime(samStart)}`,
    },
  });

  // Jordan: upcoming job in 2 days at 2pm
  const jordanQuote = await prisma.quote.create({
    data: {
      title: "Heat Pump Installation – Townhouse",
      description: "Supply and install reverse-cycle heat pump for 2-storey townhouse. Outdoor unit to be mounted on rear wall.",
      status: "SCHEDULED",
      managerId: bob.id,
    },
  });
  const jordanStart = daysFromNow(2, 14);
  const jordanJob = await prisma.job.create({
    data: {
      quoteId: jordanQuote.id,
      technicianId: jordan.id,
      managerId: bob.id,
      scheduledStart: jordanStart,
      scheduledEnd: twoHoursAfter(jordanStart),
      status: "SCHEDULED",
    },
  });
  await prisma.notification.create({
    data: {
      recipientType: "TECHNICIAN",
      technicianId: jordan.id,
      jobId: jordanJob.id,
      message: `New job assigned: "${jordanQuote.title}" on ${formatJobTime(jordanStart)}`,
    },
  });

  // Casey: completed job 2 days ago (shows completed section + manager notification)
  const caseyQuote = await prisma.quote.create({
    data: {
      title: "Evaporator Coil Replacement – Suburb Home",
      description: "Replace corroded evaporator coil on 5-year-old split system. Parts pre-ordered.",
      status: "SCHEDULED",
      managerId: alice.id,
    },
  });
  const caseyStart = daysFromNow(-2, 10);
  const caseyJob = await prisma.job.create({
    data: {
      quoteId: caseyQuote.id,
      technicianId: casey.id,
      managerId: alice.id,
      scheduledStart: caseyStart,
      scheduledEnd: twoHoursAfter(caseyStart),
      status: "COMPLETED",
    },
  });
  await prisma.notification.create({
    data: {
      recipientType: "MANAGER",
      managerId: alice.id,
      jobId: caseyJob.id,
      message: `Job completed: "${caseyQuote.title}" by ${casey.name}`,
    },
  });

  console.log("Database seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
