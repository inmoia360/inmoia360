import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCampaign } from '@/lib/campaign';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  const sql = getDb();
  const locations = await sql`
    SELECT id, name FROM marketing_pilot.bars
    WHERE is_active = true AND campaign_id = ${campaign.id}
    ORDER BY id
  `;
  return NextResponse.json(locations);
}
