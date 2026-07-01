import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureMortgageLeads } from '@/lib/ensure-mortgage';

export const runtime = 'nodejs';

const VALID_STATUS = ['new', 'contacted', 'qualified', 'won', 'lost'];

function checkAuth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  // Contraseña propia del panel de hipotecas si se define; si no, la compartida.
  const expected = process.env.HIPOTECAS_ADMIN_PASSWORD || process.env.DAILYCOFFEE_ADMIN_PASSWORD;
  return !!pwd && !!expected && pwd === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();
  await ensureMortgageLeads();

  const [leads, statsRows] = await Promise.all([
    sql`
      SELECT id, brand, service, lead_name, lead_phone, lead_email, message,
             calc, source_url, consent_privacy, consent_marketing, status, created_at
      FROM hipotecas.leads
      ORDER BY created_at DESC
      LIMIT 300
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE brand = 'delagala')::int AS delagala,
        COUNT(*) FILTER (WHERE brand = 'blanca')::int AS blanca,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))::int AS this_month,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int AS today,
        COUNT(*) FILTER (WHERE status = 'new')::int AS pending
      FROM hipotecas.leads
    `,
  ]);

  return NextResponse.json({ leads, stats: statsRows[0] });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  if (!VALID_STATUS.includes(status)) return NextResponse.json({ error: 'estado inválido' }, { status: 400 });

  const sql = getDb();
  await ensureMortgageLeads();
  const [lead] = await sql`
    UPDATE hipotecas.leads SET status = ${status} WHERE id = ${id}
    RETURNING id, status
  `;
  if (!lead) return NextResponse.json({ error: 'no encontrado' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const sql = getDb();
  await ensureMortgageLeads();
  await sql`DELETE FROM hipotecas.leads WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
