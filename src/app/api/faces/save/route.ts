import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId, faces } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    // Insert faces if any
    if (faces && faces.length > 0) {
      // In a fully automated system, we would compare the Euclidean distance of `f.descriptor`
      // against existing Face descriptors to auto-cluster them into `person_id`.
      // For this MVP, we will save them unassigned, and group them in the UI later.
      
      const faceData = faces.map((f: any) => ({
        media_id: mediaId,
        descriptor: f.descriptor, // 128-float array stored as JSON
        box_x: f.box.x,
        box_y: f.box.y,
        box_width: f.box.width,
        box_height: f.box.height,
      }));

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
