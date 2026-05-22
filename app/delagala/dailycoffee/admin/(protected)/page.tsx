import { getDb } from '@/lib/db';
import { COFFEE_COST_EUR } from '@/lib/coupon';

export const dynamic = 'force-dynamic';

async function getStats() {
  const sql = getDb();
  const [s] = await sql`
    SELECT
      COUNT(*)::int                                                         AS total,
      COUNT(*) FILTER (WHERE status = 'generated')::int                    AS generated,
      COUNT(*) FILTER (WHERE status = 'claimed')::int                      AS claimed,
      COUNT(*) FILTER (WHERE status = 'redeemed')::int                     AS redeemed,
      COUNT(*) FILTER (WHERE status = 'expired')::int                      AS expired,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week
    FROM marketing_pilot.coffee_coupons
  `;
  const recent = await sql`
    SELECT c.*, b.name as bar_name
    FROM marketing_pilot.coffee_coupons c
    LEFT JOIN marketing_pilot.bars b ON b.id = c.bar_id
    ORDER BY c.created_at DESC LIMIT 10
  `;
  return { stats: s, recent };
}

const STATUS_LABELS: Record<string, string> = {
  generated: 'Generado', claimed: 'Reclamado', redeemed: 'Canjeado', expired: 'Expirado', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  generated: '#2563eb', claimed: '#d97706', redeemed: '#16a34a', expired: '#9ca3af', cancelled: '#ef4444',
};

export default async function AdminDashboard() {
  const { stats, recent } = await getStats();
  const conversion = stats.total > 0 ? ((stats.redeemed / stats.total) * 100).toFixed(1) : '0';
  const cost = (stats.redeemed * COFFEE_COST_EUR).toFixed(2);

  return (
    <div>
      <div style={S.topbar}><h2 style={S.topbarTitle}>Dashboard</h2></div>
      <div style={S.content}>

        {/* Stats */}
        <div style={S.statsGrid}>
          {[
            { label: 'Total leads', value: stats.total, color: '#1a1a1a' },
            { label: 'Cafés canjeados', value: stats.redeemed, color: '#16a34a' },
            { label: 'Pendientes', value: stats.generated + stats.claimed, color: '#2563eb' },
            { label: 'Esta semana', value: stats.this_week, color: '#7c3aed' },
            { label: 'Conversión', value: `${conversion}%`, color: '#d97706' },
            { label: 'Coste est.', value: `${cost} €`, color: '#1a1a1a' },
          ].map(s => (
            <div key={s.label} style={S.statCard}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: '.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recientes */}
        <div style={S.tableWrap}>
          <div style={S.tableHeader}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Leads recientes</h3>
          </div>
          <table style={S.table}>
            <thead>
              <tr>{['Nombre', 'WhatsApp', 'Cupón', 'Bar', 'Estado', 'Fecha'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recent.map((c: Record<string, unknown>) => (
                <tr key={c.id as number} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={S.td}><strong>{c.lead_name as string}</strong></td>
                  <td style={S.td}>
                    <a href={`https://wa.me/${(c.lead_phone as string).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                      💬 {c.lead_phone as string}
                    </a>
                  </td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{c.coupon_code as string}</td>
                  <td style={S.td}>{c.bar_name as string ?? '—'}</td>
                  <td style={S.td}>
                    <span style={{ background: `${STATUS_COLORS[c.status as string]}20`, color: STATUS_COLORS[c.status as string], padding: '.2rem .6rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600 }}>
                      {STATUS_LABELS[c.status as string]}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: '#888' }}>
                    {new Date(c.created_at as string).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  topbar: { background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10 },
  topbarTitle: { fontSize: '1.1rem', fontWeight: 700, margin: 0 },
  content: { padding: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', border: '1px solid #e8e8e8' },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' },
  tableHeader: { padding: '1rem 1.5rem', borderBottom: '1px solid #f0f0f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' },
  th: { background: '#fafafa', padding: '.65rem 1rem', textAlign: 'left', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#888' },
  td: { padding: '.7rem 1rem' },
};
