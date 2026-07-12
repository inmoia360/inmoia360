/* eslint-disable @typescript-eslint/no-explicit-any */
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

// Cliente SQL como template tag: sql`SELECT ... ${valor}` → filas.
// - URL de Neon (producción en Vercel): driver serverless de Neon (HTTP).
// - URL local/estándar (desarrollo): driver `pg` clásico, misma interfaz.
// Así el mismo código corre contra Neon en producción y contra un
// Postgres local en desarrollo sin tocar nada más.

export interface SqlClient {
  (strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
  /** Llamada convencional: sql.query('SELECT ... $1', [v]) */
  query(text: string, params?: any[]): Promise<any[]>;
}

let pgPool: Pool | null = null;

function pgClient(connectionString: string): SqlClient {
  if (!pgPool) pgPool = new Pool({ connectionString });
  const tag = (async (strings: TemplateStringsArray, ...values: any[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) text += `$${i + 1}` + strings[i + 1];
    const res = await pgPool!.query(text, values);
    return res.rows;
  }) as SqlClient;
  tag.query = async (text: string, params?: any[]) => {
    const res = await pgPool!.query(text, params);
    return res.rows;
  };
  return tag;
}

export function getDb(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const isNeon = /neon\.tech|neon\.build/i.test(url);
  return isNeon ? (neon(url) as unknown as SqlClient) : pgClient(url);
}
