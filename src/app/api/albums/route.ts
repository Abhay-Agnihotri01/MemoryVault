import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { instagram_id: session.providerAccountId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const albums = await prisma.album.findMany({
      where: { user_id: user.id },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json({ albums });
  } catch (error: any) {
    console.error("Get Albums API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { instagram_id: session.providerAccountId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const album = await prisma.album.create({
      data: {
        user_id: user.id,
        title,
        description,
      },
    });

    return NextResponse.json({ album });
  } catch (error: any) {
    console.error("Create Album API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
