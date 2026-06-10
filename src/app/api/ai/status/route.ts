import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const untaggedCount = await prisma.media.count({
      where: { 
        is_ai_tagged: false,
        is_deleted: false,
        media_type: { not: "VIDEO" } // Ignore videos for simple MVP
      }
    });

    return NextResponse.json({ untaggedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
