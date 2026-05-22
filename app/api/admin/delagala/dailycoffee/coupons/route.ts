import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const sql = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (statusFilter) { conditions.push(`c.status = $${pi++}`); params.push(statusFilter); }
  if (search) {
    conditions.push(`(c.lead_name ILIKE $${pi} OR c.lead_email ILIKE $${pi} OR c.coupon_code ILIKE $${pi})`);
    params.push(`%${search}%`); pi++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await sql.query(
    `SELECT c.*, b.name as bar_name
     FROM marketing_pilot.coffee_coupons c
     LEFT JOIN marketing_pilot.bars b ON b.id = c.bar_id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const [countRow] = await sql.query(
    `SELECT COUNT(*)::int as count FROM marketing_pilot.coffee_coupons c ${where}`,
    params
  );

  return NextResponse.json({ coupons: rows, total: countRow.count, page, limit });
}
