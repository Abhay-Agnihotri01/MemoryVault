import { prisma } from "@/lib/prisma";
import { generateTagsFromImage } from "@/lib/gemini";

export async function processAiTaggingBatch() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Worker Error: GEMINI_API_KEY is not configured.");
    return { success: false, processedCount: 0, error: "No API Key" };
  }

  try {
    const batch = await prisma.media.findMany({
      where: {
        is_ai_tagged: false,
        is_deleted: false,
        media_type: { not: "VIDEO" }
      },
      take: 5
    });

    if (batch.length === 0) {
      return { success: true, processedCount: 0, message: "No photos left to tag." };
    }

    let taggedCount = 0;

    for (const item of batch) {
      const urlToTag = item.media_url || item.thumbnail_url;
      if (!urlToTag) continue;

      const tags = await generateTagsFromImage(urlToTag);
      
      if (tags.length > 0) {
        await prisma.tag.createMany({
          data: tags.map((t: string) => ({
            media_id: item.id,
            tag_name: t
          })),
          skipDuplicates: true
        });
      }

      await prisma.media.update({
        where: { id: item.id },
        data: { is_ai_tagged: true }
      });

      taggedCount++;
    }

    console.log(`[Worker] Successfully tagged ${taggedCount} photos.`);
    return { success: true, processedCount: taggedCount };
  } catch (error: any) {
    console.error("Worker Error processing batch:", error);
    return { success: false, processedCount: 0, error: error.message };
  }
}
