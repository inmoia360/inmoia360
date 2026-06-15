import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

// Base de datos SEPARADA del pan: esquema "pan" (no se mezcla con el cafe).
export async function GET() {
  const sql = getDb();
  const locations = await sql`
    SELECT id, name FROM pan.locations
    WHERE is_active = true
    ORDER BY id
  `;
  return NextResponse.json(locations);
}
