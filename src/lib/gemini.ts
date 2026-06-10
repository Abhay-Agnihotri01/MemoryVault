import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateTagsFromImage(imageUrl: string): Promise<string[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Download image and convert to base64
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    const prompt = `You are an AI that tags photos. Look at this photo and provide a JSON array of 3 to 6 highly relevant tags describing the image (e.g. ["beach", "dog", "sunset", "vacation"]). Only output the raw JSON array. Do not include markdown formatting or any other text.`;

    const image = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const result = await model.generateContent([prompt, image]);
    const text = result.response.text();
    
    // Parse the JSON array. Remove markdown if gemini accidentally adds it
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const tags = JSON.parse(cleanText);

    if (Array.isArray(tags)) {
      return tags.map(t => String(t).toLowerCase());
    }
    
    return [];
  } catch (error) {
    console.error("Gemini tagging error:", error);
    return [];
  }
}
