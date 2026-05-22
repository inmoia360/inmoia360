-- ============================================================
-- InmoIA360 · Marketing Pilot Schema
-- Campaña: delagala/dailycoffee
-- Run once against your Neon database
-- ============================================================

CREATE SCHEMA IF NOT EXISTS marketing_pilot;

-- ---------------------------------------------------------------
-- BARS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_pilot.bars (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- COFFEE COUPONS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_pilot.coffee_coupons (
  id           SERIAL PRIMARY KEY,
  coupon_code  TEXT UNIQUE NOT NULL,
  lead_name    TEXT NOT NULL,
  lead_email   TEXT NOT NULL,
  lead_phone   TEXT NOT NULL,
  source_url   TEXT,
  bar_id       INTEGER REFERENCES marketing_pilot.bars(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'generated'
                 CHECK (status IN ('generated','claimed','redeemed','expired','cancelled')),
  claimed_at   TIMESTAMPTZ,
  redeemed_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code   ON marketing_pilot.coffee_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON marketing_pilot.coffee_coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_bar    ON marketing_pilot.coffee_coupons(bar_id);

-- ---------------------------------------------------------------
-- COUPON EVENTS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_pilot.coffee_coupon_events (
  id          SERIAL PRIMARY KEY,
  coupon_id   INTEGER REFERENCES marketing_pilot.coffee_coupons(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
                CHECK (event_type IN (
                  'landing_view','form_started','coupon_generated',
                  'coupon_sent','coupon_redeemed','admin_status_changed'
                )),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_coupon ON marketing_pilot.coffee_coupon_events(coupon_id);
CREATE INDEX IF NOT EXISTS idx_events_type   ON marketing_pilot.coffee_coupon_events(event_type);

-- ---------------------------------------------------------------
-- SEED: bar por defecto
-- ---------------------------------------------------------------
INSERT INTO marketing_pilot.bars (slug, name, address, city)
VALUES ('delagala-getxo', 'DELAGALA Getxo', 'Calle Las Mercedes 17', 'Getxo')
ON CONFLICT (slug) DO NOTHING;
