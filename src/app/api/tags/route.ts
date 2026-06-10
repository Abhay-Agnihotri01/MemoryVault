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

    const { media_id, tag_name } = await request.json();

    if (!media_id || !tag_name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Upsert or create tag
    const tag = await prisma.tag.create({
      data: {
        media_id,
        tag_name: tag_name.toLowerCase().trim(),
      },
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    }
    console.error("Create Tag API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing tag id" }, { status: 400 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Tag API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
