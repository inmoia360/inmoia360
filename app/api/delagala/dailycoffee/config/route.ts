import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const sql = getDb();
  const bars = await sql`
    SELECT id, slug, name, address, city
    FROM marketing_pilot.bars
    WHERE is_active = true
    ORDER BY name
  `;

  return NextResponse.json({
    campaign: {
      slug: process.env.DAILYCOFFEE_CAMPAIGN_SLUG ?? 'dailycoffee',
      client: process.env.DAILYCOFFEE_CLIENT_SLUG ?? 'delagala',
      name: 'Un café de la inmobiliaria',
      description: 'Café gratis + Delagala Daily',
      expires_days: 30,
    },
    bars,
  });
}
