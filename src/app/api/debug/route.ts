import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
  const media = await prisma.media.findUnique({ where: { id: 'cmqaf9beu0007czza08b04mgq' }});
  return NextResponse.json(media);
}
