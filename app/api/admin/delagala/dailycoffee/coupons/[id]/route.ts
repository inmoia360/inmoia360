import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { CouponStatus } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_STATUSES: CouponStatus[] = ['generated', 'claimed', 'redeemed', 'expired', 'cancelled'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json().catch(() => ({}));

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const sql = getDb();
  const [existing] = await sql`
    SELECT id, status FROM marketing_pilot.coffee_coupons WHERE id = ${id}
  `;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const extra = status === 'redeemed' ? sql`, redeemed_at = NOW()` :
                status === 'claimed'  ? sql`, claimed_at = NOW()`  : sql``;

  await sql`
    UPDATE marketing_pilot.coffee_coupons
    SET status = ${status} ${extra}
    WHERE id = ${id}
  `;

  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, event_type, metadata)
    VALUES (
      ${id},
      ${status === 'redeemed' ? 'coupon_redeemed' : 'admin_status_changed'},
      ${JSON.stringify({ previous: existing.status, new: status })}::jsonb
    )
  `;

  return NextResponse.json({ ok: true });
}

// DELETE: borra un cupón y sus eventos. Útil para desbloquear un número de prueba
// (el límite de 1 cupón/30 días mira created_at; al borrar el cupón, ese número
// puede volver a registrarse y recibir el WhatsApp).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getDb();
  const [existing] = await sql`
    SELECT id, lead_phone FROM marketing_pilot.coffee_coupons WHERE id = ${id}
  `;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Primero los eventos (FK), luego el cupón.
  await sql`DELETE FROM marketing_pilot.coffee_coupon_events WHERE coupon_id = ${id}`;
  await sql`DELETE FROM marketing_pilot.coffee_coupons WHERE id = ${id}`;

  return NextResponse.json({ ok: true, deleted: id, phone: existing.lead_phone });
}
