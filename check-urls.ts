import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getSupabaseUrl(): string {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found in the current directory.');
  }
  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) {
      return match[1].trim();
    }
  }
  throw new Error('DATABASE_URL not found in .env file.');
}

async function checkUrls() {
  const supabaseUrl = getSupabaseUrl();
  const prisma = new PrismaClient({
    datasources: {
      db: { url: supabaseUrl }
    }
  });

  try {
    const user = await prisma.user.findFirst({
      where: { instagram_id: "969229209213996" }
    });
    if (!user) {
      console.log("No user found!");
      return;
    }

    const mediaList = await prisma.media.findMany({
      where: { user_id: user.id },
      take: 3
    });

    console.log("=== MEDIA URLS IN DB ===");
    for (const m of mediaList) {
      console.log(`- ID: ${m.id}`);
      console.log(`  Instagram Media ID: ${m.instagram_media_id}`);
      console.log(`  URL: ${m.media_url.substring(0, 100)}...`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUrls();
