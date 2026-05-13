import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.notification.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  if (existing.readAt) {
    return NextResponse.json(existing);
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json(notification);
}
