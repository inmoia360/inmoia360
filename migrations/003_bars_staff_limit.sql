-- ============================================================
-- InmoIA360 · Bars: staff WhatsApp + monthly coupon limit
-- ============================================================

ALTER TABLE marketing_pilot.bars
  ADD COLUMN IF NOT EXISTS staff_whatsapp TEXT,       -- WhatsApp del camarero (ej: 34600000000)
  ADD COLUMN IF NOT EXISTS coupon_limit   INTEGER NOT NULL DEFAULT 50; -- límite mensual de cafés
