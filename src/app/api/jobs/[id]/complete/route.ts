import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.job.findUnique({
    where: { id },
    include: { quote: true, technician: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (existing.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Job is already completed" },
      { status: 409 },
    );
  }

  const job = await prisma.$transaction(async (tx) => {
    const updated = await tx.job.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: { quote: true, technician: true, manager: true },
    });

    await tx.notification.create({
      data: {
        recipientType: "MANAGER",
        managerId: updated.managerId,
        jobId: updated.id,
        message: `Job completed: "${updated.quote.title}" by ${updated.technician.name}`,
      },
    });

    return updated;
  });

  return NextResponse.json(job);
}
