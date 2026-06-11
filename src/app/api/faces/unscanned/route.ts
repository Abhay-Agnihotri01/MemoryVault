import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { instagram_id: session.providerAccountId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const media = await prisma.media.findMany({
      where: {
        user_id: user.id,
        is_face_scanned: false,
        is_deleted: false,
        media_type: { not: "VIDEO" }
      },
      select: {
        id: true,
        media_url: true,
        thumbnail_url: true,
      },
      take: 10 // Batch size 10 to keep browser fast
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
