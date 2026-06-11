import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchInstagramMedia } from "@/lib/instagram";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.providerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database to ensure we have their latest access token
    const user = await prisma.user.findFirst({
      where: { instagram_id: session.providerAccountId }
    });

    if (!user || !user.access_token) {
      return NextResponse.json({ error: "No access token found" }, { status: 400 });
    }

    // Fetch media from Instagram Graph API
    const mediaItems = await fetchInstagramMedia(user.access_token);

    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Save to database
    let syncedCount = 0;
    for (const item of mediaItems) {
      if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data) {
        for (const child of item.children.data) {
          await prisma.media.upsert({
            where: { instagram_media_id: child.id },
            update: {
              media_url: child.media_url || "",
              thumbnail_url: child.thumbnail_url || child.media_url || "",
              caption: item.caption || "",
            },
            create: {
              instagram_media_id: child.id,
              user_id: user.id,
              media_url: child.media_url || "",
              thumbnail_url: child.thumbnail_url || child.media_url || "",
              caption: item.caption || "",
              media_type: child.media_type,
              created_at: new Date(item.timestamp),
            }
          });
          syncedCount++;
        }
      } else {
        await prisma.media.upsert({
          where: { instagram_media_id: item.id },
          update: {
            media_url: item.media_url || "",
            thumbnail_url: item.thumbnail_url || item.media_url || "",
            caption: item.caption || "",
          },
          create: {
            instagram_media_id: item.id,
            user_id: user.id,
            media_url: item.media_url || "",
            thumbnail_url: item.thumbnail_url || item.media_url || "",
            caption: item.caption || "",
            media_type: item.media_type,
            created_at: new Date(item.timestamp),
          }
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
