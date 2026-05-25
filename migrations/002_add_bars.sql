-- ============================================================
-- InmoIA360 · Add bars: Las Mercedes & Premier
-- Run once against your Neon database
-- ============================================================

INSERT INTO marketing_pilot.bars (slug, name, address, city)
VALUES
  ('las-mercedes', 'Las Mercedes', 'Calle Las Mercedes', 'Getxo'),
  ('premier', 'Premier', NULL, 'Getxo')
ON CONFLICT (slug) DO NOTHING;
