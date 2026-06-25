import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestSession } from '@/lib/auth';
import { setUnsubscribed } from '@/lib/ensure-consent';

export const runtime = 'nodejs';

// Da de baja (o de alta de nuevo) a un lead por teléfono, en pan y café a la vez.
// action: 'baja' (por defecto) | 'alta'
export async function POST(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { phone, action } = await req.json().catch(() => ({}));
  if (!phone) return NextResponse.json({ error: 'phone requerido' }, { status: 400 });
  const value = action !== 'alta'; // por defecto, baja
  const updated = await setUnsubscribed(String(phone), value);
  return NextResponse.json({ ok: true, updated, unsubscribed: value });
}
