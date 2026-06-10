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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch named people
    const namedPeople = await prisma.person.findMany({
      include: {
        _count: { select: { faces: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // 2. Fetch all unassigned faces to dynamically cluster them
    const unassignedFaces = await prisma.face.findMany({
      where: { person_id: null },
      include: {
        media: { select: { thumbnail_url: true, media_url: true } }
      }
    });

    // Simple clustering algorithm (Threshold 0.55 is standard for face-api.js)
    const THRESHOLD = 0.55;
    const clusters: any[] = [];

    for (const face of unassignedFaces) {
      if (!face.descriptor) continue;
      const descriptor = face.descriptor as number[];

      let foundCluster = false;
      for (const cluster of clusters) {
        // Compare against the first face in the cluster
        const repDescriptor = cluster.faces[0].descriptor as number[];
        const distance = euclideanDistance(descriptor, repDescriptor);
        
        if (distance < THRESHOLD) {
          cluster.faces.push(face);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        // Create new cluster
        clusters.push({
          id: `cluster_${face.id}`,
          faces: [face],
          cover_image_url: face.media.thumbnail_url || face.media.media_url,
          count: 1
        });
      }
    }

    // Sort clusters by size (largest first) and remove singles to avoid noise
    const validClusters = clusters
      .filter(c => c.faces.length > 1) // Only show people that appear at least twice
      .sort((a, b) => b.faces.length - a.faces.length);

    return NextResponse.json({ 
      namedPeople, 
      unassignedClusters: validClusters 
    });
  } catch (error: any) {
    console.error("Fetch People Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
