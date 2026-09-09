import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';
import { ensureBajasTable, logBaja } from '@/lib/bajas';
import { setUnsubscribed } from '@/lib/ensure-consent';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BAJA_WORDS = ['BAJA', 'STOP', 'UNSUBSCRIBE', 'CANCELAR', 'NO QUIERO', 'DARME DE BAJA'];

// GET: la base de datos APARTE de bajas. ?format=csv la descarga como CSV.
export async function GET(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureBajasTable();
  const sql = getDb();
  const rows = await sql`
    SELECT phone, name, source, reason, created_at
    FROM wa.unsubscribes ORDER BY created_at DESC`;

  const format = new URL(req.url).searchParams.get('format');
  if (format === 'csv') {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = 'nombre,telefono,origen,motivo,fecha_baja';
    const lines = (rows as Array<Record<string, unknown>>).map((r) =>
      [r.name, r.phone, r.source, r.reason, r.created_at].map(esc).join(','));
    const csv = [header, ...lines].join('\r\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bajas-delagala.csv"',
      },
    });
  }
  return NextResponse.json({ total: rows.length, bajas: rows });
}

// POST: backfill. (1) Da de baja a TODO el que haya escrito BAJA por WhatsApp y no
// estuviera ya de baja. (2) Registra en la base aparte todas las bajas ya existentes
// en café y pan. Idempotente: se puede lanzar las veces que haga falta.
export async function POST(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureBajasTable();
  const sql = getDb();

  // (1) Procesar los mensajes entrantes de BAJA (asegura baja + registro aparte).
  const inbound = await sql`
    SELECT DISTINCT wa_from, wa_name, body FROM wa.messages WHERE direction = 'in'`;
  let fromMessages = 0;
  for (const m of inbound as Array<{ wa_from: string; wa_name: string; body: string }>) {
    if (!m.wa_from) continue;
    if (BAJA_WORDS.includes(String(m.body || '').trim().toUpperCase())) {
      await setUnsubscribed(m.wa_from, true).catch(() => 0); // también registra en la base aparte
      fromMessages++;
    }
  }

  // (2) Registrar en la base aparte las bajas ya marcadas en café y pan.
  const pan = await sql`
    SELECT DISTINCT lead_phone, lead_name FROM pan.coupons WHERE unsubscribed IS TRUE AND lead_phone IS NOT NULL`;
  const cafe = await sql`
    SELECT DISTINCT lead_phone, lead_name FROM marketing_pilot.coffee_coupons WHERE unsubscribed IS TRUE AND lead_phone IS NOT NULL`;
  for (const r of pan as Array<{ lead_phone: string; lead_name: string }>) {
    await logBaja(r.lead_phone, r.lead_name, 'pan', 'baja').catch(() => {});
  }
  for (const r of cafe as Array<{ lead_phone: string; lead_name: string }>) {
    await logBaja(r.lead_phone, r.lead_name, 'cafe', 'baja').catch(() => {});
  }

  const [count] = await sql`SELECT COUNT(*)::int AS n FROM wa.unsubscribes`;
  return NextResponse.json({
    ok: true,
    bajas_por_mensaje_baja: fromMessages,
    bajas_pan: pan.length,
    bajas_cafe: cafe.length,
    total_en_base_aparte: count.n,
  });
}
