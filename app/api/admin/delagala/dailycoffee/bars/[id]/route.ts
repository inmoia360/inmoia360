import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { name, address, city, is_active } = body;

  const sql = getDb();
  const [updated] = await sql`
    UPDATE marketing_pilot.bars
    SET
      name      = COALESCE(${name ?? null},      name),
      address   = COALESCE(${address ?? null},   address),
      city      = COALESCE(${city ?? null},       city),
      is_active = COALESCE(${is_active ?? null}, is_active)
    WHERE id = ${id}
    RETURNING *
  `;
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
