import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.providerAccountId || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, imageKey, caption } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const accessToken = session.accessToken;

    // Step 1: Get Facebook Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v11.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: "No Facebook Pages connected to this account." }, { status: 400 });
    }
    
    const pageId = pagesData.data[0].id;

    // Step 2: Get Instagram Professional Account ID
    const igRes = await fetch(`https://graph.facebook.com/v11.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
    const igData = await igRes.json();

    if (!igData.instagram_business_account) {
      return NextResponse.json({ error: "No Instagram Professional Account connected to the Facebook Page." }, { status: 400 });
    }

    const igUserId = igData.instagram_business_account.id;

    // Step 3: Create Media Container
    const createParams = new URLSearchParams({
      image_url: imageUrl,
      caption: caption || "",
      access_token: accessToken as string,
    });
    
    const createRes = await fetch(`https://graph.facebook.com/v11.0/${igUserId}/media`, {
      method: "POST",
      body: createParams,
    });
    const createData = await createRes.json();

    if (createData.error) {
      return NextResponse.json({ error: createData.error.message }, { status: 400 });
    }

    const creationId = createData.id;

    // Instagram downloads the image asynchronously. For larger files, it needs a few seconds 
    // to process before it can be published. Otherwise it throws "Media ID is not available".
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Step 4: Publish Container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken as string,
    });

    const publishRes = await fetch(`https://graph.facebook.com/v11.0/${igUserId}/media_publish`, {
      method: "POST",
      body: publishParams,
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      return NextResponse.json({ error: publishData.error.message }, { status: 400 });
    }

    const publishedPostId = publishData.id;

    // Step 4.5: Fetch actual Instagram URL
    // We don't want to save the Uploadthing URL since we are deleting it.
    let finalMediaUrl = imageUrl;
    try {
      const getMediaRes = await fetch(`https://graph.facebook.com/v11.0/${publishedPostId}?fields=media_url&access_token=${accessToken}`);
      if (getMediaRes.ok) {
        const getMediaData = await getMediaRes.json();
        if (getMediaData.media_url) {
          finalMediaUrl = getMediaData.media_url;
        }
      }
    } catch (e) {
      console.error("Failed to fetch final media url", e);
    }

    // Step 5: Save to Database
    const media = await prisma.media.create({
      data: {
        instagram_media_id: publishedPostId,
        media_url: finalMediaUrl,
        media_type: "IMAGE",
        caption: caption,
      }
    });

    const post = await prisma.post.create({
      data: {
        instagram_post_id: publishedPostId,
        media_id: media.id,
        caption: caption,
        status: "PUBLISHED",
        published_at: new Date(),
      }
    });

    // Step 6: Cleanup Uploadthing Storage
    // We immediately delete the file since Instagram has already fetched it.
    if (imageKey) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles(imageKey);
      } catch (err) {
        console.error("Failed to delete from Uploadthing:", err);
      }
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Publish API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
