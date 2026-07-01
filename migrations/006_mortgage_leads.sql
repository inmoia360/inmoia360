-- ============================================================
-- 006 · Servicio de intermediación hipotecaria (LCCI)
-- Landings: /hipotecas (marca blanca) y /delagala/hipotecas (élite)
-- BASE PROPIA Y SEPARADA: esquema `hipotecas`. NO tiene nada que ver
-- con las campañas de café (marketing_pilot) ni pan (pan). No mezclar.
-- Idempotente: el runner ejecuta todas las migraciones cada vez.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS hipotecas;

CREATE TABLE IF NOT EXISTS hipotecas.leads (
  id                 SERIAL PRIMARY KEY,
  brand              TEXT NOT NULL DEFAULT 'delagala'
                       CHECK (brand IN ('delagala','blanca')),
  service            TEXT,                       -- estudio / mejora / compra / ...
  lead_name          TEXT NOT NULL,
  lead_phone         TEXT NOT NULL,
  lead_email         TEXT,
  message            TEXT,
  calc               JSONB,                      -- snapshot de la calculadora
  source_url         TEXT,
  consent_privacy    BOOLEAN NOT NULL DEFAULT false,
  consent_marketing  BOOLEAN NOT NULL DEFAULT false,
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new','contacted','qualified','won','lost')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hipotecas_leads_brand   ON hipotecas.leads(brand);
CREATE INDEX IF NOT EXISTS idx_hipotecas_leads_status  ON hipotecas.leads(status);
CREATE INDEX IF NOT EXISTS idx_hipotecas_leads_created ON hipotecas.leads(created_at DESC);
