'use client';
import { useState, useEffect } from 'react';

const RAZON_SOCIAL = 'ICA HOME S.L.';
const CIF = 'B10641546';
const DIRECCION = 'Calle Las Mercedes 17, 48930 Getxo';
const EMAIL = 'info@idelagala.com';

export default function DailyCoffeeLanding() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [bar, setBar] = useState('');
  const [bars, setBars] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/delagala/dailycoffee/bars')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBars(data); })
      .catch(() => {});
  }, []);
  const [consentPromo, setConsentPromo] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ coupon_code: string; expires_at?: string; already_claimed?: boolean; next_available?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentPromo) { alert('Necesitamos que aceptes participar en la promoción para enviarte el café.'); return; }
    if (!nombre.trim() || !telefono.trim()) { alert('Rellena tu nombre y tu WhatsApp.'); return; }
    if (bars.length > 0 && !bar) { alert('Indica en qué bar estás.'); return; }
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/delagala/dailycoffee/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_name: nombre.trim(), lead_phone: telefono.trim(), source_url: window.location.href, bar_name: bar, consent_marketing: consentMarketing }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Error al procesar'); setState('error'); return; }
      setResult(data);
      setState('success');
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setState('error');
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Montserrat:wght@400;500;600;700;800&display=swap');
        :root{
          --bg:#FFFFFF;--bg-soft:#FAF7ED;--bg-card:#FFFCEF;
          --ink:#0A0A0A;--ink-soft:#2A2A2A;--ink-mute:#6B6B6B;
          --rule:#0A0A0A;--gray:#E5E5E0;
          --yellow:#F5C842;--yellow-deep:#E5B520;--yellow-soft:#FFF4C2;
          --radius:0px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
        body{background:var(--bg);font-family:'Montserrat',sans-serif;color:var(--ink);line-height:1.55;font-size:16px;overflow-x:hidden;}
        .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}

        /* ── FORM HERO (mobile-first) ── */
        .form-hero{background:var(--ink);min-height:100svh;display:flex;flex-direction:column;justify-content:center;padding:32px 0 40px;position:relative;}
        .form-hero::after{content:"";position:absolute;bottom:0;left:0;right:0;height:4px;background:var(--yellow);}
        .form-hero .inner{width:100%;max-width:480px;margin:0 auto;padding:0 20px;}

        /* Logo top */
        .form-logo{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.12);}
        .form-logo .name{font-family:'Montserrat',sans-serif;font-weight:900;font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#fff;line-height:1.1;}
        .form-logo .sub{font-family:'Montserrat',sans-serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);}

        /* Headline */
        .form-hl{margin-bottom:22px;text-align:center;}
        .form-hl .tag{display:inline-block;background:var(--yellow);color:var(--ink);font-family:'Montserrat',sans-serif;font-weight:800;font-size:9px;letter-spacing:.3em;text-transform:uppercase;padding:5px 12px;margin-bottom:14px;}
        .form-hl h1{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(42px,10vw,60px);line-height:.95;letter-spacing:-.02em;color:#fff;}
        .form-hl h1 em{font-style:italic;color:var(--yellow);display:block;}
        .form-hl p{margin-top:12px;font-size:14px;color:rgba(255,255,255,.65);line-height:1.5;}

        /* Card */
        .form-card{background:#fff;padding:28px 24px 24px;border-top:4px solid var(--yellow);}
        .form-card .sub{font-size:13px;color:var(--ink-mute);margin-bottom:20px;line-height:1.5;}

        /* Fields */
        .field{margin-bottom:16px;}
        .field label{display:flex;align-items:center;gap:6px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);margin-bottom:7px;}
        .field label .hint{font-weight:500;font-size:9px;color:var(--yellow-deep);letter-spacing:.05em;text-transform:none;}
        .field input[type="text"],.field input[type="tel"]{
          width:100%;padding:15px 14px;
          background:var(--bg-soft);border:1.5px solid #D5D5D0;
          font-family:'Montserrat',sans-serif;font-size:16px;color:var(--ink);
          outline:none;-webkit-appearance:none;border-radius:0;
          transition:border-color .15s,box-shadow .15s;
        }
        .field input:focus{border-color:var(--ink);background:#fff;box-shadow:0 0 0 3px rgba(245,200,66,.35);}
        .field input::placeholder{color:#AAA;font-size:15px;}

        /* Bar selector */
        .bar-selector{margin-bottom:16px;}
        .bar-selector .bar-label{display:flex;align-items:center;gap:6px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);margin-bottom:7px;}
        .bar-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .bar-opt{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:4px;padding:16px 12px;min-height:60px;cursor:pointer;
          border:2px solid #D5D5D0;background:var(--bg-soft);
          font-family:'Montserrat',sans-serif;font-weight:700;font-size:13px;
          color:var(--ink);text-align:center;letter-spacing:.03em;
          transition:border-color .15s,background .15s,color .15s;
          -webkit-tap-highlight-color:transparent;user-select:none;
        }
        .bar-opt:hover{border-color:var(--yellow-deep);}
        .bar-opt.bar-selected{border-color:var(--ink);background:var(--ink);color:#fff;}
        .bar-opt.bar-selected .bar-check{background:var(--yellow);color:var(--ink);}
        .bar-check{width:16px;height:16px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;margin-bottom:2px;}

        /* Checkboxes */
        .check-row{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .check-row input[type="checkbox"]{
          flex-shrink:0;width:20px;height:20px;margin-top:2px;
          accent-color:var(--ink);cursor:pointer;
        }
        .check-row .check-text{font-size:12px;line-height:1.55;color:var(--ink-soft);}
        .check-row .check-text strong{color:var(--ink);}
        .check-row .check-text a{color:var(--yellow-deep);font-weight:600;text-decoration:underline;}
        .check-optional{background:var(--bg-soft);padding:12px 14px;border-left:3px solid var(--yellow);margin-bottom:14px;}
        .opt-tag{display:inline-block;background:var(--yellow);color:var(--ink);font-family:'Montserrat',sans-serif;font-weight:700;font-size:8px;letter-spacing:.14em;text-transform:uppercase;padding:2px 6px;margin-left:4px;vertical-align:middle;}

        /* Submit */
        .submit-btn{
          width:100%;padding:18px 20px;min-height:56px;
          background:var(--yellow);color:var(--ink);border:none;cursor:pointer;
          font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;
          letter-spacing:.22em;text-transform:uppercase;
          display:flex;align-items:center;justify-content:center;gap:10px;
          transition:background .18s,transform .1s;
          -webkit-tap-highlight-color:transparent;
          margin-top:20px;
        }
        .submit-btn:active:not(:disabled){transform:scale(.98);}
        .submit-btn:disabled{opacity:.55;cursor:not-allowed;}

        /* Privacy */
        .privacy-box{margin-top:16px;font-size:10px;line-height:1.6;color:var(--ink-mute);padding:12px;background:var(--bg-soft);border:1px solid var(--gray);}
        .privacy-box a{color:var(--yellow-deep);text-decoration:underline;}

        /* Error */
        .error-box{background:#FEF2F2;border:1.5px solid #FCA5A5;padding:12px 14px;color:#B91C1C;font-size:13px;margin-bottom:14px;line-height:1.5;}

        /* Success */
        .success-box{text-align:center;padding:12px 0 4px;animation:fadein .45s ease;}
        @keyframes fadein{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
        .success-icon{font-size:52px;margin-bottom:14px;display:block;}
        .success-box h2{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;font-style:italic;margin-bottom:10px;line-height:1.1;}
        .success-box p{color:var(--ink-soft);font-size:14px;line-height:1.6;margin-bottom:16px;}
        .wa-box{background:#F0FDF4;border:2px solid #22C55E;padding:18px 16px;text-align:center;}
        .wa-box .wa-emoji{font-size:32px;display:block;margin-bottom:8px;}
        .wa-box strong{display:block;font-size:15px;color:#15803D;margin-bottom:4px;}
        .wa-box span{font-size:13px;color:#166534;}

        /* ── REST OF PAGE ── */
        .dateline{background:var(--ink);color:var(--bg);padding:10px 0;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;}
        .dateline .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;}
        .dateline .live{color:var(--yellow);}
        .dateline .live::before{content:"";display:inline-block;width:7px;height:7px;background:var(--yellow);border-radius:50%;margin-right:7px;vertical-align:middle;animation:pulse 1.8s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
        .dateline .dot{display:inline-block;width:5px;height:5px;background:var(--yellow);margin:0 8px;vertical-align:middle;}
        .masthead{text-align:center;padding:38px 0 26px;border-bottom:4px double var(--ink);}
        .masthead .kicker{font-family:'Montserrat',sans-serif;font-size:11px;letter-spacing:.32em;text-transform:uppercase;font-weight:600;color:var(--ink);margin-bottom:14px;}
        .masthead .kicker .yellow-bar{display:inline-block;width:24px;height:3px;background:var(--yellow);vertical-align:middle;margin:0 10px 3px;}
        .masthead h1{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(56px,11vw,120px);line-height:.9;letter-spacing:-.025em;font-style:italic;}
        .masthead .strap{margin-top:14px;font-family:'Montserrat',sans-serif;font-size:14px;color:var(--ink-soft);letter-spacing:.04em;}
        .masthead .strap em{color:var(--yellow-deep);font-style:normal;font-weight:600;}
        .issue-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 0;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);border-bottom:1px solid var(--rule);}
        .issue-bar .sep{color:var(--yellow-deep);margin:0 14px;}
        .hero{padding:64px 0 54px;text-align:center;border-bottom:1px solid var(--rule);}
        .hero .eyebrow{display:inline-block;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:.34em;text-transform:uppercase;color:var(--ink);background:var(--yellow);padding:7px 14px;margin-bottom:24px;}
        .hero h2{font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(40px,6.5vw,78px);line-height:1;letter-spacing:-.02em;max-width:16ch;margin:0 auto;}
        .hero h2 .italic{font-style:italic;font-weight:500;background:linear-gradient(180deg,transparent 62%,var(--yellow) 62%);padding:0 4px;}
        .hero h2 .cup-icon{display:inline-block;width:0.85em;vertical-align:-0.18em;margin:0 0.05em;}
        .hero .lede{margin:24px auto 0;max-width:560px;font-size:17px;line-height:1.6;color:var(--ink-soft);}
        .hero .lede strong{color:var(--ink);font-weight:600;}
        .hero-cta{margin-top:34px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
        .btn{display:inline-flex;align-items:center;gap:10px;padding:16px 28px;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;cursor:pointer;border:none;transition:transform .2s ease,background .2s ease,color .2s ease,box-shadow .2s ease;}
        .btn-primary{background:var(--ink);color:var(--bg);box-shadow:5px 5px 0 var(--yellow);}
        .btn-primary:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--yellow);}
        .btn-ghost{background:transparent;color:var(--ink);border:1.5px solid var(--ink);}
        .btn-ghost:hover{background:var(--ink);color:var(--bg);}
        .edition{padding:60px 0 40px;border-bottom:1px solid var(--rule);}
        .edition-head{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px;margin-bottom:32px;padding-bottom:14px;border-bottom:2px solid var(--ink);}
        .edition-head h3{font-family:'Playfair Display',serif;font-weight:700;font-size:34px;letter-spacing:-.01em;font-style:italic;}
        .edition-head .meta{font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft);}
        .edition-head .meta .yellow-pill{background:var(--yellow);color:var(--ink);padding:3px 8px;margin-right:8px;}
        .news-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:0;}
        .news-lead{background:var(--bg-soft);padding:24px 32px 24px 28px;border-left:5px solid var(--yellow);}
        .news-side{padding-left:32px;display:flex;flex-direction:column;gap:24px;}
        .news-side article{padding-bottom:24px;border-bottom:1px solid var(--gray);}
        .news-side article:last-child{border-bottom:none;padding-bottom:0;}
        .cat{font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink);margin-bottom:10px;font-weight:700;}
        .cat::before{content:"";display:inline-block;width:7px;height:7px;background:var(--yellow);vertical-align:middle;margin-right:8px;}
        .news-lead h4{font-family:'Playfair Display',serif;font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-.015em;margin-bottom:14px;}
        .news-lead .deck{font-family:'Playfair Display',serif;font-weight:400;font-style:italic;font-size:17px;line-height:1.4;color:var(--ink-soft);margin-bottom:16px;}
        .news-lead p{font-size:14px;line-height:1.6;color:var(--ink-soft);font-family:'Montserrat',sans-serif;}
        .news-lead p::first-letter{font-family:'Playfair Display',serif;font-weight:800;font-size:48px;float:left;line-height:.85;padding:6px 10px 0 0;color:var(--ink);background:var(--yellow);margin-right:8px;}
        .news-lead .byline{margin-top:14px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-mute);}
        .lead-kpis{display:flex;gap:0;margin:14px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:10px 0;}
        .lead-kpis .kpi{flex:1;text-align:center;border-right:1px solid var(--ink);padding:2px 6px;}
        .lead-kpis .kpi:last-child{border-right:none;}
        .lead-kpis .kpi-num{font-family:'Playfair Display',serif;font-weight:800;font-size:22px;line-height:1;color:var(--ink);}
        .lead-kpis .kpi-num.highlight{background:var(--yellow);padding:2px 6px;display:inline-block;}
        .lead-kpis .kpi-lbl{font-family:'Montserrat',sans-serif;font-size:8px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mute);margin-top:3px;}
        .news-side h4{font-family:'Playfair Display',serif;font-weight:700;font-size:22px;line-height:1.15;letter-spacing:-.01em;margin-bottom:10px;}
        .news-side p{font-size:14px;line-height:1.55;color:var(--ink-soft);font-family:'Montserrat',sans-serif;}
        .news-side .data{margin-top:12px;display:flex;gap:14px;flex-wrap:wrap;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:.06em;color:var(--ink-mute);padding-top:8px;border-top:1px dashed var(--ink-mute);}
        .news-side .data .yellow-pill{display:inline-block;background:var(--yellow);color:var(--ink);padding:2px 6px;font-weight:700;margin-right:4px;}
        .briefs{margin-top:42px;background:var(--ink);color:var(--bg);padding:28px 32px;}
        .briefs h5{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--yellow);margin-bottom:18px;}
        .briefs h5::before{content:"";display:inline-block;width:18px;height:2px;background:var(--yellow);vertical-align:middle;margin-right:10px;}
        .briefs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .briefs-grid .brief{font-size:14px;line-height:1.5;color:#D5D5D0;padding-left:14px;border-left:2px solid var(--yellow);font-family:'Montserrat',sans-serif;}
        .briefs-grid .brief strong{color:var(--bg);font-weight:600;}
        .briefs-grid .brief .tag{display:block;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--yellow);font-weight:700;margin-bottom:5px;}
        .subscribe{background:var(--ink);color:var(--bg);padding:80px 0 70px;position:relative;margin-top:50px;}
        .subscribe::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:var(--yellow);}
        .subscribe-grid{display:grid;grid-template-columns:1fr;gap:60px;align-items:center;max-width:560px;margin:0 auto;}
        .subscribe-copy .label{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--yellow);margin-bottom:18px;}
        .subscribe-copy h3{font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(38px,5vw,60px);line-height:1;letter-spacing:-.025em;margin-bottom:20px;}
        .subscribe-copy h3 .italic{font-style:italic;color:var(--yellow);}
        .subscribe-copy p{font-size:16px;line-height:1.65;color:#D5D5D0;margin-bottom:14px;}
        .checklist{margin-top:24px;list-style:none;}
        .checklist li{padding:12px 0;border-top:1px solid rgba(255,255,255,.12);display:flex;gap:14px;align-items:flex-start;font-size:15px;}
        .checklist li:last-child{border-bottom:1px solid rgba(255,255,255,.12);}
        .checklist .check{flex-shrink:0;width:22px;height:22px;background:var(--yellow);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;margin-top:1px;}
        .how{padding:80px 0;text-align:center;}
        .how .label{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--ink);margin-bottom:14px;}
        .how h3{font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;line-height:1.02;max-width:18ch;margin:0 auto 50px;}
        .how h3 .italic{font-style:italic;background:linear-gradient(180deg,transparent 62%,var(--yellow) 62%);padding:0 4px;}
        .steps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:30px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);}
        .step{padding:36px 28px;text-align:left;border-right:1px solid var(--rule);position:relative;}
        .step:last-child{border-right:none;}
        .num{font-family:'Playfair Display',serif;font-weight:900;font-size:80px;line-height:.9;color:var(--ink);font-style:italic;margin-bottom:14px;position:relative;display:inline-block;}
        .num::after{content:"";position:absolute;bottom:8px;left:-4px;right:-4px;height:14px;background:var(--yellow);z-index:-1;}
        .step h4{font-family:'Playfair Display',serif;font-weight:700;font-size:24px;letter-spacing:-.01em;margin-bottom:10px;}
        .step p{font-size:14px;color:var(--ink-soft);line-height:1.55;}
        footer{border-top:4px double var(--ink);padding:42px 0 32px;}
        footer .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
        .brand{font-family:'Playfair Display',serif;font-weight:800;font-size:26px;letter-spacing:.01em;font-style:italic;}
        .brand .yellow{color:var(--yellow-deep);}
        .foot-legal{font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mute);text-align:right;line-height:1.7;}
        .foot-legal a{color:var(--ink-mute);text-decoration:none;}

        /* ── RESPONSIVE TABLET ── */
        @media(max-width:880px){
          .news-grid{grid-template-columns:1fr;}
          .news-lead{border-right:none;padding:20px 20px 20px 20px;border-left:4px solid var(--yellow);margin-bottom:0;}
          .news-side{padding-left:0;padding-top:24px;}
          .news-lead h4{font-size:26px;}
          .news-lead .deck{font-size:16px;}
          .news-lead p{font-size:15px;}
          .news-side h4{font-size:20px;}
          .news-side p{font-size:15px;}
          .briefs-grid{grid-template-columns:1fr;gap:18px;}
          .briefs-grid .brief{font-size:15px;}
          .steps{grid-template-columns:1fr;}
          .step{border-right:none;border-bottom:1px solid var(--rule);padding:28px 20px;}
          .step:last-child{border-bottom:none;}
          .step p{font-size:15px;}
        }

        /* ── RESPONSIVE MOBILE ── */
        @media(max-width:520px){
          .wrap{padding:0 16px;}
          .form-hero .inner{padding:0 16px;}

          /* Masthead */
          .masthead{padding:20px 0 16px;}
          .masthead h1{font-size:clamp(40px,12vw,68px);}
          .masthead .kicker{font-size:10px;letter-spacing:.2em;}
          .masthead .strap{font-size:13px;}

          /* Hero */
          .hero{padding:32px 0 24px;}
          .hero h2{font-size:clamp(34px,9vw,52px);}
          .hero .lede{font-size:15px;}
          .hero-cta{flex-direction:column;align-items:center;}
          .btn{width:100%;justify-content:center;}

          /* Edition / news */
          .edition{padding:32px 0 16px;}
          .edition-head{flex-direction:column;gap:8px;}
          .edition-head h3{font-size:24px;}
          .news-lead{padding:16px 16px 16px 16px;border-left:3px solid var(--yellow);}
          .news-lead h4{font-size:22px;line-height:1.1;}
          .news-lead .deck{font-size:15px;}
          .news-lead p{font-size:15px;line-height:1.65;}
          .news-lead p::first-letter{font-size:36px;padding:4px 8px 0 0;}
          .news-side{padding-top:20px;gap:20px;}
          .news-side h4{font-size:19px;}
          .news-side p{font-size:15px;line-height:1.6;}
          .lead-kpis .kpi-num{font-size:18px;}
          .lead-kpis .kpi-lbl{font-size:9px;letter-spacing:.1em;}

          /* Briefs */
          .briefs{padding:22px 18px;}
          .briefs-grid .brief{font-size:15px;line-height:1.55;}
          .briefs-grid .brief .tag{font-size:10px;}

          /* Subscribe / how */
          .subscribe{padding:44px 0 36px;margin-top:0;}
          .subscribe-copy h3{font-size:clamp(30px,8vw,44px);}
          .subscribe-copy p{font-size:15px;}
          .checklist li{font-size:15px;}
          .how{padding:44px 0;}
          .how h3{font-size:clamp(28px,7vw,40px);}
          .step{padding:24px 16px;}
          .step h4{font-size:20px;}
          .step p{font-size:15px;}
          .num{font-size:64px;}

          /* Issue bar */
          .issue-bar{flex-direction:column;align-items:flex-start;gap:4px;font-size:9px;}

          /* Footer */
          footer{padding:28px 0 24px;}
          footer .wrap{flex-direction:column;align-items:flex-start;gap:14px;}
          .foot-legal{text-align:left;font-size:9px;}
          .brand{font-size:22px;}
        }
      `}</style>

      {/* FORM HERO — ocupa toda la pantalla al escanear el QR */}
      <section className="form-hero" id="registro">
        <div className="inner">

          {/* Logo — igual que el periódico */}
          <div className="form-logo">
            <svg width="44" height="44" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <text x="1" y="42" fontFamily="Montserrat,Arial Black,sans-serif" fontWeight="900" fontSize="46" fill="#F5C842">D</text>
              <g transform="translate(30,1)">
                <polygon points="9,0 18,8 0,8" fill="#F5C842"/>
                <rect x="3" y="8" width="12" height="9" fill="#F5C842"/>
              </g>
            </svg>
            <div>
              <div className="name">DELAGALA</div>
              <div className="sub">Consultoría Inmobiliaria</div>
            </div>
          </div>

          {/* Headline */}
          <div className="form-hl">
            <div className="tag">★ Invitación personal</div>
            <h1>Un café,<br /><em>gratis.</em></h1>
            <p>Solo tu nombre y WhatsApp. El código llega al instante.</p>
          </div>

          {/* Card */}
          <div className="form-card">
            {state !== 'success' ? (
              <form onSubmit={handleSubmit} noValidate>
                <p className="sub">☕ Café por cortesía de DELAGALA + el Delagala Daily por WhatsApp.</p>

                {state === 'error' && <div className="error-box">{errorMsg}</div>}

                <div className="field">
                  <label htmlFor="nombre">Nombre</label>
                  <input type="text" id="nombre" placeholder="María García" autoComplete="given-name" value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="telefono">
                    WhatsApp
                    <span className="hint">· aquí recibes el código</span>
                  </label>
                  <input type="tel" id="telefono" placeholder="+34 600 000 000" autoComplete="tel" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required />
                </div>

                {/* Bar selector — cargado dinámicamente desde la BD */}
                {bars.length > 0 && (
                  <div className="bar-selector">
                    <div className="bar-label">¿Dónde estás?</div>
                    <div className="bar-options">
                      {bars.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          className={`bar-opt${bar === b.name ? ' bar-selected' : ''}`}
                          onClick={() => setBar(b.name)}
                        >
                          <span className="bar-check">{bar === b.name ? '✓' : ''}</span>
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="check-row">
                  <input type="checkbox" checked={consentPromo} onChange={e => setConsentPromo(e.target.checked)} required />
                  <span className="check-text">
                    <strong>Acepto participar en la promoción.</strong>{' '}
                    Autorizo a {RAZON_SOCIAL} (CIF {CIF}) a usar mis datos para gestionar esta invitación y enviarme el código por WhatsApp.{' '}
                    <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de privacidad</a>.
                  </span>
                </label>

                <div className="check-optional">
                  <label className="check-row" style={{ marginBottom: 0 }}>
                    <input type="checkbox" checked={consentMarketing} onChange={e => setConsentMarketing(e.target.checked)} />
                    <span className="check-text">
                      <strong>Quiero saber cuánto vale mi casa</strong> y recibir consejos para venderla mejor, de DELAGALA por WhatsApp.
                      <span className="opt-tag">Gratis · Opcional</span>
                    </span>
                  </label>
                </div>

                <button type="submit" className="submit-btn" disabled={state === 'loading'}>
                  {state === 'loading' ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <span>Quiero mi café</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>

                <div className="privacy-box">
                  Responsable: {RAZON_SOCIAL}, CIF {CIF}, {DIRECCION}. Finalidad: gestionar la promoción y enviar el código del café y el periódico digital. Base: consentimiento. Puedes ejercer tus derechos en <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
                </div>
              </form>
            ) : (
              <div className="success-box">
                <span className="success-icon">☕</span>
                <h2>{result?.already_claimed ? 'Ya tienes tu café' : '¡Listo!'}</h2>
                <p>{result?.already_claimed
                  ? <>Tu código sigue activo en WhatsApp. Próximo café disponible el <strong>{result.next_available ? new Date(result.next_available).toLocaleDateString('es-ES') : ''}</strong>.</>
                  : <>Tu código del café y el Delagala Daily están de camino a tu WhatsApp ahora mismo.</>
                }</p>
                <div className="wa-box">
                  <span className="wa-emoji">📲</span>
                  <strong>Abre tu WhatsApp</strong>
                  <span>El código y el periódico te esperan ahí</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* DATELINE */}
      <div className="dateline">
        <div className="wrap">
          <span><span className="live">En portada</span><span className="dot" />{' '}Edición especial — Invitación</span>
          <span>Bizkaia · Margen Derecha</span>
        </div>
      </div>

      {/* MASTHEAD */}
      <div className="wrap">
        <header className="masthead">
          <div className="kicker"><span className="yellow-bar" />Un Periódico de DELAGALA Consultoría Inmobiliaria<span className="yellow-bar" /></div>
          <h1>Delagala Daily</h1>
          <p className="strap">El pulso del ladrillo en Bizkaia y la Margen Derecha — <em>análisis y datos del mercado, cada mañana</em></p>
        </header>
        <div className="issue-bar">
          <span>Vol. I <span className="sep">·</span> Nº 04 <span className="sep">·</span> Edición Trimestral</span>
          <span>Junio 2026</span>
          <span>Getxo · Bilbao · Las Arenas · Algorta</span>
        </div>
      </div>

      {/* HERO */}
      <div className="wrap">
        <section className="hero">
          <span className="eyebrow">★ Invitación personal</span>
          <h2>
            Un café{' '}
            <span className="cup-icon" aria-hidden="true">
              <svg viewBox="0 0 105 115" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                <g stroke="#E5B520" strokeWidth="5" strokeLinecap="round" fill="none">
                  <path d="M28 42 Q22 33 28 24 Q34 15 28 6" /><path d="M46 42 Q40 33 46 24 Q52 15 46 6" /><path d="M64 42 Q58 33 64 24 Q70 15 64 6" />
                </g>
                <path d="M12 50 L80 50 L74 96 Q73 104 64 104 L28 104 Q19 104 18 96 Z" stroke="#0A0A0A" strokeWidth="5" fill="none" strokeLinejoin="round" />
                <path d="M80 62 Q102 62 102 77 Q102 92 80 92" stroke="#0A0A0A" strokeWidth="5" fill="none" />
                <line x1="4" y1="110" x2="88" y2="110" stroke="#0A0A0A" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
            <br /><span className="italic">de la inmobiliaria</span>
          </h2>
          <p className="lede">
            Te invitamos a un <strong>café por cortesía de DELAGALA</strong> y te enviamos el{' '}
            <strong>Delagala Daily por WhatsApp</strong>, con el análisis del mercado inmobiliario.
            Sin compromiso, sin reunión comercial. Solo información útil y un buen café.
          </p>
          <div className="hero-cta">
            <a href="#registro" className="btn btn-primary">
              Reservar mi café
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
            <a href="#portada" className="btn btn-ghost">Ver qué contiene</a>
          </div>
        </section>
      </div>

      {/* EDITION PREVIEW */}
      <div className="wrap" id="portada">
        <section className="edition">
          <div className="edition-head">
            <h3>En la edición de este mes</h3>
            <span className="meta"><span className="yellow-pill">Anticipo</span>Esto es solo una muestra</span>
          </div>
          <div className="news-grid">
            <article className="news-lead">
              <div className="cat">Mercado · Vivienda · Bizkaia</div>
              <h4>Bilbao sigue al alza: la vivienda sube un 10,8% interanual en abril</h4>
              <p className="deck">La presión sobre la capital empuja a parte de la demanda hacia Getxo, Leioa y Barakaldo, donde los precios todavía son más moderados. ¿Estamos ante un nuevo techo o una corrección a la vuelta de la esquina?</p>
              <div className="lead-kpis">
                <div className="kpi"><span className="kpi-num highlight">+10,8%</span><div className="kpi-lbl">Venta abril</div></div>
                <div className="kpi"><span className="kpi-num">+5,8%</span><div className="kpi-lbl">Alquiler abril</div></div>
                <div className="kpi"><span className="kpi-num">~3.721 €</span><div className="kpi-lbl">€/m² Bilbao</div></div>
              </div>
              <p>El precio de la vivienda en Bilbao se anotó en abril una subida del 10,8% interanual según idealista, consolidando la tendencia que ya marcaba un +9% en marzo. El alquiler, por su parte, subió un 5,8% en el mismo mes. El análisis completo, con seis códigos postales y la curva desde 2019, abre la edición impresa de este mes.</p>
              <div className="byline">— Análisis de la redacción · Fuente: idealista/news + Fotocasa</div>
            </article>
            <div className="news-side">
              <article>
                <div className="cat">Inversión · Q1 2026</div>
                <h4>España rompe la baraja europea: 6.394 M€ invertidos en Q1, +45%</h4>
                <p>El segmento Living lidera con 2.386 M€ (+127%), arrastrado por el multifamily/BTR, que concentra el 90% de la inversión residencial. La eurozona, en cambio, cae un 26% de media.</p>
                <div className="data"><span><span className="yellow-pill">6.394 M€</span>Inversión Q1</span><span><span className="yellow-pill">+45,4%</span>Vs. media 2025</span></div>
              </article>
              <article>
                <div className="cat">Normativa · BOE</div>
                <h4>Plan Estatal de Vivienda 2026-2030: 7.000 M€ para cinco años</h4>
                <p>El RD 326/2026, publicado en el BOE, despliega ayudas al alquiler, rehabilitación y compra de vivienda protegida. Incluye 12 novedades fiscales que cambian la cuenta de tu vivienda.</p>
                <div className="data"><span><span className="yellow-pill">7.000 M€</span>Dotación 5 años</span></div>
              </article>
            </div>
          </div>
          <div className="briefs">
            <h5>Otros movimientos en esta edición</h5>
            <div className="briefs-grid">
              <div className="brief"><span className="tag">Tinsa · Precios</span>La vivienda <strong>se dispara un 15,4%</strong> en abril, la mayor subida desde 2006. Islas (+20,3%) y costa mediterránea (+16,7%) a la cabeza.</div>
              <div className="brief"><span className="tag">Euríbor · Hipotecas</span>El Euríbor se asienta en <strong>~2,85%</strong> y encarece la cuota mensual unos 60 € para una hipoteca media. Mixtas ganan peso como cobertura.</div>
              <div className="brief"><span className="tag">Margen Derecha · Obra nueva</span><strong>Los Tilos de Neguri</strong> (Acciona Inmobiliaria) reactiva la zona premium de Getxo con vivienda contemporánea de estética tradicional.</div>
            </div>
          </div>
        </section>
      </div>

      {/* POR QUÉ PARTICIPAR */}
      <section className="subscribe">
        <div className="wrap">
          <div className="subscribe-grid" style={{ maxWidth: 760 }}>
            <div className="subscribe-copy">
              <div className="label">Reserva tu invitación</div>
              <h3>El café, por nuestra cuenta. <span className="italic">Y el Daily, en tu WhatsApp.</span></h3>
              <p>Al registrarte recibirás un <strong style={{ color: 'var(--yellow)' }}>código único</strong> por WhatsApp. Muéstralo en la barra del bar y te invitamos al café — y de paso te llega el <strong style={{ color: 'var(--yellow)' }}>Delagala Daily por WhatsApp</strong>, listo para leer cuando quieras.</p>
              <ul className="checklist">
                <li><span className="check">✓</span><span><strong>Café gratis</strong>, aquí mismo en el bar.</span></li>
                <li><span className="check">✓</span><span><strong>El Delagala Daily por WhatsApp</strong>, con el análisis del mercado inmobiliario de Bizkaia.</span></li>
                <li><span className="check">✓</span><span><strong>Sin compromiso comercial.</strong> No hay reunión obligatoria.</span></li>
                <li><span className="check">✓</span><span><strong>30 segundos</strong> para registrarte. No hay letra pequeña.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="wrap">
        <section className="how">
          <div className="label">Cómo funciona</div>
          <h3>Tres pasos. <span className="italic">Sin trampas.</span></h3>
          <div className="steps">
            <div className="step"><div className="num">01</div><h4>Te registras aquí</h4><p>Rellenas el formulario en menos de un minuto. Recibes por WhatsApp tu código de café y el Delagala Daily.</p></div>
            <div className="step"><div className="num">02</div><h4>Muestras el código</h4><p>Enseñas el código en la barra del bar. DELAGALA invita — sin pagar nada, sin cita previa.</p></div>
            <div className="step"><div className="num">03</div><h4>Café y periódico</h4><p>Disfrutas tu café y recibes el Delagala Daily por WhatsApp, con el análisis del mercado inmobiliario.</p></div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="brand"><span className="yellow">Delagala</span> Daily</div>
          <div className="foot-legal">
            © 2026 DELAGALA Consultoría Inmobiliaria · <a href="https://www.idelagala.com">idelagala.com</a><br />
            {DIRECCION} · 662 128 409 · {EMAIL}
          </div>
        </div>
      </footer>
    </>
  );
}
