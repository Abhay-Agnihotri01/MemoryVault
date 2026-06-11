import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { instagram_id: session.providerAccountId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { mediaIds, action, album_id } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ error: "No media IDs provided" }, { status: 400 });
    }

    const whereClause = { id: { in: mediaIds }, user_id: user.id };

    if (action === "soft_delete") {
      await prisma.media.updateMany({
        where: whereClause,
        data: { is_deleted: true },
      });
    } else if (action === "restore") {
      await prisma.media.updateMany({
        where: whereClause,
        data: { is_deleted: false },
      });
    } else if (action === "permanent_delete") {
      const userMedia = await prisma.media.findMany({
        where: whereClause,
        select: { id: true }
      });
      const validMediaIds = userMedia.map(m => m.id);
      
      await prisma.post.deleteMany({
        where: { media_id: { in: validMediaIds } },
      });
      await prisma.tag.deleteMany({
        where: { media_id: { in: validMediaIds } },
      });
      await prisma.media.deleteMany({
        where: { id: { in: validMediaIds } },
      });
    } else if (action === "assign_album") {
      if (!album_id) {
        return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
      }
      await prisma.media.updateMany({
        where: whereClause,
        data: { album_id },
      });
    } else if (action === "favorite") {
      await prisma.media.updateMany({
        where: whereClause,
        data: { is_favorite: true },
      });
    } else if (action === "unfavorite") {
      await prisma.media.updateMany({
        where: whereClause,
        data: { is_favorite: false },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Bulk Media API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
