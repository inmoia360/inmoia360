# Historia del proyecto: Daily Coffee (campaña QR + WhatsApp de DELAGALA)

> Copia local del capítulo 1 de «Especificaciones técnicas de mis proyectos» (26-09-2026).
> Documento general: https://claude.ai/code/artifact/9d476499-4bff-4d9c-a40f-1c57cd3c4e8a

Un cliente del bar escanea un QR, deja su nombre y móvil, y recibe por WhatsApp un cupón de café gratis y el periódico DELAGALA Daily. La inmobiliaria gana una base de contactos de vecinos de Getxo. A 09-09-2026 había 56 contactos de café y 12 de pan.

## Prompt original

El primer prompt **no se conserva en este ordenador**. El proyecto nació el 21-05-2026, probablemente en claude.ai web. La primera conversación local (09-06-2026) ya empieza con «quiero modificar algo del daily». La intención original se reconstruye del primer commit del 22-05-2026, *«feat: InmoIA360 - campana Daily Coffee DELAGALA»*: QR imprimible, cupón automático por WhatsApp y el PDF del periódico.

Para repetirlo hoy existe la skill `campana-qr-whatsapp-local`. Se creó el 09-09-2026 a partir de este prompt: «guarda skill de todo esto por fa para si quiero otro comercio de calzado».

## Cómo se construyó, paso a paso

| Fecha | Qué se pidió (palabras literales entre comillas) | Qué se hizo |
| --- | --- | --- |
| 21-05 | — | Proyecto Next.js creado |
| 22-05 | Campaña Daily Coffee | QR imprimible, cupón automático por WhatsApp, CIF real, PDF del Daily |
| 23-05 | — | Un cupón por teléfono cada 30 días |
| 25-05 | — | Formulario pensado para móvil, PDF adjunto por WhatsApp, plantilla v7, selector de bar (Las Mercedes / Premier), aviso al personal, límite de 50 cupones/mes |
| 26-05 | — | Panel de administración: estadísticas, registros, bares |
| 09-06 | «me gustaru PONER UN CAFE MAS GRADE FLYER» | Flyer con taza grande y logo; repo movido a la cuenta inmoia360 |
| 11-06 | «realizando el programa que hemos generado para el café, quiero hacerlo ahora para vender panes» | Nace **Daily Bread** (flyer, landing, QR) |
| 12-06 | «TIENE Q SER DOS APP DISINTAS VALE?» | Café y pan separados; título del flyer: «Un buen día empieza con pan tierno. ¡Pasa a por el tuyo gratis!» |
| 15-06 | «TIENE Q SER SEPARADA LAS BASES NO MEZCLAR» · «emular el whasuup business para poder ver las respuetas de los leads» | Panel unificado Pan+Café, alta y baja de locales (pan en Zapore), filtros por local y fecha |
| 25-06 | «no enviés nada todavía hasta que yo pueda vaLiar» | Periódico de julio «especial playas», envío selectivo desde el panel, bajas RGPD, webhook de Meta activo |
| 09-07 | Mensaje: «Hola {nombre} Ya está aquí tu DELAGALA Daily de hoy…» | Primer envío real a la base, con opción de baja |
| 12-07 | Fusionar con el CRM | Los contactos con consentimiento pasan a DELAgala OS |
| 23-07 | Relanzar en Las Mercedes | Comprobado QR → formulario → base de datos; arreglada la descarga del PDF |
| 05/06-08 | «hoy un desasatre… no han llegado los codigos ni los periodicos» | Auditoría, arreglo y mensaje de disculpa a los suscriptores |
| 01-09 | «repases si está activado, si funciona… si pueden leer QR y podemos desplegar el cartel» | Prueba completa de extremo a extremo: todo en verde |
| 02-09 | «No quiero nunca fondo NEGRO» | Periódico de septiembre «Especial PGOU Getxo» (2 páginas, fuentes reales) y landing actualizada |
| 03-09 | Los envíos fallan | Causa: cuenta de WhatsApp Business de Meta bloqueada por una deuda de 4,39 €; pagada, vuelve a funcionar |
| 09-09 | «da de baja a las q digan y guarda una base de datos aparte» | Envío a la base (café 56 de 58, pan 12); tabla de bajas separada; skill guardada |
| 17-09 | Especial herencias | Periódico para imprimir, no se envía |

## Stack y dónde vive

- **Código:** rutas `app/delagala/dailycoffee` (landing, `qr`, `admin`) y `app/api/delagala/dailycoffee/*` (claim, bars, config, wa-open, admin). Hermanos: `app/delagala/dailybread`, `/api/whatsapp/webhook`, `/api/admin/broadcast`, `/api/admin/bajas`, periódicos en `public/delagala-daily*.html/pdf`.
- **Tecnología:** Next.js 16 + TypeScript, Postgres en Neon (vía Vercel), login con cookie JWT, WhatsApp Cloud API de Meta (plantillas `delagala_cafe_v7`, `delagala_daily_news`, `delagala_daily_pgou`), despliegue en Vercel.
- **Base de datos:** esquema `marketing_pilot` (bares, cupones y eventos de cupón), esquema `pan`, tabla de bajas `wa.unsubscribes`.
- **Git:** 111 commits en la rama principal (21-05 → 15-07-2026), y otros en ramas hasta el 09-09. Remotos: `inmoia360/inmoia360`, `acardenal-partners/inmoia360` y la copia `acardenal-partners/delagala-web`.

## Estado final

En producción en https://www.inmoia360.com/delagala/dailycoffee. Los envíos se hacen desde `/delagala/dailybread/admin`. Si los envíos vuelven a fallar, lo primero es mirar el saldo de la cuenta de Meta.

**Lección:** la base de datos y el QR funcionaron desde el principio. Todos los problemas vinieron de WhatsApp: plantillas pendientes de aprobar, el webhook y el saldo de Meta.
