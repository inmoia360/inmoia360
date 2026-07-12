// ============================================================
// Puente hacia DELAgala OS (el sistema central de gestión).
// Las landings de inmoia360 captan; el OS clasifica, cualifica
// y lleva el lead hasta la operación. Este módulo reenvía cada
// lead capturado al endpoint público del OS.
//
// Diseño "no se pierde ni un lead":
//  - inmoia360 SIEMPRE guarda primero en su propia base (Neon).
//  - El reenvío al OS es best-effort: si el OS no está accesible
//    (p. ej. aún vive solo en local), NO rompe la captación.
//  - OS_CAPTURE_URL sin definir => no-op silencioso.
// ============================================================

export interface OsLeadPayload {
  ownerIntent: string;          // VENDER / HIPOTECA / ...
  address: string;              // dirección o zona (el OS lo exige)
  name: string;
  phone?: string;
  email?: string;
  urgency?: string;             // URGE => prioridad alta en el OS
  propertyType?: string;
  bedrooms?: number;
  landing_path?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  angle?: string;               // qué pieza captó: diagnostico, hipotecas-delagala...
  referrer?: string;
  timestamp?: string;
}

/** Reenvía un lead al DELAgala OS. Devuelve true si el OS lo aceptó. */
export async function forwardLeadToOs(payload: OsLeadPayload): Promise<boolean> {
  const base = (process.env.OS_CAPTURE_URL ?? '').trim();
  if (!base) return false;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/public-leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toISOString(), ...payload }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[os-bridge] OS rechazó el lead', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[os-bridge] OS no accesible, lead guardado solo en local', e);
    return false;
  }
}
