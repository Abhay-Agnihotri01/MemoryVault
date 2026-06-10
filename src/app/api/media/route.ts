import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const album_id = searchParams.get("album_id");
    const is_deleted = searchParams.get("is_deleted") === "true";
    const search = searchParams.get("search");
    const is_favorite = searchParams.get("is_favorite") === "true";
    
    const whereClause: any = { is_deleted };
    if (album_id) {
      whereClause.album_id = album_id;
    }
    if (is_favorite) {
      whereClause.is_favorite = true;
    }
    if (search) {
      whereClause.OR = [
        { caption: { contains: search, mode: "insensitive" } },
        { private_description: { contains: search, mode: "insensitive" } },
        { tags: { some: { tag_name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const media = await prisma.media.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        tags: true,
        album: true,
      },
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error("Fetch Media API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
