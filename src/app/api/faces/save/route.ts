import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function euclideanDistance(desc1: number[], desc2: number[]): number {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

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

    const { mediaId, faces } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    // Insert faces if any
    if (faces && faces.length > 0) {
      // Fetch existing people to auto-assign new faces
      const existingPeople = await prisma.person.findMany({
        where: { user_id: user.id },
        include: {
          faces: { take: 5 } // Compare against up to 5 faces per person
        }
      });

      const THRESHOLD = 0.55;

      const faceData = faces.map((f: any) => {
        let assignedPersonId = null;

        // Auto-assign to an existing person if distance is below threshold
        if (existingPeople.length > 0) {
          for (const person of existingPeople) {
            let matched = false;
            for (const existingFace of person.faces) {
              const repDescriptor = existingFace.descriptor as number[];
              const distance = euclideanDistance(f.descriptor, repDescriptor);
              
              if (distance < THRESHOLD) {
                matched = true;
                break;
              }
            }
            if (matched) {
              assignedPersonId = person.id;
              break;
            }
          }
        }

        return {
          media_id: mediaId,
          person_id: assignedPersonId,
          descriptor: f.descriptor, // 128-float array stored as JSON
          box_x: f.box.x,
          box_y: f.box.y,
          box_width: f.box.width,
          box_height: f.box.height,
        };
      });

      await prisma.face.createMany({
        data: faceData
      });
    }

    // Mark as scanned
    await prisma.media.update({
      where: { id: mediaId },
      data: { is_face_scanned: true }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Faces Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
