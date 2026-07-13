import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';
import { ensureInbox } from '@/lib/wa-inbox';

export const runtime = 'nodejs';

// Bandeja de entrada de WhatsApp (respuestas de los leads). Auth por cookie + middleware.
export async function GET(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureInbox();
  const sql = getDb();
  const messages = await sql`
    SELECT id, wa_from, wa_name, direction, msg_type, body, created_at
    FROM wa.messages
    ORDER BY created_at DESC
    LIMIT 500
  `;
  // Estadísticas de la campaña (Delagala Daily): enviados / entregados / leídos
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE direction = 'out' AND body LIKE '[Newsletter]%')::int AS sent,
      COUNT(*) FILTER (WHERE direction = 'out' AND body LIKE '[Newsletter]%' AND status IN ('delivered','read'))::int AS delivered,
      COUNT(*) FILTER (WHERE direction = 'out' AND body LIKE '[Newsletter]%' AND status = 'read')::int AS read
    FROM wa.messages
  `;
  return NextResponse.json({ messages, broadcastStats: stats });
}
