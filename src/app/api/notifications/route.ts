import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecipientType } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipientType = searchParams.get("recipientType") as RecipientType | null;
  const recipientId = searchParams.get("recipientId");

  if (!recipientType || !recipientId) {
    return NextResponse.json(
      { error: "recipientType and recipientId are required" },
      { status: 400 }
    );
  }

  if (recipientType !== "TECHNICIAN" && recipientType !== "MANAGER") {
    return NextResponse.json(
      { error: "recipientType must be TECHNICIAN or MANAGER" },
      { status: 400 }
    );
  }

  const where =
    recipientType === "TECHNICIAN"
      ? { technicianId: recipientId }
      : { managerId: recipientId };

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      job: {
        include: { quote: true, technician: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}
