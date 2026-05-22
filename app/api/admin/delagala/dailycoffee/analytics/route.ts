import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { COFFEE_COST_EUR } from '@/lib/coupon';

export const runtime = 'nodejs';

export async function GET() {
  const sql = getDb();

  const [stats] = await sql`
    SELECT
      COUNT(*)::int                                                        AS total,
      COUNT(*) FILTER (WHERE status = 'generated')::int                   AS generated,
      COUNT(*) FILTER (WHERE status = 'claimed')::int                     AS claimed,
      COUNT(*) FILTER (WHERE status = 'redeemed')::int                    AS redeemed,
      COUNT(*) FILTER (WHERE status = 'expired')::int                     AS expired,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int                   AS cancelled,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last_7_days,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30_days
    FROM marketing_pilot.coffee_coupons
  `;

  const byBar = await sql`
    SELECT b.name, b.city,
           COUNT(c.id)::int AS total,
           COUNT(c.id) FILTER (WHERE c.status = 'redeemed')::int AS redeemed
    FROM marketing_pilot.bars b
    LEFT JOIN marketing_pilot.coffee_coupons c ON c.bar_id = b.id
    GROUP BY b.id, b.name, b.city
    ORDER BY total DESC
  `;

  const dailyTrend = await sql`
    SELECT DATE(created_at) AS day, COUNT(*)::int AS count
    FROM marketing_pilot.coffee_coupons
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `;

  const recentEvents = await sql`
    SELECT e.event_type, e.metadata, e.created_at,
           c.coupon_code, c.lead_name
    FROM marketing_pilot.coffee_coupon_events e
    JOIN marketing_pilot.coffee_coupons c ON c.id = e.coupon_id
    ORDER BY e.created_at DESC
    LIMIT 20
  `;

  const conversion_rate = stats.total > 0
    ? Math.round((stats.redeemed / stats.total) * 10000) / 100
    : 0;

  return NextResponse.json({
    stats: {
      ...stats,
      conversion_rate,
      estimated_cost_eur: parseFloat((stats.redeemed * COFFEE_COST_EUR).toFixed(2)),
    },
    by_bar: byBar,
    daily_trend: dailyTrend,
    recent_events: recentEvents,
  });
}
