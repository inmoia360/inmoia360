'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/admin/delagala/dailycoffee/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/delagala/dailycoffee/admin');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Error de autenticación');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 360, width: '100%', padding: '2.5rem 2rem', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: '#D4A017', borderRadius: 10, fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '.5rem' }}>D</div>
          <div style={{ fontSize: '1.1rem', letterSpacing: '4px', fontWeight: 800 }}>DELAGALA</div>
          <div style={{ fontSize: '.65rem', color: '#999', letterSpacing: '2px' }}>DAILY COFFEE · ADMIN</div>
        </div>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '.6rem 1rem', color: '#c00', fontSize: '.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.35rem' }}>
            Contraseña de acceso
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            style={{ width: '100%', border: '2px solid #e0e0e0', borderRadius: 8, padding: '.7rem 1rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '.85rem', background: loading ? '#ccc' : '#D4A017', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}
          >
            {loading ? 'Verificando…' : 'ACCEDER'}
          </button>
        </form>
      </div>
    </main>
  );
}
