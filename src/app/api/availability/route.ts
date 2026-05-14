import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get("technicianId");
  const date = searchParams.get("date"); // expects "YYYY-MM-DD"

  if (!technicianId || !date) {
    return NextResponse.json(
      { error: "technicianId and date are required" },
      { status: 400 },
    );
  }

  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  if (isNaN(startOfDay.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: {
        technicianId,
        status: "SCHEDULED",
        scheduledStart: { lt: endOfDay },
        scheduledEnd: { gt: startOfDay },
      },
      select: {
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // Check each 30-minute slot against existing jobs using exact timestamps.
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const blocked = new Set<string>();

    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const slotStart = new Date(startOfDay);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + TWO_HOURS_MS);
        const key = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;

        for (const job of jobs) {
          if (slotStart < job.scheduledEnd && slotEnd > job.scheduledStart) {
            blocked.add(key);
            break;
          }
        }
      }
    }

    return NextResponse.json({ takenSlots: Array.from(blocked) });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}
