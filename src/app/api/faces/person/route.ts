import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { instagram_id: session.providerAccountId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { name, faceIds, coverImageUrl } = await req.json();

    if (!name || !faceIds || faceIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if person already exists with this name (exact match)
    let person = await prisma.person.findFirst({
      where: { 
        user_id: user.id, 
        name: { equals: name, mode: 'insensitive' } 
      }
    });

    // If no exact match, try to find an existing profile that contains this name 
    // (e.g. naming "Abhay" will match an existing "Abhay, Anushka" profile)
    if (!person) {
      person = await prisma.person.findFirst({
        where: {
          user_id: user.id,
          name: { contains: name, mode: 'insensitive' }
        }
      });
    }

    if (!person) {
      // Create the Person
      person = await prisma.person.create({
        data: {
          user_id: user.id,
          name,
          cover_image_url: coverImageUrl
        }
      });
    } else if (coverImageUrl && !person.cover_image_url) {
      // Update cover image if missing
      await prisma.person.update({
        where: { id: person.id },
        data: { cover_image_url: coverImageUrl }
      });
    }

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
