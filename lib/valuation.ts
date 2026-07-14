// ============================================================
// Motor de valoración orientativa de vivienda.
//
// LA REGLA QUE GOBIERNA ESTE ARCHIVO:
//   El precio NO lo dice el LLM. Lo calcula este motor a partir de
//   comparables reales. La IA solo EXPLICA lo que aquí se decide.
//   Sin comparables suficientes NO hay valoración: se devuelve null
//   y el propietario se deriva a un asesor. Nunca se improvisa un
//   número. (Ver specs/agente-tasador.md)
//
// Funciones puras: mismos inputs → mismo output. Los comparables se
// le pasan ya cargados (findComps vive en el API route), para que el
// motor se pueda testear sin base de datos.
// ============================================================

export type PropertyType = 'piso' | 'casa' | 'duplex' | 'atico' | 'bajo';
export type Condition = 'reformar' | 'bien' | 'reformado' | 'obra_nueva';

/** Lo que el propietario declara en el formulario. */
export interface PropertyInput {
  postalCode: string;
  district?: string;
  propertyType: PropertyType;
  areaM2: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;          // 0 = bajo
  hasElevator?: boolean;
  condition?: Condition;
  isExterior?: boolean;
  buildYear?: number;
  hasGarage?: boolean;
  hasTerrace?: boolean;
}

/** Un testigo: inmueble real con precio conocido (tabla valoracion.comps). */
export interface Comp {
  id: number;
  district: string | null;
  propertyType: string;
  areaM2: number;
  priceM2: number;
  /** true = venta cerrada (el dato bueno). false = precio de oferta (pedido). */
  isClosedSale: boolean;
  source: string;
  observedAt: Date;
}

export interface Valuation {
  min: number;
  central: number;
  max: number;
  /** €/m² finalmente aplicado al inmueble, ya ajustado. */
  pricePerM2: number;
  /** €/m² mediano de la zona, antes de ajustar por características. */
  zonePricePerM2: number;
  compsUsed: number;
  /** Cuánto suma o resta cada característica. Se enseña: es la auditoría. */
  adjustments: { label: string; factor: number }[];
  confidence: 'alta' | 'media' | 'baja';
  method: string;
}

/** Por qué no se pudo valorar. El formulario capta el lead igualmente. */
export type NoValuationReason =
  | 'sin_comparables'      // no hay testigos en la zona
  | 'pocos_comparables'    // hay, pero por debajo del mínimo
  | 'datos_insuficientes'; // el propietario no dio m² o zona

export type ValuationResult =
  | { ok: true; valuation: Valuation }
  | { ok: false; reason: NoValuationReason; compsFound: number };

// ── Parámetros del motor ────────────────────────────────────
// TODO(calibrar): estos coeficientes son la hipótesis de partida del
// sector. En cuanto haya volumen de ventas cerradas de DELAGALA en
// valoracion.comps, hay que recalibrarlos contra los datos reales.
// Mientras tanto son defendibles, pero NO son la verdad revelada.

/** Mínimo de testigos para atreverse a dar un número. */
export const MIN_COMPS = 5;

/** Antigüedad máxima del dato. Una venta cerrada envejece mejor que una oferta. */
export const MAX_AGE_DAYS = { closedSale: 365, listing: 180 } as const;

/** Solo son comparables los inmuebles de tamaño parecido (±35% de m²). */
export const AREA_TOLERANCE = 0.35;

/**
 * Los precios de OFERTA son precios PEDIDOS, no pagados: en España se
 * cierra habitualmente por debajo del anuncio. Si un testigo es una
 * oferta, se le aplica este recorte antes de entrar en la mediana.
 */
export const LISTING_HAIRCUT = 0.93; // −7%

/** Ajustes sobre el €/m² de la zona, por característica del inmueble. */
export const ADJUSTMENTS = {
  condition: {
    reformar: 0.85,   // −15%: hay que meter obra
    bien: 1.0,        // referencia
    reformado: 1.08,  // +8%
    obra_nueva: 1.15, // +15%
  },
  /** Bajo: menos luz y más ruido. Se penaliza. */
  groundFloor: 0.92,           // −8%
  /** Sin ascensor a partir de un 3º: la penalización crece con la altura. */
  noElevatorPerFloorFrom3rd: 0.05, // −5% por planta desde la 3ª, tope −20%
  noElevatorMaxPenalty: 0.20,
  /** Altura con ascensor: más luz y vistas. */
  highFloorWithElevator: 1.04, // +4% de una 4ª en adelante
  interior: 0.90,              // −10%: no da a la calle
  garage: 1.05,                // +5%
  terrace: 1.03,               // +3%
  /** Vivienda muy antigua sin reformar: instalaciones y eficiencia. */
  oldBuilding: 0.95,           // −5% si es anterior a 1960
} as const;

// ── Utilidades estadísticas ─────────────────────────────────

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/**
 * Dispersión robusta: rango intercuartílico relativo a la mediana.
 * Un barrio homogéneo da poca dispersión (rango estrecho, confianza
 * alta); uno donde conviven pisos y chalets da mucha (rango ancho).
 */
export function relativeIqr(xs: number[]): number {
  if (xs.length < 4) return 0.5;
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const m = median(s);
  if (!m) return 0.5;
  return (q(0.75) - q(0.25)) / m;
}

// ── Selección de comparables ────────────────────────────────

/**
 * Filtra los testigos que de verdad se parecen al inmueble: mismo tipo,
 * tamaño similar y dato reciente. Prioriza el barrio si lo hay.
 */
export function selectComps(
  input: PropertyInput,
  comps: Comp[],
  now: Date = new Date()
): Comp[] {
  const fresh = (c: Comp) => {
    const days = (now.getTime() - c.observedAt.getTime()) / 86_400_000;
    return days <= (c.isClosedSale ? MAX_AGE_DAYS.closedSale : MAX_AGE_DAYS.listing);
  };
  const sameKind = (c: Comp) => c.propertyType === input.propertyType;
  const similarSize = (c: Comp) =>
    Math.abs(c.areaM2 - input.areaM2) / input.areaM2 <= AREA_TOLERANCE;

  const base = comps.filter((c) => fresh(c) && sameKind(c) && similarSize(c));

  // Si el barrio da por sí solo suficientes testigos, se usa solo el
  // barrio: es más preciso que mezclar todo el municipio.
  if (input.district) {
    const local = base.filter((c) => c.district === input.district);
    if (local.length >= MIN_COMPS) return local;
  }
  return base;
}

/** €/m² de un testigo, ya normalizado a precio de venta esperado. */
export function normalizedPriceM2(c: Comp): number {
  return c.isClosedSale ? c.priceM2 : c.priceM2 * LISTING_HAIRCUT;
}

// ── Ajustes por características ─────────────────────────────

/** Devuelve cada ajuste por separado: el propietario tiene derecho a ver el porqué. */
export function computeAdjustments(input: PropertyInput): { label: string; factor: number }[] {
  const out: { label: string; factor: number }[] = [];

  if (input.condition && input.condition !== 'bien') {
    const labels: Record<Condition, string> = {
      reformar: 'A reformar',
      bien: 'Buen estado',
      reformado: 'Reformado',
      obra_nueva: 'Obra nueva',
    };
    out.push({ label: labels[input.condition], factor: ADJUSTMENTS.condition[input.condition] });
  }

  const floor = input.floor;
  if (floor != null) {
    if (floor === 0) {
      out.push({ label: 'Planta baja', factor: ADJUSTMENTS.groundFloor });
    } else if (input.hasElevator === false && floor >= 3) {
      const penalty = Math.min(
        ADJUSTMENTS.noElevatorMaxPenalty,
        (floor - 2) * ADJUSTMENTS.noElevatorPerFloorFrom3rd
      );
      out.push({ label: `Planta ${floor}ª sin ascensor`, factor: 1 - penalty });
    } else if (input.hasElevator === true && floor >= 4) {
      out.push({ label: `Planta ${floor}ª con ascensor`, factor: ADJUSTMENTS.highFloorWithElevator });
    }
  }

  if (input.isExterior === false) {
    out.push({ label: 'Interior', factor: ADJUSTMENTS.interior });
  }
  if (input.hasGarage) {
    out.push({ label: 'Garaje', factor: ADJUSTMENTS.garage });
  }
  if (input.hasTerrace) {
    out.push({ label: 'Terraza', factor: ADJUSTMENTS.terrace });
  }
  if (input.buildYear != null && input.buildYear < 1960 && input.condition === 'reformar') {
    out.push({ label: 'Edificio anterior a 1960', factor: ADJUSTMENTS.oldBuilding });
  }

  return out;
}

// ── El motor ────────────────────────────────────────────────

/**
 * Valora el inmueble. Devuelve `ok: false` —y NINGÚN número— cuando no
 * hay base para valorar. Ese caso no es un fallo: es el motor haciendo
 * su trabajo. El propietario se deriva a un asesor y el lead se capta igual.
 */
export function estimateValue(
  input: PropertyInput,
  comps: Comp[],
  now: Date = new Date()
): ValuationResult {
  if (!input.areaM2 || input.areaM2 <= 0 || !input.postalCode) {
    return { ok: false, reason: 'datos_insuficientes', compsFound: 0 };
  }

  const selected = selectComps(input, comps, now);
  if (selected.length === 0) {
    return { ok: false, reason: 'sin_comparables', compsFound: 0 };
  }
  if (selected.length < MIN_COMPS) {
    return { ok: false, reason: 'pocos_comparables', compsFound: selected.length };
  }

  const pricesM2 = selected.map(normalizedPriceM2);
  const zonePricePerM2 = median(pricesM2);

  const adjustments = computeAdjustments(input);
  const factor = adjustments.reduce((acc, a) => acc * a.factor, 1);
  const pricePerM2 = zonePricePerM2 * factor;
  const central = pricePerM2 * input.areaM2;

  // La amplitud del rango la manda la dispersión real de la zona, no un
  // porcentaje inventado: entre ±5% (zona homogénea) y ±15% (zona dispar).
  const spread = Math.min(0.15, Math.max(0.05, relativeIqr(pricesM2) / 2));

  const closedSales = selected.filter((c) => c.isClosedSale).length;
  const confidence: Valuation['confidence'] =
    selected.length >= 15 && spread <= 0.08 ? 'alta'
      : selected.length >= 8 && spread <= 0.12 ? 'media'
        : 'baja';

  return {
    ok: true,
    valuation: {
      min: Math.round((central * (1 - spread)) / 1000) * 1000,
      central: Math.round(central / 1000) * 1000,
      max: Math.round((central * (1 + spread)) / 1000) * 1000,
      pricePerM2: Math.round(pricePerM2),
      zonePricePerM2: Math.round(zonePricePerM2),
      compsUsed: selected.length,
      adjustments,
      confidence,
      method:
        `Mediana de ${selected.length} comparables` +
        (closedSales ? ` (${closedSales} de ventas cerradas)` : ' de oferta') +
        `, ajustada por las características del inmueble.`,
    },
  };
}

/**
 * Aviso legal. Va SIEMPRE junto a cualquier valoración que se enseñe o
 * se diga por teléfono. No es letra pequeña: es lo que separa esto de
 * una tasación oficial, que solo firma una sociedad homologada por el
 * Banco de España (Orden ECO/805/2003).
 */
export const AVISO_LEGAL =
  'Valoración orientativa de mercado calculada con datos de inmuebles comparables. ' +
  'No es una tasación oficial (Orden ECO/805/2003), que solo puede emitir una sociedad ' +
  'de tasación homologada por el Banco de España, ni sirve para solicitar una hipoteca.';
