import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const sql = getDb();
  const bars = await sql`
    SELECT b.*, COUNT(c.id)::int as coupon_count
    FROM marketing_pilot.bars b
    LEFT JOIN marketing_pilot.coffee_coupons c ON c.bar_id = b.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;
  return NextResponse.json(bars);
}

export async function POST(request: NextRequest) {
  const { slug, name, address, city } = await request.json().catch(() => ({}));
  if (!slug?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
  }

  const sql = getDb();
  try {
    const [bar] = await sql`
      INSERT INTO marketing_pilot.bars (slug, name, address, city)
      VALUES (${slug.trim()}, ${name.trim()}, ${address?.trim() ?? null}, ${city?.trim() ?? null})
      RETURNING *
    `;
    return NextResponse.json(bar, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 });
    }
    throw e;
  }
}
