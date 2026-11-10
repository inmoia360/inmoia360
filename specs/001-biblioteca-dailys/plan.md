# Plan 001 — Biblioteca de Dailys

> Etapa 4 del ciclo SDD. El CÓMO. Spec: `spec.md` (APROBADA, con 2 carriles).

## Idea central
Las plantillas de WhatsApp ya aprobadas apuntan a **URLs fijas**:
- café + pan → `/delagala-daily.pdf`
- herbolistería → `/delagala-daily-bienestar.pdf`

Esas dos URLs dejan de ser ficheros estáticos y pasan a **redirigir al PDF activo** de su carril,
según una config que el panel puede cambiar. Así se alterna el periódico **sin reimprimir carteles
ni re-aprobar plantillas**.

## Arquitectura
1. **PDFs fuente** (la biblioteca) en `public/dailies/`: `euribor.pdf`, `hogar-saludable.pdf`,
   `pgou.pdf`, `herencias.pdf`. Son copias de los periódicos ya publicados. Se conservan todos.
2. **Catálogo** (qué periódicos existen y su título legible): constante en el código
   `lib/dailies.ts` → `[{slug, titulo, fecha}]`. Fácil de ampliar al publicar un Daily nuevo.
3. **Config del activo por carril**: tabla `marketing_pilot.daily_active (lane TEXT PK, slug TEXT,
   updated_at)`. Carriles: `cafe_pan`, `herbolisteria`. Creada en runtime (patrón `ensure-*`, como
   `lib/ensure-consent.ts`), porque no se pueden correr migraciones en producción.
4. **Entrega dinámica**: `GET /api/daily/[lane]` lee el activo del carril y hace **redirect 302** a
   `/dailies/<slug>.pdf`. Si no hay activo válido → redirect al defecto (RF-6).
5. **Rewrites** en `next.config.ts` (beforeFiles, que gana a los estáticos):
   - `/delagala-daily.pdf` → `/api/daily/cafe_pan`
   - `/delagala-daily-bienestar.pdf` → `/api/daily/herbolisteria`
6. **API admin** (sesión del panel): `GET /api/admin/delagala/dailycoffee/dailies` (catálogo +
   activos) y `PATCH` `{lane, slug}` (cambia el activo).
7. **UI panel**: sección "📚 Biblioteca de Dailys" en `dailycoffee/admin/(protected)`: por carril,
   el periódico activo y un selector para cambiarlo.

## Alternativas descartadas
- **Copiar el PDF elegido sobre la URL fija en runtime** → NO: el filesystem de Vercel es de solo
  lectura en ejecución; no se puede escribir el fichero servido.
- **Cambiar la URL del botón en la plantilla de Meta al alternar** → NO: cada cambio obligaría a
  crear y re-aprobar plantilla (2-? min), justo lo que se quiere evitar.
- **Rewrite en `vercel.json`** → NO: el repo ya centraliza rewrites/redirects en `next.config.ts`;
  se mantiene un solo sitio.
- **Un fichero JSON de config en `public/`** en vez de tabla → NO: no se puede escribir en runtime
  (mismo motivo que el punto 1). La config vive en la BD.

## Estrategia de pruebas (mapeada a requisitos)
- RF-3/RF-4: cambiar el activo de `cafe_pan` por PATCH y comprobar que `GET /delagala-daily.pdf`
  (seguir redirect) devuelve el PDF nuevo, sin tocar plantillas. Evidencia: `curl -IL`.
- RF-2/RF-8: `cafe_pan`=euribor y `herbolisteria`=hogar-saludable a la vez; cada URL fija sirve el
  suyo.
- RF-6: poner un slug inexistente y ver que cae al defecto.
- RF-7: el panel muestra activo + lista y el cambio persiste.

## Aseguramiento (proyecto-asegurado-pias, etapas 4/5/7)
- El PATCH del activo exige sesión del panel (no público) → probar 401 sin cookie.
- Datos de prueba fuera de producción no aplica (es config de contenido, no datos personales).
- Cambio reversible: siempre se puede volver a marcar el Daily anterior (la biblioteca los conserva).
