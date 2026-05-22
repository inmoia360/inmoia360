import { getDb } from '@/lib/db';
import { COFFEE_COST_EUR } from '@/lib/coupon';

export const dynamic = 'force-dynamic';

async function getAnalytics() {
  const sql = getDb();

  const [stats] = await sql`
    SELECT
      COUNT(*)::int                                                         AS total,
      COUNT(*) FILTER (WHERE status = 'generated')::int                    AS generated,
      COUNT(*) FILTER (WHERE status = 'claimed')::int                      AS claimed,
      COUNT(*) FILTER (WHERE status = 'redeemed')::int                     AS redeemed,
      COUNT(*) FILTER (WHERE status = 'expired')::int                      AS expired,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int                    AS cancelled,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last_7_days,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30_days
    FROM marketing_pilot.coffee_coupons
  `;

  const byBar = await sql`
    SELECT b.name, b.city,
           COUNT(c.id)::int AS total,
           COUNT(c.id) FILTER (WHERE c.status = 'redeemed')::int AS redeemed
    FROM marketing_pilot.bars b
    LEFT JOIN marketing_pilot.coffee_coupons c ON c.bar_id = b.id
    GROUP BY b.id, b.name, b.city
    ORDER BY total DESC
  `;

  const recentEvents = await sql`
    SELECT e.event_type, e.metadata, e.created_at, c.coupon_code, c.lead_name
    FROM marketing_pilot.coffee_coupon_events e
    JOIN marketing_pilot.coffee_coupons c ON c.id = e.coupon_id
    ORDER BY e.created_at DESC LIMIT 30
  `;

  const dailyTrend = await sql`
    SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
    FROM marketing_pilot.coffee_coupons
    WHERE created_at >= NOW() - INTERVAL '14 days'
    GROUP BY day ORDER BY day
  `;

  return { stats, byBar, recentEvents, dailyTrend };
}

const EV_LABELS: Record<string, string> = {
  landing_view: '👁️ Vista landing', form_started: '✏️ Formulario iniciado',
  coupon_generated: '🎟️ Cupón generado', coupon_sent: '📤 Cupón enviado',
  coupon_redeemed: '✅ Cupón canjeado', admin_status_changed: '⚙️ Estado cambiado',
};

export default async function AnalyticsPage() {
  const { stats, byBar, recentEvents, dailyTrend } = await getAnalytics();
  const conversion = stats.total > 0 ? ((stats.redeemed / stats.total) * 100).toFixed(1) : '0';
  const cost = (stats.redeemed * COFFEE_COST_EUR).toFixed(2);

  return (
    <div>
      <div style={S.topbar}><h2 style={S.topbarTitle}>Analítica de campaña</h2></div>
      <div style={S.content}>

        {/* KPIs */}
        <div style={S.grid3}>
          {[
            { label: 'Total leads captados', value: stats.total, sub: `${stats.last_7_days} esta semana` },
            { label: 'Cafés canjeados', value: stats.redeemed, sub: `${conversion}% conversión` },
            { label: 'Coste estimado', value: `${cost} €`, sub: `${COFFEE_COST_EUR} €/café` },
            { label: 'Pendientes de canjear', value: stats.generated + stats.claimed, sub: '' },
            { label: 'Expirados', value: stats.expired, sub: '' },
            { label: 'Cancelados', value: stats.cancelled, sub: '' },
          ].map(k => (
            <div key={k.label} style={S.kpiCard}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', margin: '.25rem 0' }}>{k.label}</div>
              {k.sub && <div style={{ fontSize: '.72rem', color: '#D4A017' }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* By bar */}
          <div style={S.tableWrap}>
            <div style={S.tableHeader}><h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: 0 }}>Por bar</h3></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead><tr>
                {['Bar', 'Total', 'Canjeados', 'Conv.'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(byBar as Array<Record<string, unknown>>).map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><strong>{b.name as string}</strong><br /><span style={{ fontSize: '.72rem', color: '#aaa' }}>{b.city as string}</span></td>
                    <td style={S.td}>{b.total as number}</td>
                    <td style={S.td}>{b.redeemed as number}</td>
                    <td style={S.td}>{b.total as number > 0 ? (((b.redeemed as number) / (b.total as number)) * 100).toFixed(0) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daily trend */}
          <div style={S.tableWrap}>
            <div style={S.tableHeader}><h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: 0 }}>Últimos 14 días</h3></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead><tr>{['Fecha', 'Leads'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {(dailyTrend as Array<Record<string, unknown>>).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}>{new Date(d.day as string).toLocaleDateString('es-ES')}</td>
                    <td style={S.td}><strong>{d.count as number}</strong></td>
                  </tr>
                ))}
                {dailyTrend.length === 0 && <tr><td colSpan={2} style={{ padding: '1rem', color: '#aaa', textAlign: 'center' }}>Sin datos aún</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event log */}
        <div style={S.tableWrap}>
          <div style={S.tableHeader}><h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: 0 }}>Log de eventos recientes</h3></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead><tr>{['Evento', 'Lead', 'Cupón', 'Fecha'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {(recentEvents as Array<Record<string, unknown>>).map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={S.td}>{EV_LABELS[e.event_type as string] ?? e.event_type as string}</td>
                  <td style={S.td}>{e.lead_name as string}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '.8rem' }}>{e.coupon_code as string}</td>
                  <td style={{ ...S.td, color: '#888' }}>{new Date(e.created_at as string).toLocaleString('es-ES')}</td>
                </tr>
              ))}
              {recentEvents.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', color: '#aaa', textAlign: 'center' }}>Sin eventos registrados</td></tr>}
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
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  kpiCard: { background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', border: '1px solid #e8e8e8' },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginBottom: '1.5rem' },
  tableHeader: { padding: '1rem 1.5rem', borderBottom: '1px solid #f0f0f0' },
  th: { background: '#fafafa', padding: '.65rem 1rem', textAlign: 'left', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#888' },
  td: { padding: '.7rem 1rem' },
};
