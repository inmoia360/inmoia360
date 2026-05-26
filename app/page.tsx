import React from 'react';

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-neutral-100 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200 relative">
      {/* CSS Animaciones y Ajustes Locales */}
      <style dangerouslySetInnerHTML={{ __html: `
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Montserrat', sans-serif;
          background-color: #030303;
        }
        .font-serif-lux {
          font-family: 'Playfair Display', serif;
        }
        @keyframes spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .anim-spin-cw {
          animation: spin-clockwise 80s linear infinite;
          transform-origin: center;
        }
        .anim-spin-ccw {
          animation: spin-counter 60s linear infinite;
          transform-origin: center;
        }
        .anim-spin-cw-fast {
          animation: spin-clockwise 45s linear infinite;
          transform-origin: center;
        }
        .anim-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .anim-float {
          animation: float-gentle 6s ease-in-out infinite;
        }
        .text-gold-gradient {
          background: linear-gradient(135deg, #E6C687 0%, #FFF2D4 50%, #C9A054 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .border-gold-subtle {
          border-image: linear-gradient(to right, rgba(230,198,135,0.2), rgba(201,160,84,0.05)) 1;
        }
        .glass-premium {
          background: rgba(10, 10, 10, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .glass-premium-hover:hover {
          background: rgba(15, 15, 15, 0.75);
          border: 1px solid rgba(230, 198, 135, 0.2);
          box-shadow: 0 0 30px rgba(201, 160, 84, 0.04);
        }
      `}} />

      {/* Glows de Fondo Tecnológicos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[80%] rounded-full bg-[radial-gradient(circle,_rgba(217,119,6,0.06)_0%,_transparent_65%)] anim-pulse-glow" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-full bg-[radial-gradient(circle,_rgba(197,160,89,0.04)_0%,_transparent_60%)]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-[0.25em] text-white">INMOIA<span className="text-[#E6C687]">360</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6C687] animate-pulse" />
          </div>
          <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-500 font-medium mt-0.5">Private Innovation Ecosystem</span>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="#soluciones"
            className="text-xs tracking-wider text-neutral-400 hover:text-white transition-colors duration-300"
          >
            Soluciones
          </a>
          <a
            href="#areas"
            className="text-xs tracking-wider text-neutral-400 hover:text-white transition-colors duration-300"
          >
            Áreas
          </a>
          <a
            href="#acceso"
            className="px-4 py-2 text-xs tracking-wider font-medium text-neutral-900 bg-[#E6C687] hover:bg-[#FFF2D4] transition-all duration-300 rounded shadow-[0_4px_20px_rgba(230,198,135,0.15)] hover:shadow-[0_4px_25px_rgba(230,198,135,0.3)] hover:-translate-y-[1px]"
          >
            Solicitar acceso
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Lado Izquierdo: Textos */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/10 bg-amber-500/5 text-amber-300/80 text-[10px] tracking-[0.2em] uppercase font-medium mb-6">
            <svg className="w-2.5 h-2.5 text-[#E6C687]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 11.37h6.085l-1.107 5.423a.75.75 0 001.32.554l5.37-6.087h-6.085l1.107-5.424a.75.75 0 00-1.32-.553l-5.37 6.087z" clipRule="evenodd" />
            </svg>
            Ecosistema Privado
          </div>

          <h1 className="font-serif-lux text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-white tracking-wide">
            Technology.<br />
            Intelligence.<br />
            <span className="text-gold-gradient font-semibold">Impact.</span>
          </h1>

          <p className="mt-8 text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl font-light">
            Desarrollamos e integramos soluciones tecnológicas avanzadas para transformar organizaciones, optimizar operaciones y crear valor real.
          </p>

          <div className="mt-8 flex items-start gap-3 p-4 rounded border border-neutral-900 bg-neutral-950/40 max-w-xl">
            <svg className="w-5 h-5 text-[#E6C687] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs text-neutral-500 leading-relaxed">
              <strong className="text-neutral-400 font-medium">Nota de acceso:</strong> Algunas de nuestras soluciones operan de forma privada o por acceso controlado.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <a
              href="#acceso"
              className="px-8 py-3.5 text-xs tracking-[0.15em] font-semibold text-neutral-950 bg-gradient-to-r from-[#E6C687] to-[#C9A054] hover:from-[#FFF2D4] hover:to-[#E6C687] transition-all duration-500 rounded text-center shadow-[0_4px_30px_rgba(230,198,135,0.15)] hover:shadow-[0_4px_35px_rgba(230,198,135,0.3)] hover:-translate-y-[1px]"
            >
              SOLICITAR ACCESO
            </a>
            <a
              href="#soluciones"
              className="px-8 py-3.5 text-xs tracking-[0.15em] font-medium text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-950/20 hover:bg-neutral-900/40 rounded transition-all duration-300 text-center"
            >
              VER SOLUCIONES
            </a>
          </div>
        </div>

        {/* Lado Derecho: Arte Digital Orbital */}
        <div className="lg:col-span-5 flex justify-center items-center relative anim-float">
          {/* Fondo difuminado bajo la órbita */}
          <div className="absolute w-72 h-72 rounded-full bg-amber-500/5 blur-3xl z-0" />
          
          <svg className="w-full max-w-[400px] h-auto z-10" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Órbita Externa */}
            <circle cx="200" cy="200" r="160" stroke="url(#goldGradientLine)" strokeWidth="0.5" strokeDasharray="6 8" className="anim-spin-cw" />
            <circle cx="87" cy="87" r="4" fill="#E6C687" className="anim-spin-cw" style={{ transformOrigin: '200px 200px' }} />
            <circle cx="313" cy="313" r="2" fill="#C9A054" className="anim-spin-cw" style={{ transformOrigin: '200px 200px' }} />

            {/* Órbita Intermedia */}
            <circle cx="200" cy="200" r="110" stroke="url(#goldGradientLine)" strokeWidth="0.75" strokeDasharray="30 20 10 40" className="anim-spin-ccw" />
            <circle cx="200" cy="90" r="3" fill="#FFF2D4" className="anim-spin-ccw" style={{ transformOrigin: '200px 200px' }} />
            
            {/* Órbita Interna */}
            <circle cx="200" cy="200" r="70" stroke="url(#goldGradientLine)" strokeWidth="0.5" strokeDasharray="2 4" className="anim-spin-cw-fast" />
            
            {/* Conexiones de Red (Líneas finas que cruzan) */}
            <line x1="87" y1="87" x2="200" y2="200" stroke="rgba(230,198,135,0.05)" strokeWidth="0.75" />
            <line x1="313" y1="313" x2="200" y2="200" stroke="rgba(230,198,135,0.05)" strokeWidth="0.75" />
            <line x1="200" y1="90" x2="200" y2="200" stroke="rgba(230,198,135,0.05)" strokeWidth="0.75" />

            {/* Núcleo Central (Planeta/Servidor de Innovación) */}
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#FFF2D4" stopOpacity="1" />
                <stop offset="30%" stopColor="#E6C687" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#C9A054" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#030303" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldGradientLine" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(230,198,135,0.15)" />
                <stop offset="50%" stopColor="rgba(255,242,212,0.4)" />
                <stop offset="100%" stopColor="rgba(201,160,84,0.05)" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="40" fill="url(#coreGlow)" />
            <circle cx="200" cy="200" r="16" fill="#030303" stroke="#E6C687" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="6" fill="#E6C687" />
          </svg>
        </div>
      </section>

      {/* Secciones de Soluciones / Cards */}
      <section id="soluciones" className="relative w-full max-w-7xl mx-auto px-6 py-20 z-10 border-t border-neutral-900/60">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#E6C687] font-semibold">Pilares del Ecosistema</span>
          <h2 className="font-serif-lux text-3xl font-normal text-white tracking-wide mt-2">Tecnología con Propósito</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Acceso Controlado */}
          <div className="glass-premium glass-premium-hover rounded p-8 transition-all duration-700 hover:-translate-y-1 group">
            <div className="w-10 h-10 rounded border border-neutral-800 bg-neutral-950 flex items-center justify-center text-[#E6C687] mb-6 group-hover:border-[#E6C687]/40 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white tracking-wide mb-2">Acceso controlado</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Entornos seguros y privados diseñados exclusivamente para salvaguardar operaciones confidenciales y flujos de datos corporativos de alta criticidad.
            </p>
          </div>

          {/* Card 2: Soluciones a medida */}
          <div className="glass-premium glass-premium-hover rounded p-8 transition-all duration-700 hover:-translate-y-1 group">
            <div className="w-10 h-10 rounded border border-neutral-800 bg-neutral-950 flex items-center justify-center text-[#E6C687] mb-6 group-hover:border-[#E6C687]/40 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l-4.68-4.68A2.652 2.652 0 003 14.17l5.877 5.877m2.543-4.88L9.17 11.25m5.656 5.656l-3.537-3.537M17.25 3h3.75v3.75m-3.75-3.75L12 8.25m9-5.25l-3.5 3.5M3 5.25h3.75m-3.75 0L12 13.5M3 5.25l3.5 3.5M9.17 11.25L3 17.25" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white tracking-wide mb-2">Soluciones a medida</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Arquitecturas informáticas adaptadas de forma milimétrica a los objetivos, flujos de trabajo e infraestructura tecnológica de cada organización.
            </p>
          </div>

          {/* Card 3: Impacto real */}
          <div className="glass-premium glass-premium-hover rounded p-8 transition-all duration-700 hover:-translate-y-1 group">
            <div className="w-10 h-10 rounded border border-neutral-800 bg-neutral-950 flex items-center justify-center text-[#E6C687] mb-6 group-hover:border-[#E6C687]/40 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white tracking-wide mb-2">Impacto real</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Despliegues que garantizan una optimización medible, retorno estratégico de inversión y una evolución corporativa fundamentada en el valor.
            </p>
          </div>
        </div>
      </section>

      {/* Áreas de Especialización */}
      <section id="areas" className="relative w-full max-w-7xl mx-auto px-6 py-20 z-10 border-t border-neutral-900/60">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#E6C687] font-semibold">Áreas de Práctica</span>
          <h2 className="font-serif-lux text-3xl font-normal text-white tracking-wide mt-2">Capacidades Tecnológicas</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Inteligencia Artificial",
              desc: "Modelos predictivos y agentes cognitivos avanzados integrados quirúrgicamente en procesos de decisión.",
              badge: "IA"
            },
            {
              title: "Automatización Inteligente",
              desc: "Optimización de flujos operativos complejos mediante orquestación y automatización libre de fricciones.",
              badge: "RPA & Flows"
            },
            {
              title: "Plataformas Digitales",
              desc: "Arquitectura y desarrollo de soluciones cloud nativas escalables con estándares de nivel enterprise.",
              badge: "Cloud"
            },
            {
              title: "Seguridad y Privacidad",
              desc: "Protocolos estrictos de autenticación, control de accesos y encriptación robusta de datos sensibles.",
              badge: "Seguridad"
            },
            {
              title: "Analytics Avanzado",
              desc: "Modelado de datos en tiempo real para estructurar inteligencia de negocio accionable.",
              badge: "Analytics"
            },
            {
              title: "Integraciones y APIs",
              desc: "Interconexión fluida y robusta entre sistemas legados, microservicios y plataformas externas.",
              badge: "APIs"
            }
          ].map((item, index) => (
            <div 
              key={index} 
              className="p-6 rounded border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/20 hover:border-neutral-800 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] tracking-widest font-mono text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 group-hover:bg-[#E6C687] transition-colors duration-500" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-wide mb-2 group-hover:text-[#E6C687] transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Sección / Acceso Privado */}
      <section id="acceso" className="relative w-full max-w-7xl mx-auto px-6 py-24 z-10 border-t border-neutral-900/60">
        <div className="max-w-3xl mx-auto rounded border border-amber-500/10 bg-[radial-gradient(circle_at_top,_rgba(230,198,135,0.03)_0%,_transparent_100%)] bg-neutral-950/80 p-8 sm:p-12 text-center relative overflow-hidden">
          
          {/* Luz sutil de fondo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#E6C687]/5 rounded-full blur-3xl pointer-events-none" />

          <span className="text-[10px] tracking-[0.3em] uppercase text-[#E6C687] font-semibold">Solicitud de Credenciales</span>
          
          <h2 className="font-serif-lux text-2xl sm:text-3xl font-normal text-white mt-3 mb-6 tracking-wide">
            Ecosistema de Innovación Privado
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto mb-8 font-light">
            El acceso a nuestro ecosistema de plataformas está restringido a socios corporativos y clientes autorizados. Si dispone de una invitación o desea solicitar credenciales de acceso, póngase en contacto con su representante tecnológico de <strong className="text-white font-medium">INMOIA360</strong>.
          </p>

          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-[10px] tracking-wider text-neutral-500 uppercase font-mono">Canal de Acceso Privado</span>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono">
              <svg className="w-3.5 h-3.5 text-[#E6C687]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              portal@inmoia360.com
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-12 z-10 border-t border-neutral-900/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] text-neutral-600 tracking-wider uppercase font-medium">
        <div>
          © {new Date().getFullYear()} INMOIA360. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-6">
          <span>Private Innovation Ecosystem</span>
          <span className="w-1 h-1 rounded-full bg-neutral-800" />
          <span>Technology. Intelligence. Impact.</span>
        </div>
      </footer>
    </main>
  );
}
