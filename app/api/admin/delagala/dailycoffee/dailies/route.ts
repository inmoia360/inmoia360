import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestSession } from '@/lib/auth';
import { DAILIES, LANES, isLane } from '@/lib/dailies';
import { getAllActive, setActiveSlug } from '@/lib/daily-active';

export const runtime = 'nodejs';

// GET: catálogo de la biblioteca + periódico activo por carril. Requiere sesión del panel.
export async function GET(request: NextRequest) {
  const session = await verifyRequestSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const active = await getAllActive();
  return NextResponse.json({ dailies: DAILIES, lanes: LANES, active });
}

// PATCH: fija el periódico activo de un carril. Body {lane, slug}. Requiere sesión.
export async function PATCH(request: NextRequest) {
  const session = await verifyRequestSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { lane, slug } = await request.json().catch(() => ({}));
  if (!lane || !isLane(lane)) return NextResponse.json({ error: 'Carril inválido' }, { status: 400 });

  try {
    await setActiveSlug(lane, slug);
  } catch {
    return NextResponse.json({ error: 'Periódico desconocido' }, { status: 400 });
  }

  const active = await getAllActive();
  return NextResponse.json({ ok: true, active });
}
