import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AssignJobBody } from "@/lib/types";

export async function POST(request: Request) {
  let body: AssignJobBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { quoteId, technicianId, managerId, scheduledStart } = body;

  if (!quoteId || !technicianId || !managerId || !scheduledStart) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const start = new Date(scheduledStart);
  if (isNaN(start.getTime())) {
    return NextResponse.json(
      { error: "Invalid scheduledStart date" },
      { status: 400 },
    );
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  try {
    const job = await prisma.$transaction(async (tx) => {
      const conflict = await tx.job.findFirst({
        where: {
          technicianId,
          status: "SCHEDULED",
          scheduledStart: { lt: end },
          scheduledEnd: { gt: start },
        },
      });

      if (conflict) {
        throw new Error("CONFLICT");
      }

      const newJob = await tx.job.create({
        data: {
          quoteId,
          technicianId,
          managerId,
          scheduledStart: start,
          scheduledEnd: end,
          status: "SCHEDULED",
        },
        include: {
          quote: true,
          technician: true,
          manager: true,
        },
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "SCHEDULED" },
      });

      await tx.notification.create({
        data: {
          recipientType: "TECHNICIAN",
          technicianId,
          jobId: newJob.id,
          message: `New job assigned: "${newJob.quote.title}" on ${start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} at ${start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`,
        },
      });

      return newJob;
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT") {
      return NextResponse.json(
        {
          error:
            "This technician already has a job scheduled during that time.",
        },
        { status: 409 },
      );
    }

    // Prisma write contention under concurrent requests
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Scheduling conflict detected. Please try again." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to assign job" },
      { status: 500 },
    );
  }
}
