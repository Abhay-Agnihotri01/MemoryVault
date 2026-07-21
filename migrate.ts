import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Helper to parse the .env file and get DATABASE_URL (Supabase URL)
function getSupabaseUrl(): string {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found in the current directory.');
  }
  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    // Look for active DATABASE_URL
    const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) {
      return match[1].trim();
    }
  }
  throw new Error('DATABASE_URL not found in .env file.');
}

async function runMigration() {
  const neonUrl = "postgresql://neondb_owner:npg_zEdHGmua1TA6@ep-bold-rice-ap5ojbet-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const supabaseUrl = getSupabaseUrl();

  console.log("=== Database Migration ===");
  console.log("Source: Neon DB");
  console.log("Target: Supabase DB (read from .env)");

  if (supabaseUrl.includes("[YOUR-PASSWORD]")) {
    console.error("\n[Error] Please replace the [YOUR-PASSWORD] placeholder in your .env file with your actual Supabase password first.");
    process.exit(1);
  }

  // 1. Connect to Neon DB
  console.log("\nConnecting to Neon DB...");
  const neonPrisma = new PrismaClient({
    datasources: {
      db: { url: neonUrl }
    }
  });

  console.log("Fetching all data from Neon DB...");
  const users = await neonPrisma.user.findMany();
  const albums = await neonPrisma.album.findMany();
  const media = await neonPrisma.media.findMany();
  const posts = await neonPrisma.post.findMany();
  const tags = await neonPrisma.tag.findMany();
  const persons = await neonPrisma.person.findMany();
  const faces = await neonPrisma.face.findMany();

  console.log(`\nData fetched from Neon:
    - ${users.length} Users
    - ${albums.length} Albums
    - ${media.length} Media posts
    - ${posts.length} Instagram published posts
    - ${tags.length} AI/Manual Tags
    - ${persons.length} Identified Persons
    - ${faces.length} Detected Faces`);

  await neonPrisma.$disconnect();

  // 2. Connect to Supabase
  console.log("\nConnecting to Supabase DB...");
  const supabasePrisma = new PrismaClient({
    datasources: {
      db: { url: supabaseUrl }
    }
  });

  // 3. Reset Supabase tables
  console.log("\nClearing all existing data on Supabase (truncating tables)...");
  // Delete in reverse order of foreign key dependencies
  await supabasePrisma.face.deleteMany();
  await supabasePrisma.person.deleteMany();
  await supabasePrisma.tag.deleteMany();
  await supabasePrisma.post.deleteMany();
  await supabasePrisma.media.deleteMany();
  await supabasePrisma.album.deleteMany();
  await supabasePrisma.user.deleteMany();
  console.log("Supabase database cleared successfully.");

  // 4. Migrate data to Supabase
  console.log("\nInserting data into Supabase in dependency order...");

  if (users.length > 0) {
    await supabasePrisma.user.createMany({ data: users });
    console.log("✓ Migrated Users.");
  }

  if (albums.length > 0) {
    await supabasePrisma.album.createMany({ data: albums });
    console.log("✓ Migrated Albums.");
  }

  if (media.length > 0) {
    await supabasePrisma.media.createMany({ data: media });
    console.log("✓ Migrated Media posts.");
  }

  if (posts.length > 0) {
    await supabasePrisma.post.createMany({ data: posts });
    console.log("✓ Migrated Instagram published posts.");
  }

  if (tags.length > 0) {
    await supabasePrisma.tag.createMany({ data: tags });
    console.log("✓ Migrated Tags.");
  }

  if (persons.length > 0) {
    await supabasePrisma.person.createMany({ data: persons });
    console.log("✓ Migrated Persons.");
  }

  if (faces.length > 0) {
    // Face descriptor has JSON datatype in Postgres, mapping is done automatically by Prisma client
    await supabasePrisma.face.createMany({ data: faces });
    console.log("✓ Migrated Faces.");
  }

  await supabasePrisma.$disconnect();
  console.log("\n=== Migration Completed Successfully! ===");
}

runMigration().catch(async (error) => {
  console.error("\n[Error] Migration failed:", error);
});
