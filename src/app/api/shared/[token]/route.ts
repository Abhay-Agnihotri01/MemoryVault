import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    const album = await prisma.album.findUnique({
      where: { share_token: token },
      include: {
        user: {
          select: {
            username: true,
            profile_picture: true
          }
        },
        media: {
          where: { is_deleted: false },
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!album || !album.is_public) {
      return NextResponse.json({ error: "Album not found or is private" }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error("Fetch Shared Album API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
