import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const updated = await prisma.media.update({
      where: { id },
      data: { is_favorite: !media.is_favorite }
    });

    return NextResponse.json({ success: true, is_favorite: updated.is_favorite });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
