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

    const { mediaIds, action, album_id } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ error: "No media IDs provided" }, { status: 400 });
    }

    if (action === "soft_delete") {
      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
        data: { is_deleted: true },
      });
    } else if (action === "restore") {
      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
        data: { is_deleted: false },
      });
    } else if (action === "permanent_delete") {
      // Must delete related posts and tags first due to foreign key constraints
      await prisma.post.deleteMany({
        where: { media_id: { in: mediaIds } },
      });
      await prisma.tag.deleteMany({
        where: { media_id: { in: mediaIds } },
      });
      await prisma.media.deleteMany({
        where: { id: { in: mediaIds } },
      });
    } else if (action === "assign_album") {
      if (!album_id) {
        return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
      }
      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
        data: { album_id },
      });
    } else if (action === "favorite") {
      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
        data: { is_favorite: true },
      });
    } else if (action === "unfavorite") {
      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
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
