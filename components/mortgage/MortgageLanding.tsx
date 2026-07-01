'use client';

import { useMemo, useState } from 'react';
import {
  BrandConfig,
  computeQuota,
  computeCapacity,
  formatEuro,
} from '@/lib/mortgage';

const SERVICES = [
  {
    icon: '🔍',
    title: 'Estudio de viabilidad',
    text: 'Analizamos tu perfil financiero y te decimos, con datos, hasta dónde puedes llegar y con qué condiciones reales.',
  },
  {
    icon: '🏦',
    title: 'Negociación con la banca',
    text: 'Presentamos tu caso a varias entidades a la vez y negociamos tipo, plazo y vinculaciones para que no lo hagas tú.',
  },
  {
    icon: '📉',
    title: 'Mejora y subrogación',
    text: '¿Ya tienes hipoteca? Estudiamos si puedes bajar la cuota cambiando de banco o renegociando el tipo.',
  },
  {
    icon: '📝',
    title: 'Acompañamiento a firma',
    text: 'Te acompañamos desde la solicitud hasta la firma en notaría, revisando cada cláusula del contrato.',
  },
];

// Datos oficiales reales. Fuentes: INE (Estadística de Hipotecas, abril 2026,
// datos provisionales) y Banco de España (Euríbor, junio 2026).
// Para actualizar: cambia estos valores y la etiqueta DATA_UPDATED.
const DATA_UPDATED = 'Junio 2026';

const INE_HIPOTECAS = 'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736170236&menu=ultiDatos&idp=1254735576757';
const BDE_HIPOTECAS = 'https://clientebancario.bde.es/pcb/es/menu-horizontal/productosservici/financiacion/hipotecas/';
const BDE_SIMULADORES = 'https://clientebancario.bde.es/pcb/es/menu-horizontal/podemosayudarte/simuladores/';

type Stat = {
  key: string; label: string; value: string; delta?: string; deltaUp?: boolean;
  source: string; href: string;
} & (
  | { kind: 'rate'; rate: number }
  | { kind: 'bars'; prev: number; curr: number; prevLabel: string; currLabel: string }
);

const STATS: Stat[] = [
  { key: 'euribor', label: 'Euríbor a 12 meses', value: '2,80%', delta: 'Media junio 2026',
    kind: 'rate', rate: 2.8, source: 'Banco de España', href: BDE_HIPOTECAS },
  { key: 'tipo', label: 'Tipo medio nuevas hipotecas', value: '2,90%', delta: 'Abril 2026',
    kind: 'rate', rate: 2.9, source: 'INE', href: INE_HIPOTECAS },
  { key: 'num', label: 'Hipotecas sobre vivienda', value: '40.010', delta: '+2,3% interanual', deltaUp: true,
    kind: 'bars', prev: 39110, curr: 40010, prevLabel: 'Abr 25', currLabel: 'Abr 26', source: 'INE · Abril 2026', href: INE_HIPOTECAS },
  { key: 'importe', label: 'Importe medio', value: '173.331 €', delta: '+11,1% interanual', deltaUp: true,
    kind: 'bars', prev: 156013, curr: 173331, prevLabel: 'Abr 25', currLabel: 'Abr 26', source: 'INE · Abril 2026', href: INE_HIPOTECAS },
];

const SOURCES = [
  { tag: 'Banco de España', title: 'Guía oficial de hipotecas', cta: 'Ver la guía del BdE', href: BDE_HIPOTECAS,
    text: 'Todo lo que conviene saber antes de firmar, explicado por el propio Banco de España.',
    points: ['Qué es la TAE y cómo comparar ofertas', 'Gastos que paga el banco por ley', 'Tus derechos con la Ley 5/2019 (LCCI)'] },
  { tag: 'INE', title: 'Estadística de Hipotecas', cta: 'Ver los datos del INE', href: INE_HIPOTECAS,
    text: 'Las cifras oficiales del mercado hipotecario español, actualizadas cada mes por el Instituto Nacional de Estadística.',
    points: ['Nº de hipotecas firmadas cada mes', 'Importe medio y tipos de interés', 'Evolución interanual del mercado'] },
  { tag: 'Banco de España', title: 'Simuladores oficiales', cta: 'Abrir los simuladores', href: BDE_SIMULADORES,
    text: 'Contrasta tu estudio con las herramientas oficiales del Banco de España.',
    points: ['Simulador de cuota mensual', 'Cálculo de la TAE y del coste real', 'Comparador de préstamos hipotecarios'] },
];

const STEPS = [
  { n: '01', title: 'Cuéntanos tu caso', text: 'Rellenas el formulario en un minuto. Sin coste y sin compromiso.' },
  { n: '02', title: 'Estudiamos y negociamos', text: 'Analizamos tu perfil y ponemos a la banca a competir por ti.' },
  { n: '03', title: 'Eliges y firmamos', text: 'Te presentamos las mejores ofertas y te acompañamos hasta la firma.' },
];

type CalcMode = 'cuota' | 'capacidad';
type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function MortgageLanding({ brand }: { brand: BrandConfig }) {
  const c = brand.colors;

  // ── Calculadora ──
  const [mode, setMode] = useState<CalcMode>('cuota');
  // Cuota
  const [amount, setAmount] = useState(180000);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(3.1);
  // Capacidad
  const [netIncome, setNetIncome] = useState(2500);
  const [otherDebts, setOtherDebts] = useState(0);

  const quota = useMemo(() => computeQuota({ amount, years, rate }), [amount, years, rate]);
  const capacity = useMemo(
    () => computeCapacity({ netIncome, otherDebts, years, rate }),
    [netIncome, otherDebts, years, rate],
  );

  // ── Formulario ──
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailLead, setEmailLead] = useState('');
  const [service, setService] = useState('Estudio de viabilidad');
  const [mensaje, setMensaje] = useState('');
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setErrorMsg('Indícanos tu nombre y tu teléfono.');
      setState('error');
      return;
    }
    if (!consentPrivacy) {
      setErrorMsg('Necesitamos que aceptes la política de privacidad para contactarte.');
      setState('error');
      return;
    }
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/hipotecas/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.key,
          service,
          lead_name: nombre.trim(),
          lead_phone: telefono.trim(),
          lead_email: emailLead.trim() || null,
          message: mensaje.trim() || null,
          source_url: typeof window !== 'undefined' ? window.location.href : null,
          consent_privacy: consentPrivacy,
          consent_marketing: consentMarketing,
          calc:
            mode === 'cuota'
              ? { mode, amount, years, rate, monthly: Math.round(quota.monthly) }
              : { mode, netIncome, otherDebts, years, rate, maxLoan: Math.round(capacity.maxLoan) },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error ?? 'No hemos podido enviar tu solicitud. Inténtalo de nuevo.');
        setState('error');
        return;
      }
      setState('success');
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setState('error');
    }
  }

  // Descarga la página como un .html autónomo: pasa las rutas de imágenes y
  // hojas de estilo a absolutas (para que se vea bien donde lo suban) y quita
  // los scripts y los botones flotantes para dejar un archivo estático limpio.
  function downloadHtml() {
    if (typeof document === 'undefined') return;
    const origin = window.location.origin;
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('img[src^="/"]').forEach(el => el.setAttribute('src', origin + el.getAttribute('src')!));
    clone.querySelectorAll('link[href^="/"]').forEach(el => el.setAttribute('href', origin + el.getAttribute('href')!));
    clone.querySelectorAll('script, .mtg-fab, .mtg-print-btn').forEach(el => el.remove());
    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.name.replace(/\s+/g, '-')}-hipotecas.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const rootStyle = {
    '--ink': c.ink,
    '--ink-soft': c.inkSoft,
    '--ink-mute': c.inkMute,
    '--bg': c.bg,
    '--bg-soft': c.bgSoft,
    '--accent': c.accent,
    '--accent-deep': c.accentDeep,
    '--accent-soft': c.accentSoft,
    '--font-display': brand.fonts.display,
    '--font-body': brand.fonts.body,
  } as React.CSSProperties;

  return (
    <div className="mtg" style={rootStyle}>
      <style>{`
        @import url('${brand.fonts.googleHref}');
        .mtg *{box-sizing:border-box;margin:0;padding:0;}
        .mtg{background:var(--bg);color:var(--ink);font-family:var(--font-body);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased;}
        .mtg .wrap{max-width:1140px;margin:0 auto;padding:0 24px;}
        .mtg h1,.mtg h2,.mtg h3,.mtg h4{font-family:var(--font-display);letter-spacing:-.02em;line-height:1.05;}
        .mtg a{color:inherit;}

        /* NAV */
        .mtg-nav{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent);}
        .mtg-nav .wrap{display:flex;align-items:center;justify-content:space-between;height:64px;}
        .mtg-logo{display:flex;align-items:center;gap:10px;font-weight:800;}
        .mtg-logo .mark{width:34px;height:34px;border-radius:9px;background:var(--accent);color:var(--ink);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:18px;}
        .mtg-logo .nm{font-family:var(--font-display);font-weight:800;font-size:18px;letter-spacing:.02em;}
        .mtg-logo .kk{display:block;font-family:var(--font-body);font-weight:500;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mute);}
        .mtg-logo-img{height:30px;width:auto;display:block;}
        .mtg-logo .kk-side{padding-left:12px;margin-left:4px;border-left:1px solid color-mix(in srgb,var(--ink) 18%,transparent);}
        .mtg-nav a.cta{background:var(--ink);color:var(--bg);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;}

        /* HERO */
        .mtg-hero{padding:72px 0 40px;position:relative;overflow:hidden;}
        .mtg-hero::before{content:"";position:absolute;top:-160px;right:-120px;width:460px;height:460px;background:radial-gradient(circle,var(--accent-soft),transparent 70%);z-index:0;}
        .mtg-hero .wrap{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;}
        .mtg-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--accent-soft);color:var(--accent-deep);font-weight:700;font-size:12px;letter-spacing:.04em;padding:7px 14px;border-radius:999px;margin-bottom:22px;}
        .mtg-eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent-deep);}
        .mtg-hero h1{font-size:clamp(38px,5.4vw,60px);font-weight:800;}
        .mtg-hero h1 em{font-style:normal;color:var(--accent-deep);display:block;}
        .mtg-hero .lede{margin-top:20px;font-size:18px;color:var(--ink-soft);max-width:48ch;}
        .mtg-hero-cta{margin-top:30px;display:flex;gap:14px;flex-wrap:wrap;}
        .mtg-btn{display:inline-flex;align-items:center;gap:9px;padding:15px 26px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;border:none;transition:transform .15s ease,box-shadow .15s ease,background .15s;}
        .mtg-btn-primary{background:var(--accent);color:var(--ink);box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 45%,transparent);}
        .mtg-btn-primary:hover{transform:translateY(-2px);}
        .mtg-btn-ghost{background:transparent;color:var(--ink);border:1.5px solid color-mix(in srgb,var(--ink) 18%,transparent);}
        .mtg-btn-ghost:hover{background:var(--ink);color:var(--bg);}
        .mtg-trust{margin-top:28px;display:flex;gap:24px;flex-wrap:wrap;font-size:13px;color:var(--ink-mute);}
        .mtg-trust b{color:var(--ink);}

        /* CALC CARD */
        .mtg-calc{background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);border-radius:20px;box-shadow:0 24px 60px -24px color-mix(in srgb,var(--ink) 40%,transparent);overflow:hidden;}
        .mtg-calc-tabs{display:flex;background:var(--bg-soft);}
        .mtg-calc-tabs button{flex:1;padding:16px 12px;border:none;background:transparent;cursor:pointer;font-family:var(--font-body);font-weight:700;font-size:14px;color:var(--ink-mute);border-bottom:2px solid transparent;transition:color .15s,border-color .15s,background .15s;}
        .mtg-calc-tabs button.on{color:var(--ink);background:var(--bg);border-bottom-color:var(--accent);}
        .mtg-calc-body{padding:26px 24px 28px;}
        .mtg-field{margin-bottom:20px;}
        .mtg-field .row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;}
        .mtg-field label{font-weight:600;font-size:13px;color:var(--ink-soft);}
        .mtg-field .val{font-family:var(--font-display);font-weight:800;font-size:16px;color:var(--ink);}
        .mtg-field input[type=range]{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;background:var(--accent-soft);outline:none;}
        .mtg-field input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--accent);border:3px solid var(--bg);box-shadow:0 2px 6px color-mix(in srgb,var(--ink) 35%,transparent);cursor:pointer;}
        .mtg-field input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--accent);border:3px solid var(--bg);cursor:pointer;}
        .mtg-num{display:flex;flex-direction:column;gap:6px;}
        .mtg-num input{padding:12px 14px;border:1.5px solid color-mix(in srgb,var(--ink) 15%,transparent);border-radius:10px;font-size:16px;font-family:var(--font-body);background:var(--bg-soft);outline:none;color:var(--ink);}
        .mtg-num input:focus{border-color:var(--accent-deep);background:var(--bg);box-shadow:0 0 0 3px var(--accent-soft);}
        .mtg-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .mtg-result{margin-top:6px;background:var(--ink);color:var(--bg);border-radius:14px;padding:22px 20px;text-align:center;}
        .mtg-result .lbl{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--bg) 60%,transparent);}
        .mtg-result .big{font-family:var(--font-display);font-weight:800;font-size:clamp(34px,6vw,46px);color:var(--accent);margin:6px 0 2px;}
        .mtg-result .sub{font-size:13px;color:color-mix(in srgb,var(--bg) 72%,transparent);}
        .mtg-result-grid{display:flex;gap:0;margin-top:16px;border-top:1px solid color-mix(in srgb,var(--bg) 20%,transparent);padding-top:14px;}
        .mtg-result-grid div{flex:1;}
        .mtg-result-grid .n{font-family:var(--font-display);font-weight:700;font-size:17px;}
        .mtg-result-grid .k{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb,var(--bg) 55%,transparent);margin-top:2px;}
        .mtg-disclaimer{margin-top:14px;font-size:11px;color:var(--ink-mute);text-align:center;line-height:1.5;}

        /* SECTION SHELL */
        .mtg-sec{padding:80px 0;}
        .mtg-sec.alt{background:var(--bg-soft);}
        .mtg-head{text-align:center;max-width:640px;margin:0 auto 48px;}
        .mtg-head .kick{font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-deep);}
        .mtg-head h2{font-size:clamp(30px,4.4vw,44px);font-weight:800;margin-top:12px;}
        .mtg-head p{margin-top:14px;font-size:17px;color:var(--ink-soft);}

        /* SERVICES */
        .mtg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
        .mtg-card{background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 10%,transparent);border-radius:16px;padding:28px 26px;transition:transform .15s,box-shadow .15s;}
        .mtg-card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -20px color-mix(in srgb,var(--ink) 40%,transparent);}
        .mtg-card .ic{width:48px;height:48px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;}
        .mtg-card h4{font-size:20px;font-weight:800;margin-bottom:8px;}
        .mtg-card p{font-size:15px;color:var(--ink-soft);}

        /* STEPS */
        .mtg-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .mtg-step{position:relative;padding:28px 24px;background:var(--bg);border-radius:16px;border:1px solid color-mix(in srgb,var(--ink) 10%,transparent);}
        .mtg-step .n{font-family:var(--font-display);font-weight:800;font-size:44px;color:var(--accent);line-height:1;}
        .mtg-step h4{font-size:19px;font-weight:800;margin:10px 0 8px;}
        .mtg-step p{font-size:15px;color:var(--ink-soft);}

        /* MARKET */
        .mtg-news{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .mtg-news article{background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 10%,transparent);border-radius:16px;padding:26px 24px;}
        .mtg-news .tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-deep);background:var(--accent-soft);padding:4px 10px;border-radius:999px;margin-bottom:14px;}
        .mtg-news h4{font-size:19px;font-weight:800;margin-bottom:8px;}
        .mtg-news p{font-size:14px;color:var(--ink-soft);}

        /* ACTUALIDAD · DATOS OFICIALES */
        .mtg-updated{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:700;color:var(--accent-deep);background:var(--accent-soft);padding:6px 15px;border-radius:999px;}
        .mtg-updated::before{content:"";width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px color-mix(in srgb,#22C55E 25%,transparent);}
        .mtg-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 22px;}
        .mtg-stat{display:block;text-decoration:none;color:inherit;background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 11%,transparent);border-radius:16px;padding:20px 20px 14px;transition:transform .15s,box-shadow .15s,border-color .15s;}
        .mtg-stat:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px color-mix(in srgb,var(--ink) 45%,transparent);border-color:var(--accent);}
        .mtg-stat-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .mtg-stat-value{font-family:var(--font-display);font-weight:800;font-size:26px;color:var(--ink);letter-spacing:-.02em;}
        .mtg-stat-delta{font-size:11px;font-weight:700;color:var(--ink-mute);white-space:nowrap;}
        .mtg-stat-delta.up{color:#15803D;background:#DCFCE7;padding:2px 7px;border-radius:6px;}
        .mtg-stat-label{font-size:13px;color:var(--ink-soft);margin-top:4px;font-weight:600;}
        .mtg-stat-chart{margin:12px 0 8px;}
        .mtg-stat-src{font-size:11px;color:var(--ink-mute);display:flex;align-items:center;justify-content:space-between;border-top:1px solid color-mix(in srgb,var(--ink) 8%,transparent);padding-top:10px;}
        .mtg-stat-link{color:var(--accent-deep);font-weight:700;}
        .mtg-sources{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .mtg-src-card{display:flex;flex-direction:column;background:var(--bg-soft);border:1px solid color-mix(in srgb,var(--ink) 8%,transparent);border-radius:16px;padding:24px 22px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s;}
        .mtg-src-card:hover{transform:translateY(-3px);box-shadow:0 16px 36px -20px color-mix(in srgb,var(--ink) 40%,transparent);}
        .mtg-src-card .tag{align-self:flex-start;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-deep);background:var(--accent-soft);padding:4px 10px;border-radius:999px;margin-bottom:14px;}
        .mtg-src-card h4{font-size:18px;font-weight:800;margin-bottom:8px;}
        .mtg-src-card p{font-size:14px;color:var(--ink-soft);flex:1;}
        .mtg-src-card .go{margin-top:16px;font-weight:700;font-size:13px;color:var(--accent-deep);display:inline-flex;align-items:center;gap:7px;}
        .mtg-src-list{list-style:none;margin:14px 0 4px;padding:0;flex:1;}
        .mtg-src-list li{position:relative;padding:6px 0 6px 22px;font-size:13.5px;color:var(--ink-soft);border-top:1px solid color-mix(in srgb,var(--ink) 7%,transparent);}
        .mtg-src-list li:first-child{border-top:none;}
        .mtg-src-list li::before{content:"";position:absolute;left:2px;top:12px;width:8px;height:8px;border-radius:50%;background:var(--accent);}
        .mtg-sources-head{font-weight:800;font-size:13px;letter-spacing:.02em;color:var(--ink);margin:8px 0 16px;display:flex;align-items:center;gap:10px;}
        .mtg-sources-head::after{content:"";flex:1;height:1px;background:color-mix(in srgb,var(--ink) 12%,transparent);}
        .mtg-disclaim{margin-top:20px;font-size:11px;color:var(--ink-mute);text-align:center;line-height:1.6;}

        /* CONTACT */
        .mtg-contact{background:var(--ink);color:var(--bg);}
        .mtg-contact .wrap{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;}
        .mtg-contact h2{font-size:clamp(30px,4.4vw,46px);font-weight:800;}
        .mtg-contact h2 em{font-style:normal;color:var(--accent);}
        .mtg-contact .lede{margin-top:18px;font-size:17px;color:color-mix(in srgb,var(--bg) 78%,transparent);max-width:44ch;}
        .mtg-ul{list-style:none;margin-top:28px;}
        .mtg-ul li{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid color-mix(in srgb,var(--bg) 15%,transparent);font-size:15px;}
        .mtg-ul li:last-child{border-bottom:1px solid color-mix(in srgb,var(--bg) 15%,transparent);}
        .mtg-ul .ck{flex-shrink:0;width:22px;height:22px;border-radius:6px;background:var(--accent);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;}
        .mtg-form{background:var(--bg);color:var(--ink);border-radius:18px;padding:30px 28px;}
        .mtg-form h3{font-size:22px;font-weight:800;margin-bottom:6px;}
        .mtg-form .fp{font-size:14px;color:var(--ink-mute);margin-bottom:20px;}
        .mtg-form label.fl{display:block;font-weight:600;font-size:13px;margin-bottom:6px;color:var(--ink-soft);}
        .mtg-form input[type=text],.mtg-form input[type=tel],.mtg-form input[type=email],.mtg-form select,.mtg-form textarea{width:100%;padding:13px 14px;border:1.5px solid color-mix(in srgb,var(--ink) 15%,transparent);border-radius:10px;font-size:16px;font-family:var(--font-body);background:var(--bg-soft);color:var(--ink);outline:none;margin-bottom:16px;}
        .mtg-form input:focus,.mtg-form select:focus,.mtg-form textarea:focus{border-color:var(--accent-deep);background:var(--bg);box-shadow:0 0 0 3px var(--accent-soft);}
        .mtg-form textarea{min-height:84px;resize:vertical;}
        .mtg-check{display:flex;gap:10px;align-items:flex-start;margin-bottom:14px;cursor:pointer;}
        .mtg-check input{flex-shrink:0;width:18px;height:18px;margin-top:2px;accent-color:var(--accent-deep);}
        .mtg-check span{font-size:12px;line-height:1.5;color:var(--ink-soft);}
        .mtg-check a{color:var(--accent-deep);text-decoration:underline;}
        .mtg-submit{width:100%;padding:16px;border:none;border-radius:12px;background:var(--accent);color:var(--ink);font-family:var(--font-body);font-weight:800;font-size:16px;cursor:pointer;transition:transform .12s;margin-top:6px;}
        .mtg-submit:active:not(:disabled){transform:scale(.98);}
        .mtg-submit:disabled{opacity:.6;cursor:not-allowed;}
        .mtg-err{background:#FEF2F2;border:1.5px solid #FCA5A5;color:#B91C1C;padding:12px 14px;border-radius:10px;font-size:14px;margin-bottom:16px;}
        .mtg-ok{text-align:center;padding:14px 0;}
        .mtg-ok .em{font-size:52px;}
        .mtg-ok h3{font-size:26px;font-weight:800;margin:10px 0;}
        .mtg-ok p{color:var(--ink-soft);font-size:15px;}
        .mtg-legal{font-size:11px;color:var(--ink-mute);line-height:1.6;margin-top:14px;}

        /* FOOTER */
        .mtg-foot{padding:44px 0;border-top:1px solid color-mix(in srgb,var(--ink) 12%,transparent);}
        .mtg-foot .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;}
        .mtg-foot .b{font-family:var(--font-display);font-weight:800;font-size:20px;}
        .mtg-foot .lg{font-size:12px;color:var(--ink-mute);text-align:right;line-height:1.7;}
        .mtg-foot .lg a{color:var(--accent-deep);text-decoration:none;}
        .mtg-print-btn{margin-top:12px;display:inline-flex;align-items:center;gap:8px;background:transparent;border:1.5px solid color-mix(in srgb,var(--ink) 20%,transparent);color:var(--ink-soft);border-radius:10px;padding:10px 18px;font-family:var(--font-body);font-weight:600;font-size:13px;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
        .mtg-print-btn:hover{background:var(--ink);color:var(--bg);border-color:var(--ink);}
        .mtg-fab{position:fixed;bottom:22px;right:22px;z-index:60;display:inline-flex;align-items:center;gap:9px;background:var(--ink);color:var(--bg);border:none;border-radius:999px;padding:13px 20px;font-family:var(--font-body);font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 12px 30px -8px color-mix(in srgb,var(--ink) 60%,transparent);transition:transform .15s,background .15s;}
        .mtg-fab:hover{transform:translateY(-2px);background:var(--accent-deep);color:#fff;}
        .mtg-fab svg{width:17px;height:17px;flex-shrink:0;}

        /* RESPONSIVE */
        @media(max-width:900px){
          .mtg-hero .wrap,.mtg-contact .wrap{grid-template-columns:1fr;gap:36px;}
          .mtg-news,.mtg-steps{grid-template-columns:1fr;}
          .mtg-grid{grid-template-columns:1fr;}
          .mtg-stats{grid-template-columns:repeat(2,1fr);}
          .mtg-sources{grid-template-columns:1fr;}
        }
        @media(max-width:560px){
          .mtg .wrap{padding:0 16px;}
          .mtg-hero{padding:44px 0 28px;}
          .mtg-sec{padding:52px 0;}
          .mtg-two{grid-template-columns:1fr;}
          .mtg-nav a.cta{display:none;}
          .mtg-logo .kk-side{display:none;}
          .mtg-logo-img{height:26px;}
          .mtg-stats{grid-template-columns:1fr;}
          .mtg-fab{padding:13px;bottom:16px;right:16px;}
          .mtg-fab .lbl{display:none;}
        }

        /* ── IMPRESIÓN / PDF ── */
        @media print{
          @page{size:A4;margin:14mm;}
          .mtg{font-size:12px;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .mtg *{box-shadow:none !important;text-shadow:none !important;}
          .mtg .wrap{max-width:none;padding:0;}
          /* Nav estático, sin CTA ni blur */
          .mtg-nav{position:static;background:#fff;backdrop-filter:none;border-bottom:1.5px solid var(--accent);}
          .mtg-nav .wrap{height:auto;padding:8px 0;}
          .mtg-nav a.cta{display:none !important;}
          /* Hero: solo el mensaje, sin calculadora ni fondo decorativo */
          .mtg-hero{padding:14px 0 6px;}
          .mtg-hero::before{display:none;}
          .mtg-hero .wrap{display:block;}
          .mtg-hero h1{font-size:26px;}
          .mtg-hero .lede{font-size:13px;max-width:none;margin-top:8px;}
          .mtg-hero-cta,.mtg-trust,.mtg-calc{display:none !important;}
          /* Secciones compactas y en blanco */
          .mtg-sec{padding:16px 0 !important;background:#fff !important;break-inside:avoid-page;}
          .mtg-head{margin:0 auto 14px;max-width:none;}
          .mtg-head h2{font-size:19px;}
          .mtg-head p{font-size:12px;}
          .mtg-updated{border:1px solid var(--accent-deep);}
          /* Rejillas ajustadas al A4 */
          .mtg-stats{grid-template-columns:repeat(2,1fr);gap:10px;}
          .mtg-stat-value{font-size:19px;}
          .mtg-grid,.mtg-steps{grid-template-columns:1fr 1fr;gap:10px;}
          .mtg-sources{grid-template-columns:1fr;gap:10px;}
          /* Nada se parte por la mitad */
          .mtg-card,.mtg-step,.mtg-stat,.mtg-src-card,.mtg-result{break-inside:avoid;}
          .mtg-stat,.mtg-src-card{border:1px solid #ccc;background:#fff;}
          /* Enlaces oficiales: imprime la URL para poder verificarla */
          .mtg-src-card::after{content:attr(href);display:block;margin-top:8px;font-size:9px;color:#555;word-break:break-all;}
          .mtg-src-card .go svg{display:none;}
          /* Contacto: fondo claro y formulario como ficha rellenable a mano */
          .mtg-contact{background:#fff !important;color:#111 !important;}
          .mtg-contact h2,.mtg-contact h2 em{color:#111 !important;}
          .mtg-contact .lede,.mtg-ul li{color:#333 !important;}
          .mtg-contact .wrap{display:block;}
          .mtg-form{border:1px solid #ccc;padding:16px;margin-top:14px;}
          .mtg-form input,.mtg-form select,.mtg-form textarea{background:#fff !important;border:1px solid #999 !important;}
          .mtg-submit,.mtg-check,.mtg-print-btn,.mtg-fab{display:none !important;}
          .mtg-foot{padding:14px 0;}
        }
      `}</style>

      {/* NAV */}
      <nav className="mtg-nav">
        <div className="wrap">
          <div className="mtg-logo">
            {brand.logoSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logoSrc} alt={`${brand.name} Consultoría Inmobiliaria`} className="mtg-logo-img" />
                <span className="kk kk-side">{brand.kicker}</span>
              </>
            ) : (
              <>
                <span className="mark">{brand.name.charAt(0)}</span>
                <span>
                  <span className="nm">{brand.name}</span>
                  <span className="kk">{brand.kicker}</span>
                </span>
              </>
            )}
          </div>
          <a href="#contacto" className="cta">Solicitar estudio gratis</a>
        </div>
      </nav>

      {/* Botón flotante — descargar la página como HTML autónomo */}
      <button type="button" className="mtg-fab" onClick={downloadHtml} aria-label="Descargar la página en HTML">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        <span className="lbl">Descargar HTML</span>
      </button>

      {/* HERO + CALCULADORA */}
      <header className="mtg-hero">
        <div className="wrap">
          <div>
            <span className="mtg-eyebrow">Intermediación hipotecaria · Ley 5/2019</span>
            <h1>
              {brand.heroTitle}
              <em>{brand.heroTitleEm}</em>
            </h1>
            <p className="lede">{brand.heroLede}</p>
            <div className="mtg-hero-cta">
              <a href="#contacto" className="mtg-btn mtg-btn-primary">
                Solicitar estudio gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </a>
              <a href="#calculadora" className="mtg-btn mtg-btn-ghost">Calcular mi cuota</a>
            </div>
            <div className="mtg-trust">
              <span><b>Sin coste</b> inicial</span>
              <span><b>+20</b> entidades</span>
              <span><b>0€</b> si no mejoramos tu oferta</span>
            </div>
          </div>

          {/* CALCULADORA */}
          <div className="mtg-calc" id="calculadora">
            <div className="mtg-calc-tabs">
              <button className={mode === 'cuota' ? 'on' : ''} onClick={() => setMode('cuota')}>Calcular cuota</button>
              <button className={mode === 'capacidad' ? 'on' : ''} onClick={() => setMode('capacidad')}>¿Cuánto puedo pedir?</button>
            </div>
            <div className="mtg-calc-body">
              {mode === 'cuota' ? (
                <>
                  <div className="mtg-field">
                    <div className="row"><label>Importe de la hipoteca</label><span className="val">{formatEuro(amount)}</span></div>
                    <input type="range" min={30000} max={600000} step={5000} value={amount} onChange={e => setAmount(+e.target.value)} />
                  </div>
                  <div className="mtg-two">
                    <div className="mtg-field">
                      <div className="row"><label>Plazo</label><span className="val">{years} años</span></div>
                      <input type="range" min={5} max={40} step={1} value={years} onChange={e => setYears(+e.target.value)} />
                    </div>
                    <div className="mtg-field">
                      <div className="row"><label>Interés (TIN)</label><span className="val">{rate.toFixed(2)}%</span></div>
                      <input type="range" min={1} max={6} step={0.05} value={rate} onChange={e => setRate(+e.target.value)} />
                    </div>
                  </div>
                  <div className="mtg-result">
                    <div className="lbl">Cuota mensual estimada</div>
                    <div className="big">{formatEuro(quota.monthly)}</div>
                    <div className="sub">durante {years} años</div>
                    <div className="mtg-result-grid">
                      <div><div className="n">{formatEuro(quota.totalInterest)}</div><div className="k">Intereses</div></div>
                      <div><div className="n">{formatEuro(quota.totalPaid)}</div><div className="k">Total a pagar</div></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mtg-two">
                    <div className="mtg-field mtg-num">
                      <label>Ingresos netos del hogar (mes)</label>
                      <input type="number" min={0} step={100} value={netIncome} onChange={e => setNetIncome(+e.target.value)} />
                    </div>
                    <div className="mtg-field mtg-num">
                      <label>Otras cuotas mensuales</label>
                      <input type="number" min={0} step={50} value={otherDebts} onChange={e => setOtherDebts(+e.target.value)} />
                    </div>
                  </div>
                  <div className="mtg-two">
                    <div className="mtg-field">
                      <div className="row"><label>Plazo</label><span className="val">{years} años</span></div>
                      <input type="range" min={5} max={40} step={1} value={years} onChange={e => setYears(+e.target.value)} />
                    </div>
                    <div className="mtg-field">
                      <div className="row"><label>Interés (TIN)</label><span className="val">{rate.toFixed(2)}%</span></div>
                      <input type="range" min={1} max={6} step={0.05} value={rate} onChange={e => setRate(+e.target.value)} />
                    </div>
                  </div>
                  <div className="mtg-result">
                    <div className="lbl">Capital máximo estimado</div>
                    <div className="big">{formatEuro(capacity.maxLoan)}</div>
                    <div className="sub">con una cuota de hasta {formatEuro(capacity.maxMonthly)}/mes</div>
                    <div className="mtg-result-grid">
                      <div><div className="n">35%</div><div className="k">Endeudamiento máx.</div></div>
                      <div><div className="n">{formatEuro(capacity.maxMonthly)}</div><div className="k">Cuota asumible</div></div>
                    </div>
                  </div>
                </>
              )}
              <p className="mtg-disclaimer">Cálculo orientativo. La oferta real depende de tu perfil y de la entidad. Pídenos un estudio personalizado sin coste.</p>
            </div>
          </div>
        </div>
      </header>

      {/* ACTUALIDAD · DATOS OFICIALES — arriba, para dar credibilidad desde el inicio */}
      <section className="mtg-sec alt">
        <div className="wrap">
          <div className="mtg-head">
            <span className="mtg-updated">Datos oficiales · Actualizado {DATA_UPDATED}</span>
            <h2>Asesoramiento con datos que puedes verificar</h2>
            <p>No te contamos cuentos: trabajamos con las cifras oficiales del <strong>INE</strong> y el <strong>Banco de España</strong>. Pincha cualquier dato o recurso y vas directo a la fuente.</p>
          </div>

          <div className="mtg-stats">
            {STATS.map(s => (
              <a className="mtg-stat" key={s.key} href={s.href} target="_blank" rel="noopener noreferrer">
                <div className="mtg-stat-top">
                  <span className="mtg-stat-value">{s.value}</span>
                  {s.delta && <span className={`mtg-stat-delta${s.deltaUp ? ' up' : ''}`}>{s.delta}</span>}
                </div>
                <div className="mtg-stat-label">{s.label}</div>
                <div className="mtg-stat-chart">
                  {s.kind === 'bars'
                    ? <TwoBars prev={s.prev} curr={s.curr} prevLabel={s.prevLabel} currLabel={s.currLabel} />
                    : <RateMeter rate={s.rate} />}
                </div>
                <div className="mtg-stat-src"><span>Fuente: {s.source}</span><span className="mtg-stat-link">Ver ↗</span></div>
              </a>
            ))}
          </div>

          <div className="mtg-sources-head">Consulta las fuentes oficiales</div>
          <div className="mtg-sources">
            {SOURCES.map(s => (
              <a className="mtg-src-card" key={s.title} href={s.href} target="_blank" rel="noopener noreferrer">
                <span className="tag">{s.tag}</span>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
                <ul className="mtg-src-list">
                  {s.points.map(p => <li key={p}>{p}</li>)}
                </ul>
                <span className="go">{s.cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H8M17 7v9" /></svg>
                </span>
              </a>
            ))}
          </div>

          <p className="mtg-disclaim">Fuentes: Instituto Nacional de Estadística (Estadística de Hipotecas, abril 2026, datos provisionales) y Banco de España (Euríbor, junio 2026). Información con fines orientativos.</p>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="mtg-sec">
        <div className="wrap">
          <div className="mtg-head">
            <span className="kick">Qué hacemos por ti</span>
            <h2>Un servicio completo, de principio a firma</h2>
            <p>No vendemos hipotecas: te representamos a ti frente a la banca para conseguir las mejores condiciones.</p>
          </div>
          <div className="mtg-grid">
            {SERVICES.map(s => (
              <div className="mtg-card" key={s.title}>
                <div className="ic">{s.icon}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="mtg-sec alt">
        <div className="wrap">
          <div className="mtg-head">
            <span className="kick">Cómo funciona</span>
            <h2>Tres pasos y sin complicaciones</h2>
          </div>
          <div className="mtg-steps">
            {STEPS.map(s => (
              <div className="mtg-step" key={s.n}>
                <div className="n">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="mtg-sec mtg-contact" id="contacto">
        <div className="wrap">
          <div>
            <h2>Pide tu <em>estudio gratuito</em> y sin compromiso</h2>
            <p className="lede">Cuéntanos tu caso y en menos de 24h te decimos, con datos, qué podemos conseguir para ti.</p>
            <ul className="mtg-ul">
              <li><span className="ck">✓</span><span>Estudio de viabilidad <b>sin coste</b> y sin compromiso.</span></li>
              <li><span className="ck">✓</span><span>Negociamos con más de <b>20 entidades</b> a la vez.</span></li>
              <li><span className="ck">✓</span><span>Un experto te acompaña <b>hasta la firma en notaría</b>.</span></li>
              <li><span className="ck">✓</span><span>Servicio conforme a la <b>Ley 5/2019 (LCCI)</b>.</span></li>
            </ul>
          </div>

          <div className="mtg-form">
            {state === 'success' ? (
              <div className="mtg-ok">
                <div className="em">✅</div>
                <h3>¡Solicitud recibida!</h3>
                <p>Gracias, {nombre.split(' ')[0] || ''}. Un asesor de {brand.name} te contactará en menos de 24h para tu estudio gratuito.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h3>Solicita tu estudio gratis</h3>
                <p className="fp">Respuesta en menos de 24h. Sin coste ni compromiso.</p>

                {state === 'error' && <div className="mtg-err">{errorMsg}</div>}

                <label className="fl" htmlFor="mtg-nombre">Nombre y apellidos</label>
                <input id="mtg-nombre" type="text" placeholder="Nombre completo" autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} required />

                <div className="mtg-two">
                  <div>
                    <label className="fl" htmlFor="mtg-tel">Teléfono</label>
                    <input id="mtg-tel" type="tel" placeholder="600 000 000" autoComplete="tel" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required />
                  </div>
                  <div>
                    <label className="fl" htmlFor="mtg-email">Email <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(opcional)</span></label>
                    <input id="mtg-email" type="email" placeholder="tu@email.com" autoComplete="email" value={emailLead} onChange={e => setEmailLead(e.target.value)} />
                  </div>
                </div>

                <label className="fl" htmlFor="mtg-serv">¿Qué necesitas?</label>
                <select id="mtg-serv" value={service} onChange={e => setService(e.target.value)}>
                  <option>Estudio de viabilidad</option>
                  <option>Comprar vivienda con hipoteca</option>
                  <option>Mejorar / subrogar mi hipoteca actual</option>
                  <option>Solo quiero información</option>
                </select>

                <label className="fl" htmlFor="mtg-msg">Cuéntanos tu caso <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(opcional)</span></label>
                <textarea id="mtg-msg" placeholder="Importe aproximado, situación laboral, plazo deseado..." value={mensaje} onChange={e => setMensaje(e.target.value)} />

                <label className="mtg-check">
                  <input type="checkbox" checked={consentPrivacy} onChange={e => setConsentPrivacy(e.target.checked)} required />
                  <span>Acepto la <a href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</a> y que {brand.legalName} (CIF {brand.cif}) me contacte sobre mi solicitud.</span>
                </label>
                <label className="mtg-check">
                  <input type="checkbox" checked={consentMarketing} onChange={e => setConsentMarketing(e.target.checked)} />
                  <span>Quiero recibir información y novedades sobre financiación e hipotecas. <em>(Opcional)</em></span>
                </label>

                <button type="submit" className="mtg-submit" disabled={state === 'loading'}>
                  {state === 'loading' ? 'Enviando…' : 'Solicitar mi estudio gratuito'}
                </button>

                <p className="mtg-legal">
                  Responsable: {brand.legalName}, CIF {brand.cif}, {brand.address}. Finalidad: atender tu solicitud de intermediación hipotecaria. Base: consentimiento. Derechos en <a href={`mailto:${brand.email}`}>{brand.email}</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mtg-foot">
        <div className="wrap">
          <div>
            <div className="b">{brand.name}</div>
            <button type="button" className="mtg-print-btn" onClick={() => { if (typeof window !== 'undefined') window.print(); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
              Imprimir / Guardar PDF
            </button>
          </div>
          <div className="lg">
            © {new Date().getFullYear()} {brand.legalName}{brand.website ? <> · <a href={`https://www.${brand.website}`}>{brand.website}</a></> : null}<br />
            {brand.address} · {brand.phone} · {brand.email}<br />
            Intermediario de crédito inmobiliario conforme a la Ley 5/2019 (LCCI).
          </div>
        </div>
      </footer>
    </div>
  );
}

// Comparativa de dos barras (año anterior vs actual). Colores de marca.
function TwoBars({ prev, curr, prevLabel, currLabel }: { prev: number; curr: number; prevLabel: string; currLabel: string }) {
  const max = Math.max(prev, curr) * 1.12;
  const h = (v: number) => Math.max(4, (v / max) * 40);
  return (
    <svg viewBox="0 0 140 58" width="100%" height="56" aria-hidden="true">
      <rect x="26" y={48 - h(prev)} width="34" height={h(prev)} rx="3" style={{ fill: 'var(--accent-soft)' }} />
      <rect x="80" y={48 - h(curr)} width="34" height={h(curr)} rx="3" style={{ fill: 'var(--accent-deep)' }} />
      <text x="43" y="56" textAnchor="middle" fontSize="8" style={{ fill: 'var(--ink-mute)' }}>{prevLabel}</text>
      <text x="97" y="56" textAnchor="middle" fontSize="8" style={{ fill: 'var(--ink-mute)' }}>{currLabel}</text>
    </svg>
  );
}

// Medidor de un tipo de interés sobre una escala 0–5%.
function RateMeter({ rate, max = 5 }: { rate: number; max?: number }) {
  const pct = Math.min(100, (rate / max) * 100);
  const x = 8 + (124 * pct) / 100;
  return (
    <svg viewBox="0 0 140 46" width="100%" height="46" aria-hidden="true">
      <text x="8" y="12" fontSize="8" style={{ fill: 'var(--ink-mute)' }}>0%</text>
      <text x="132" y="12" fontSize="8" textAnchor="end" style={{ fill: 'var(--ink-mute)' }}>{max}%</text>
      <rect x="8" y="22" width="124" height="8" rx="4" style={{ fill: 'var(--accent-soft)' }} />
      <rect x="8" y="22" width={(124 * pct) / 100} height="8" rx="4" style={{ fill: 'var(--accent-deep)' }} />
      <circle cx={x} cy="26" r="7" style={{ fill: 'var(--accent)', stroke: 'var(--bg)', strokeWidth: 3 }} />
    </svg>
  );
}
