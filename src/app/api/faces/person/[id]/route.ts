import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { instagram_id: session.providerAccountId }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const person = await prisma.person.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!person || person.user_id !== user.id) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Check if user is renaming this profile to an already existing name
    const existingPerson = await prisma.person.findFirst({
      where: {
        user_id: user.id,
        name: { equals: name, mode: 'insensitive' },
        id: { not: resolvedParams.id }
      }
    });

    if (existingPerson) {
      // User is renaming to an existing person's name!
      // We should merge this person into the existing person.
      await prisma.face.updateMany({
        where: { person_id: resolvedParams.id },
        data: { person_id: existingPerson.id }
      });

      // Update cover image if existing person doesn't have one
      if (!existingPerson.cover_image_url && person.cover_image_url) {
        await prisma.person.update({
          where: { id: existingPerson.id },
          data: { cover_image_url: person.cover_image_url }
        });
      }

      // Delete the old person
      await prisma.person.delete({
        where: { id: resolvedParams.id }
      });

      return NextResponse.json({ success: true, merged: true, newId: existingPerson.id });
    }

    const updatedPerson = await prisma.person.update({
      where: { id: resolvedParams.id },
      data: { name }
    });

    return NextResponse.json({ success: true, person: updatedPerson });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
