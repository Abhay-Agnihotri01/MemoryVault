import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, faceIds, coverImageUrl } = await req.json();

    if (!name || !faceIds || faceIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the Person
    const person = await prisma.person.create({
      data: {
        name,
        cover_image_url: coverImageUrl
      }
    });

    // Assign all faces to this person
    await prisma.face.updateMany({
      where: {
        id: { in: faceIds }
      },
      data: {
        person_id: person.id
      }
    });

    return NextResponse.json({ success: true, person });
  } catch (error: any) {
    console.error("Create Person Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
