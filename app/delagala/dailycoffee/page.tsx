'use client';

import { useEffect, useState } from 'react';
import type { Bar } from '@/lib/types';

const BRAND = {
  negro: '#1a1a1a',
  dorado: '#D4A017',
  doradoClaro: '#fdf3d7',
};

export default function DailyCoffeeLanding() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [form, setForm] = useState({ lead_name: '', lead_email: '', lead_phone: '', bar_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ coupon_code: string; expires_at: string; already_claimed?: boolean } | null>(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetch('/api/delagala/dailycoffee/config')
      .then(r => r.json())
      .then(d => setBars(d.bars ?? []));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.lead_name.trim()) e.lead_name = 'Nombre obligatorio';
    if (!form.lead_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.lead_email)) e.lead_email = 'Email inválido';
    if (!form.lead_phone.trim()) e.lead_phone = 'Teléfono obligatorio';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setSubmitState('loading');
    setApiError('');
    try {
      const res = await fetch('/api/delagala/dailycoffee/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bar_id: form.bar_id ? parseInt(form.bar_id) : undefined,
          source_url: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? 'Error al procesar'); setSubmitState('error'); return; }
      setResult(data);
      setSubmitState('success');
    } catch {
      setApiError('Error de conexión. Inténtalo de nuevo.');
      setSubmitState('error');
    }
  }

  if (submitState === 'success' && result) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <Logo />
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>☕</div>
            {result.already_claimed
              ? <p style={{ color: '#555', marginTop: '.5rem' }}>Ya tienes un cupón activo</p>
              : <h2 style={{ fontSize: '1.4rem', color: BRAND.negro, margin: '.5rem 0' }}>¡Listo! Tu café te espera</h2>
            }
            <div style={styles.couponBox}>
              <div style={{ fontSize: '.7rem', letterSpacing: '2px', color: '#aaa', textTransform: 'uppercase' }}>
                Código del café
              </div>
              <div style={styles.couponCode}>{result.coupon_code}</div>
              {result.expires_at && (
                <div style={{ fontSize: '.72rem', color: '#aaa', marginTop: '.4rem' }}>
                  Válido hasta {new Date(result.expires_at).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
            <div style={styles.instruccion}>
              <strong>Muestra este código en:</strong><br />
              Calle Las Mercedes 17, Getxo<br />
              <span style={{ fontSize: '.8rem', color: '#666' }}>Café + Delagala Daily incluidos · Sin compromiso</span>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Logo />

        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: BRAND.dorado, lineHeight: 1 }}>
            UN CAFÉ GRATIS
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: BRAND.negro, marginTop: '.25rem' }}>
            de la inmobiliaria
          </div>
          <p style={{ fontSize: '.85rem', color: '#666', marginTop: '.5rem', lineHeight: 1.5 }}>
            Regístrate, recibe tu cupón y pásate a disfrutarlo<br />
            junto al <strong>Delagala Daily</strong> — nuestro boletín del mercado inmobiliario.
          </p>
        </div>

        {(submitState === 'error') && (
          <div style={styles.errorBanner}>{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Nombre y apellidos *"
            error={errors.lead_name}
            input={<input style={styles.input} type="text" placeholder="Tu nombre completo"
              value={form.lead_name} onChange={e => setForm(p => ({ ...p, lead_name: e.target.value }))} autoComplete="name" />}
          />
          <Field
            label="Email *"
            error={errors.lead_email}
            input={<input style={styles.input} type="email" placeholder="tu@email.com"
              value={form.lead_email} onChange={e => setForm(p => ({ ...p, lead_email: e.target.value }))} autoComplete="email" />}
          />
          <Field
            label="Teléfono *"
            error={errors.lead_phone}
            input={<input style={styles.input} type="tel" placeholder="600 000 000"
              value={form.lead_phone} onChange={e => setForm(p => ({ ...p, lead_phone: e.target.value }))} autoComplete="tel" />}
          />
          {bars.length > 1 && (
            <Field
              label="Elige tu bar"
              input={
                <select style={styles.input} value={form.bar_id} onChange={e => setForm(p => ({ ...p, bar_id: e.target.value }))}>
                  <option value="">Asignar automáticamente</option>
                  {bars.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
                </select>
              }
            />
          )}

          <p style={{ fontSize: '.72rem', color: '#888', margin: '.75rem 0', lineHeight: 1.5 }}>
            Al enviar este formulario aceptas que DELAGALA (ICA HOME S.L.) trate tus datos para
            gestionar esta invitación y enviarte información inmobiliaria. Puedes ejercer tus derechos
            en <a href="mailto:info@idelagala.com" style={{ color: BRAND.dorado }}>info@idelagala.com</a>.
          </p>

          <button
            type="submit"
            disabled={submitState === 'loading'}
            style={{
              ...styles.btn,
              background: submitState === 'loading' ? '#ccc' : BRAND.dorado,
              cursor: submitState === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {submitState === 'loading' ? 'Enviando…' : 'QUIERO MI CAFÉ'}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  );
}

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: BRAND.dorado, borderRadius: 12, fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '.5rem' }}>D</div>
      <div style={{ fontSize: '1.2rem', letterSpacing: '5px', fontWeight: 800, color: BRAND.negro }}>DELAGALA</div>
      <div style={{ fontSize: '.6rem', letterSpacing: '2px', color: '#999', textTransform: 'uppercase' }}>Consultoría Inmobiliaria</div>
    </div>
  );
}

function Field({ label, input, error }: { label: string; input: React.ReactNode; error?: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.3rem', color: BRAND.negro }}>
        {label}
      </label>
      {input}
      {error && <div style={{ color: '#c00', fontSize: '.75rem', marginTop: '.25rem' }}>{error}</div>}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.7rem', color: '#888', letterSpacing: '1px' }}>
      <a href="https://idelagala.com" style={{ color: BRAND.dorado }}>idelagala.com</a>
      {' · '}662 128 409{' · '}Getxo, Bizkaia
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: BRAND.negro, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' },
  card: { background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', padding: '2.5rem 2rem', boxShadow: '0 20px 60px rgba(0,0,0,.45)' },
  input: { width: '100%', border: '2px solid #e0e0e0', borderRadius: 8, padding: '.7rem 1rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '.9rem', border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '1px', color: '#fff', transition: 'background .2s' },
  couponBox: { background: BRAND.negro, borderRadius: 12, padding: '1.25rem', margin: '1.25rem 0' },
  couponCode: { fontSize: '2.2rem', fontWeight: 900, letterSpacing: '4px', color: BRAND.dorado, marginTop: '.25rem' },
  instruccion: { background: BRAND.doradoClaro, borderRadius: 8, padding: '1rem', fontSize: '.85rem', lineHeight: 1.6 },
  errorBanner: { background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '.65rem 1rem', color: '#c00', fontSize: '.85rem', marginBottom: '1rem' },
};
