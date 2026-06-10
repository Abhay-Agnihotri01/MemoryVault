import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    const album = await prisma.album.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error("Fetch Album API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    
    // We only update share token/is_public if they are explicitly passed
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    
    if (body.is_public !== undefined) {
      updateData.is_public = body.is_public;
      if (body.is_public) {
        updateData.share_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      } else {
        updateData.share_token = null;
      }
    }

    const updatedAlbum = await prisma.album.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json({ album: updatedAlbum });
  } catch (error: any) {
    console.error("Update Album API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
