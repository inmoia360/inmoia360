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
    SELECT id, slug, name, address, city
    FROM marketing_pilot.bars
    WHERE is_active = true AND campaign_id = ${campaign.id}
    ORDER BY name
  `;

  return NextResponse.json({
    campaign: {
      slug: campaign.slug,
      client: campaign.client_slug,
      name: campaign.name,
      description: campaign.description,
      product_label: campaign.product_label,
      location_label: campaign.location_label,
      expires_days: campaign.expires_days,
    },
    locations,
  });
}
