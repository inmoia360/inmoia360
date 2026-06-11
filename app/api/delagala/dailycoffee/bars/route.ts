import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const sql = getDb();
  const bars = await sql`
    SELECT id, name FROM marketing_pilot.bars
    WHERE is_active = true
      AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
    ORDER BY id
  `;
  return NextResponse.json(bars);
}
