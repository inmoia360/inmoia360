-- ============================================================
-- InmoIA360 · Multi-campaña (motor de campañas)
-- Convierte el piloto "dailycoffee" en un motor que soporta
-- varias campañas (café, pan & queso, ...) compartiendo lógica.
-- Additivo y seguro: el café existente sigue funcionando igual.
-- Run once against your Neon database.
-- ============================================================

-- ---------------------------------------------------------------
-- CAMPAIGNS  (una fila por campaña/gancho)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_pilot.campaigns (
  id             SERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,        -- dailycoffee, dailybread, ...
  client_slug    TEXT NOT NULL DEFAULT 'delagala',
  name           TEXT NOT NULL,               -- "Un café de la inmobiliaria"
  product_label  TEXT NOT NULL,               -- "café", "pan y queso"
  description     TEXT,
  coupon_prefix  TEXT NOT NULL DEFAULT 'DLG',
  expires_days   INTEGER NOT NULL DEFAULT 30,
  location_label TEXT NOT NULL DEFAULT 'bar', -- cómo se llama el sitio: "bar", "panadería"
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaña existente del café
INSERT INTO marketing_pilot.campaigns (slug, client_slug, name, product_label, description, coupon_prefix, expires_days, location_label)
VALUES ('dailycoffee', 'delagala', 'Un café de la inmobiliaria', 'café', 'Café gratis + Delagala Daily', 'DLG', 30, 'bar')
ON CONFLICT (slug) DO NOTHING;

-- Nueva campaña: pan & queso
INSERT INTO marketing_pilot.campaigns (slug, client_slug, name, product_label, description, coupon_prefix, expires_days, location_label)
VALUES ('dailybread', 'delagala', 'Pan y queso de la inmobiliaria', 'pan y queso', 'Pan o queso gratis + Delagala Daily', 'DLG', 30, 'tienda')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------
-- Vincula las tablas existentes a una campaña
-- ---------------------------------------------------------------
ALTER TABLE marketing_pilot.bars
  ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE CASCADE;

ALTER TABLE marketing_pilot.coffee_coupons
  ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE SET NULL;

ALTER TABLE marketing_pilot.coffee_coupon_events
  ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE SET NULL;

-- Backfill: todo lo que ya existe pertenece a la campaña del café
UPDATE marketing_pilot.bars
  SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
  WHERE campaign_id IS NULL;

UPDATE marketing_pilot.coffee_coupons
  SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
  WHERE campaign_id IS NULL;

UPDATE marketing_pilot.coffee_coupon_events
  SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
  WHERE campaign_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bars_campaign    ON marketing_pilot.bars(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON marketing_pilot.coffee_coupons(campaign_id);

-- ---------------------------------------------------------------
-- SEED: locales de la campaña de pan & queso (edítalos en el admin)
-- ---------------------------------------------------------------
INSERT INTO marketing_pilot.bars (slug, name, address, city, campaign_id, coupon_limit)
SELECT v.slug, v.name, v.address, v.city,
       (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread'), 50
FROM (VALUES
  ('pan-antonio', 'Panadería Antonio', NULL, 'Getxo')
) AS v(slug, name, address, city)
ON CONFLICT (slug) DO NOTHING;
