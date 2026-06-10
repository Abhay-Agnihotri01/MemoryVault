import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { private_description, album_id, tags } = await request.json();
    const resolvedParams = await params;

    const updateData: any = {
      private_description: private_description !== undefined ? private_description : undefined,
      album_id: album_id !== undefined ? album_id : undefined,
    };

    if (tags !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t: string) => ({ tag_name: t }))
      };
    }

    const updatedMedia = await prisma.media.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error: any) {
    console.error("Update Media API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
