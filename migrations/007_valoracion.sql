-- ============================================================
-- 007 · Agente Tasador: valoración orientativa de vivienda
-- Landing: /valoracion (lead magnet de captación de propietarios)
-- BASE PROPIA Y SEPARADA: esquema `valoracion`. No mezclar con
-- hipotecas ni con las campañas de café/pan.
-- Idempotente: el runner ejecuta todas las migraciones cada vez.
--
-- REGLA DEL SISTEMA: el precio NO lo dice el LLM. Sale de los
-- comparables de `valoracion.comps`. Sin comparables suficientes
-- NO hay valoración (ver lib/valuation.ts).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS valoracion;

-- ── Comparables (testigos) ──────────────────────────────────
-- Cada fila es un inmueble real con precio conocido. Poblada por
-- ingesta (histórico del OS, índices públicos, o API de portal).
-- NUNCA se consulta un portal en caliente durante la petición.
CREATE TABLE IF NOT EXISTS valoracion.comps (
  id             SERIAL PRIMARY KEY,
  -- Localización
  postal_code    TEXT NOT NULL,
  city           TEXT NOT NULL,
  district       TEXT,                       -- barrio: Las Arenas, Algorta, Neguri…
  -- Inmueble
  property_type  TEXT NOT NULL DEFAULT 'piso'
                   CHECK (property_type IN ('piso','casa','duplex','atico','bajo','local','terreno')),
  area_m2        NUMERIC NOT NULL CHECK (area_m2 > 0),
  bedrooms       INT,
  bathrooms      INT,
  floor          INT,                        -- 0 = bajo
  has_elevator   BOOLEAN,
  condition      TEXT CHECK (condition IN ('reformar','bien','reformado','obra_nueva')),
  is_exterior    BOOLEAN,
  build_year     INT,
  -- Precio (el dato que importa)
  price          NUMERIC NOT NULL CHECK (price > 0),
  price_m2       NUMERIC GENERATED ALWAYS AS (price / NULLIF(area_m2, 0)) STORED,
  -- Trazabilidad: sin esto un comparable no vale nada
  is_closed_sale BOOLEAN NOT NULL DEFAULT false,  -- true = venta cerrada (oro); false = oferta
  source         TEXT NOT NULL,              -- 'os-delagala' / 'eustat' / 'idealista-api' / 'manual'
  source_ref     TEXT,                       -- id/URL en el origen, para auditar
  observed_at    DATE NOT NULL,              -- fecha del precio, NO la de la carga
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valoracion_comps_zona
  ON valoracion.comps(postal_code, property_type, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_valoracion_comps_district
  ON valoracion.comps(district, property_type, observed_at DESC);

-- ── Leads (propietarios que piden valoración) ───────────────
CREATE TABLE IF NOT EXISTS valoracion.leads (
  id                 SERIAL PRIMARY KEY,
  brand              TEXT NOT NULL DEFAULT 'delagala',
  -- Contacto
  lead_name          TEXT NOT NULL,
  lead_phone         TEXT NOT NULL,
  lead_email         TEXT,
  -- Inmueble declarado por el propietario (input del motor)
  property           JSONB NOT NULL,
  -- Resultado del motor. NULL = no hubo comparables suficientes:
  -- el agente NO da precio y se deriva a un asesor. Es un caso
  -- válido y esperado, no un error.
  valuation          JSONB,
  -- RGPD: la llamada saliente exige consentimiento explícito
  consent_privacy    BOOLEAN NOT NULL DEFAULT false,
  consent_call       BOOLEAN NOT NULL DEFAULT false,
  -- Trazabilidad del embudo
  source_url         TEXT,
  forwarded_to_os    BOOLEAN NOT NULL DEFAULT false,
  vapi_call_id       TEXT,                   -- llamada saliente disparada (fase 2)
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new','called','booked','won','lost')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valoracion_leads_status  ON valoracion.leads(status);
CREATE INDEX IF NOT EXISTS idx_valoracion_leads_created ON valoracion.leads(created_at DESC);
