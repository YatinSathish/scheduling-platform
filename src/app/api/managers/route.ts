import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const managers = await prisma.manager.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(managers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 },
    );
  }
}
