-- ============================================================
-- 005 · Consentimiento de marketing inmobiliario (segmento B)
-- Captura quién marcó la casilla opcional "Quiero recibir
-- información inmobiliaria". Sin esto no se puede segmentar
-- ni demostrar el consentimiento (RGPD).
-- Idempotente: el runner ejecuta todas las migraciones cada vez.
-- ============================================================

-- PAN (esquema pan, campaña dailybread)
ALTER TABLE pan.coupons
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN NOT NULL DEFAULT false;

-- CAFÉ (esquema marketing_pilot, campaña dailycoffee)
ALTER TABLE marketing_pilot.coffee_coupons
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN NOT NULL DEFAULT false;
