import { NextRequest, NextResponse } from 'next/server';
import { getActiveSlug } from '@/lib/daily-active';
import { isLane, DEFAULT_ACTIVE } from '@/lib/dailies';

export const runtime = 'nodejs';

// Entrega dinámica del Daily activo de un carril.
// Las URLs fijas de las plantillas de WhatsApp se reescriben aquí (ver next.config.ts):
//   /delagala-daily.pdf           -> /api/daily/cafe_pan
//   /delagala-daily-bienestar.pdf -> /api/daily/herbolisteria
// Redirige (302) al PDF activo en /dailies/<slug>.pdf. Así se alterna el periódico
// desde el panel sin reimprimir carteles ni re-aprobar plantillas.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lane: string }> }
) {
  const { lane } = await params;
  if (!isLane(lane)) {
    return NextResponse.json({ error: 'Carril desconocido' }, { status: 404 });
  }

  let slug: string;
  try {
    slug = await getActiveSlug(lane);
  } catch {
    // Si la BD falla, caemos al defecto para no dejar al cliente sin periódico (RF-6).
    slug = DEFAULT_ACTIVE[lane];
  }

  const target = new URL(`/dailies/${slug}.pdf`, request.url);
  // 302: temporal, para que el enlace sea "vivo" y refleje siempre el activo actual.
  return NextResponse.redirect(target, 302);
}
