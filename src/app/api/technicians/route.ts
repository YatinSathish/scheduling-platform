import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(technicians);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch technicians" },
      { status: 500 },
    );
  }
}
