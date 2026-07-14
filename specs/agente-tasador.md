# Spec — Agente Tasador Inmobiliario (Fase 1: motor + web)

> **Estado:** BORRADOR PARA REVISIÓN. Decisiones tomadas por defecto por Claude;
> Álvaro las corrige antes de construir nada.

## 1. Objetivo

Captar propietarios que quieren vender, dándoles una **valoración orientativa**
creíble de su vivienda a cambio de su contacto. La valoración es el gancho; el
objetivo de negocio es la **cita de visita** con un asesor de DELAGALA.

Es la tercera pieza de la Fábrica de Captación de inmoia360, junto a
`/hipotecas` y `/diagnostico`, y sigue exactamente su mismo patrón:
landing → API de lead → Neon → `forwardLeadToOs()` → DELAgala OS.

## 2. La regla que lo gobierna todo

**El precio NO lo dice el LLM.** El precio lo calcula un motor determinista a
partir de comparables reales. El LLM solo entrevista al propietario y **explica**
el número que el motor ya ha calculado, citando los testigos.

Consecuencias no negociables:

- Si el motor no encuentra comparables suficientes → **no hay valoración**. El
  agente dice "tu zona necesita un análisis a mano, te llama un asesor" y captura
  el lead igual. Nunca improvisa un número. (*cite-or-null*)
- Se muestra siempre un **rango**, nunca un precio exacto.
- Se muestran siempre los **testigos** en los que se basa (nº de comparables, €/m²
  de la zona, fecha del dato).
- Aviso legal visible: **valoración orientativa de mercado, NO es una tasación
  oficial ECO 805/2003**, que solo puede firmar una sociedad de tasación
  homologada por el Banco de España. Sin esta frase no salimos a producción.

## 3. Requisitos

### Motor de valoración (`lib/valuation.ts` — funciones puras, sin IA)

1. `estimateValue(input)` recibe: código postal o zona, tipo de inmueble, m²
   construidos, habitaciones, baños, planta, ascensor (sí/no), estado
   (a reformar / buen estado / reformado / obra nueva), exterior/interior,
   garaje, terraza, año de construcción.
2. Busca comparables en la tabla `valuation_comps` (ver §4) filtrando por zona y
   tipo de inmueble, con radio ampliable si hay pocos.
3. Calcula el **€/m² base** de la zona como la **mediana** de los comparables
   (mediana, no media: un chalet de 2 M€ no puede arrastrar el barrio).
4. Aplica **coeficientes de ajuste** documentados y auditables sobre el €/m² base
   (estado, planta+ascensor, exterior, antigüedad, extras). Cada coeficiente vive
   en una constante exportada con su justificación en un comentario.
5. Devuelve: `{ min, central, max, pricePerM2, comps[], confidence, method }`.
   El rango es central ±X% donde X depende de la dispersión de los comparables
   (más dispersión → rango más ancho, y se dice).
6. **Devuelve `null` (sin valoración) si hay menos de N comparables válidos**
   (arranque: N = 5). El endpoint responde 200 con `valuation: null` y el motivo.
7. Es una función **pura y testeable**: mismos inputs → mismo output. Tests con
   casos reales de Getxo/Las Arenas/Algorta antes de dar por buena la Fase 1.

### Fuente de datos (§4 detalla el debate abierto)

8. Los comparables viven en una tabla propia de Neon, poblada por un script de
   ingesta. El motor **nunca** llama a un portal en caliente durante la petición
   del usuario.
9. Cada comparable guarda su `source` y `fetched_at`. Los datos con más de 6 meses
   no cuentan para la mediana.

### Web (`app/valoracion` + `app/delagala/valoracion`)

10. Landing con la marca DELAGALA (reutiliza el sistema de `BRANDS` de
    `lib/mortgage.ts`; probablemente merezca extraerse a `lib/brand.ts`).
11. Formulario **multipaso** (una pregunta por pantalla, estilo conversacional —
    convierte mucho mejor que un formulario largo). El contacto se pide **al
    final**, justo antes de enseñar el resultado.
12. Página de resultado: rango, €/m², nº de comparables, explicación en lenguaje
    natural, aviso legal, y CTA fuerte a **"Quiero la valoración exacta: visita
    gratuita"**.
13. Consentimiento RGPD explícito, igual que en `/hipotecas` (`lib/ensure-consent.ts`).

### API (`app/api/valoracion/lead`)

14. `POST` guarda el lead + los inputs del inmueble + la valoración devuelta en
    Neon (migración `007_valuation.sql`), y **después** llama a
    `forwardLeadToOs({ ownerIntent: 'VENDER', angle: 'tasador', ... })`.
15. Si el OS no responde, el lead **no se pierde** (ya es el contrato de
    `os-bridge.ts`).

### Capa IA (la última en construirse, no la primera)

16. Un endpoint que, dado el output del motor, redacta la explicación en
    lenguaje natural para el propietario. Recibe SOLO los datos del motor y tiene
    prohibido en el prompt emitir cifras que no vengan en ellos.
17. Si el motor devolvió `null`, la IA no redacta valoración: redacta el mensaje
    de "un asesor te llama".

## 4. Decisión abierta: de dónde salen los comparables

Es **la única decisión que bloquea el trabajo**. Opciones:

- **(a) Portales (Idealista / Fotocasa).** Los mejores datos y los que el
  propietario ya ha mirado. Idealista tiene API oficial con cuota; el scraping
  está contra sus términos de uso y es un riesgo real. → Hay que decidir si vamos
  por la API oficial y pagamos la cuota.
- **(b) Datos propios de DELAGALA** (histórico del OS). Cero riesgo legal y muy
  defendible ("valorado con nuestras ventas reales en Getxo"), pero solo funciona
  si hay volumen suficiente por barrio. **Hay que mirar cuántas operaciones hay
  realmente en el OS.**
- **(c) Fuentes públicas:** Catastro (superficie, año, uso — vía API oficial y
  gratuita), Registradores / INE / Eustat (€/m² por municipio y trimestre).
  Legal, gratis, sin riesgo — pero granularidad de municipio, no de calle.

**Recomendación:** empezar por **(c) como suelo + (b) como capa fina**, y dejar
(a) enchufable después. Con (c) el agente ya es honesto y publicable; con (b)
encima es *mejor que el de la competencia* porque nadie más tiene vuestras ventas.

## 5. Fase 2 — La voz (decidida, no se construye hasta cerrar la Fase 1)

**El agente de voz NO se construye aquí: ya existe en `citaia`.** citaia es la
plataforma de voz (Vapi) y su primer sector es `inmobiliaria`, con catálogo,
"visita" como cita a agendar y sincronización desde idelagala.

### Stack elegido

| Pieza | Decisión | Por qué |
|---|---|---|
| Orquestador de voz | **Vapi** (el de citaia: `lib/vapi/`) | Ya envuelto en código: `buildVapiAssistant()`, tools, webhook firmado, multi-tenant. |
| Automatización | **Next API routes** (inmoia360 + citaia) | **NO n8n.** Tenemos codebase; n8n sería un 4º sistema, con la lógica fuera de git. |
| CRM | **DELAgala OS** vía `forwardLeadToOs()` | **NO Go High Level.** El OS es la única fuente de verdad del lead. |
| Telefonía | **Twilio**, solo para el DID español | Los números gratuitos de Vapi son de EE. UU. Es fontanería, no arquitectura. |

### Lo que hay que construir en Fase 2 (3 piezas, ninguna grande)

18. **Disparo saliente (speed to lead < 30 s).** Al guardar el lead,
    `app/api/valoracion/lead` hace `POST https://api.vapi.ai/call` con el teléfono
    y pasa el resultado del motor en `assistantOverrides.variableValues`
    (rango, €/m², nº de comparables, dirección). El agente entra en la llamada
    **ya sabiendo** la valoración: no la pregunta, la confirma.
19. **Guion del agente.** Objetivo único: validar los datos del formulario y
    **agendar la visita**. Argumento central, que es honesto y además vende:
    *"esta valoración es de mercado, orientativa; el precio real de tu casa solo
    sale con un asesor dentro de ella"*. Si el motor devolvió `null`, el guion es
    aún más directo: la visita es la única vía.
20. **Post-llamada.** El webhook de citaia ya recibe `end-of-call-report`: extraer
    urgencia, motivo y objeciones, y actualizar la etapa del lead en el OS.

### Dos requisitos legales que no son opcionales

21. **El agente debe declarar que es una IA** al inicio de la llamada
    (Reglamento de IA de la UE, art. 50 — obligación de transparencia). No es
    negociable y, bien dicho, no penaliza la conversión.
22. **Llamada comercial saliente = consentimiento explícito.** La casilla del
    formulario debe decir literalmente que **le vamos a llamar por teléfono**.
    Reutilizar `lib/ensure-consent.ts`. Un lead que pide una valoración y acepta
    la llamada está cubierto; uno que solo dejó el email, no.

## 6. Fuera de alcance

- WhatsApp. Fase 3, mismo motor.
- Multi-tenant / venta a otras inmobiliarias. citaia ya es multi-tenant, así que
  la puerta queda abierta — pero no es el objetivo ahora.

## 7. "Terminado" en Fase 1 significa

- El motor tiene tests y devuelve `null` cuando debe.
- La landing capta y el lead llega al OS.
- Una valoración real de un piso conocido de Getxo cae dentro del rango que
  daría un asesor de DELAGALA a mano. **Este es el examen.**
