import { getDb } from './db';

export type Campaign = {
  id: number;
  slug: string;
  client_slug: string;
  name: string;
  product_label: string;
  description: string | null;
  coupon_prefix: string;
  expires_days: number;
  location_label: string;
  is_active: boolean;
};

/** Carga una campaña activa por su slug (dailycoffee, dailybread, ...). */
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, slug, client_slug, name, product_label, description,
           coupon_prefix, expires_days, location_label, is_active
    FROM marketing_pilot.campaigns
    WHERE slug = ${slug} AND is_active = true
    LIMIT 1
  `;
  return (rows[0] as Campaign) ?? null;
}
