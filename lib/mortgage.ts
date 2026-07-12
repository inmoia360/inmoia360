// ============================================================
// Config de marca + cálculos de la calculadora hipotecaria.
// Usado por las dos landings (marca blanca y DELAGALA élite).
// Las funciones de cálculo son puras: sirven en cliente y servidor.
// ============================================================

export type BrandKey = 'delagala' | 'blanca';

export interface BrandConfig {
  key: BrandKey;
  /** Nombre visible de la marca */
  name: string;
  /** Segunda línea del logo / claim corto */
  kicker: string;
  /** Ruta a la imagen del logo (en /public). Si no hay, se usa la inicial en un recuadro. */
  logoSrc?: string;
  /** Titular grande del hero (se admite <em> como salto+acento) */
  heroTitle: string;
  heroTitleEm: string;
  heroLede: string;
  /** Datos legales del responsable del tratamiento (RGPD) */
  legalName: string;
  cif: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  /** Paleta — se inyecta como CSS vars en la raíz de la landing */
  colors: {
    ink: string;
    inkSoft: string;
    inkMute: string;
    bg: string;
    bgSoft: string;
    accent: string;      // color de marca principal
    accentDeep: string;  // variante oscura para hover/textos
    accentSoft: string;  // fondo suave
  };
  fonts: {
    display: string;     // familia titulares
    body: string;        // familia texto
    googleHref: string;  // URL @import de Google Fonts
  };
}

export const BRANDS: Record<BrandKey, BrandConfig> = {
  // ── Marca élite: DELAGALA ─────────────────────────────────
  delagala: {
    key: 'delagala',
    name: 'DELAGALA',
    kicker: 'Consultoría Inmobiliaria',
    logoSrc: '/delagala-logo.png',
    heroTitle: 'Tu hipoteca,',
    heroTitleEm: 'negociada por expertos.',
    heroLede:
      'Analizamos tu perfil, comparamos la oferta de la banca y negociamos por ti las mejores condiciones. Un servicio de intermediación de crédito inmobiliario al amparo de la Ley 5/2019 (LCCI).',
    legalName: 'ICA HOME S.L.',
    cif: 'B10641546',
    address: 'Calle Las Mercedes 17, 48930 Getxo',
    email: 'info@idelagala.com',
    phone: '662 128 409',
    website: 'idelagala.com',
    colors: {
      ink: '#0A0A0A',
      inkSoft: '#2A2A2A',
      inkMute: '#6B6B6B',
      bg: '#FFFFFF',
      bgSoft: '#FAF7ED',
      accent: '#F5C842',
      accentDeep: '#E5B520',
      accentSoft: '#FFF4C2',
    },
    fonts: {
      display: "'Playfair Display', serif",
      body: "'Montserrat', sans-serif",
      googleHref:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Montserrat:wght@400;500;600;700;800&display=swap',
    },
  },

  // ── Marca blanca: identidad financiera neutra ─────────────
  blanca: {
    key: 'blanca',
    name: 'Hipoteca Justa',
    kicker: 'La hipoteca que mereces',
    heroTitle: 'Encuentra la hipoteca',
    heroTitleEm: 'que de verdad te conviene.',
    heroLede:
      'Comparamos y negociamos con la banca por ti para que consigas las mejores condiciones, sin coste inicial y sin complicaciones. Servicio de intermediación de crédito inmobiliario conforme a la Ley 5/2019 (LCCI).',
    legalName: 'ICA HOME S.L.',
    cif: 'B10641546',
    address: 'Calle Las Mercedes 17, 48930 Getxo',
    email: 'hola@hipotecajusta.es',
    phone: '603 507 168',
    website: 'hipotecajusta.es',
    colors: {
      ink: '#0F172A',
      inkSoft: '#334155',
      inkMute: '#64748B',
      bg: '#FFFFFF',
      bgSoft: '#F1F5F9',
      accent: '#2563EB',
      accentDeep: '#1D4ED8',
      accentSoft: '#DBEAFE',
    },
    fonts: {
      display: "'Sora', sans-serif",
      body: "'Inter', sans-serif",
      googleHref:
        'https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
    },
  },
};

// ── Cálculos ────────────────────────────────────────────────

export interface QuotaInput {
  amount: number;   // capital solicitado (€)
  years: number;    // plazo en años
  rate: number;     // TIN anual en % (ej. 3.1)
}

export interface QuotaResult {
  monthly: number;      // cuota mensual (€)
  totalPaid: number;    // total pagado al final (€)
  totalInterest: number; // intereses totales (€)
}

/** Cuota por el sistema francés de amortización constante. */
export function computeQuota({ amount, years, rate }: QuotaInput): QuotaResult {
  const n = Math.max(1, Math.round(years * 12));
  const r = rate / 100 / 12;
  let monthly: number;
  if (r === 0) {
    monthly = amount / n;
  } else {
    monthly = (amount * r) / (1 - Math.pow(1 + r, -n));
  }
  const totalPaid = monthly * n;
  return {
    monthly,
    totalPaid,
    totalInterest: totalPaid - amount,
  };
}

export interface CapacityInput {
  netIncome: number;   // ingresos netos mensuales del hogar (€)
  otherDebts: number;  // otras cuotas mensuales ya comprometidas (€)
  years: number;       // plazo en años
  rate: number;        // TIN anual en %
  ratio?: number;      // % máximo de endeudamiento (por defecto 0.35)
}

export interface CapacityResult {
  maxMonthly: number;  // cuota máxima asumible (€)
  maxLoan: number;     // capital máximo financiable (€)
}

/**
 * Capacidad de endeudamiento: regla del 35%. La cuota máxima es
 * 35% de los ingresos netos menos otras deudas; de ahí se invierte
 * la fórmula francesa para obtener el capital máximo financiable.
 */
export function computeCapacity({
  netIncome,
  otherDebts,
  years,
  rate,
  ratio = 0.35,
}: CapacityInput): CapacityResult {
  const maxMonthly = Math.max(0, netIncome * ratio - otherDebts);
  const n = Math.max(1, Math.round(years * 12));
  const r = rate / 100 / 12;
  let maxLoan: number;
  if (r === 0) {
    maxLoan = maxMonthly * n;
  } else {
    maxLoan = (maxMonthly * (1 - Math.pow(1 + r, -n))) / r;
  }
  return { maxMonthly, maxLoan };
}

export function formatEuro(n: number, decimals = 0): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(isFinite(n) ? n : 0);
}
