# Historia: Hipotecas (Tu Partner Hipotecario / Hipoteca Justa) y agente tasador

> Copia local del bloque 8.2 de «Especificaciones técnicas de mis proyectos» (26-09-2026).
> Documento general: https://claude.ai/code/artifact/9d476499-4bff-4d9c-a40f-1c57cd3c4e8a

## 1. Hipotecas

Servicio de intermediación hipotecaria de ICA HOME. Tiene dos webs sobre una misma base: «Hipoteca Justa» (azul y sencilla) y «Tu Partner Hipotecario» (dorada y premium, con datos del INE y del Banco de España). Las dos tienen calculadora, formulario, panel y aviso por WhatsApp.

### Prompt original

Claude Code, 01-07-2026, 10:33, después de un audio de WhatsApp:

> «Te lanzo la idea del proyecto y cajón, como sabes bien, es la inmobiliaria de la marca consultoría de la gala. Queremos lanzar un servicio financiero a través de la ley de crédito hipotecario donde queremos empezar a podar servicios de análisis, innovaciones, estudios de hipoteca, etc. Y queremos crear dos landing Page, una como con marca blanca para acceder a mercados que no nos interesan de bajo rendimiento y otra a través de la marca élite de de la gala. Quiero crear una estructura de landing Page de las dos con este tipo de contenido donde podamos poner una calculadora un formulario de contacto, noticias que sea atractivo, diseño moderno […] con capacidad de puede llegar a muchos mercados.»

### Cómo se construyó

| Fecha | Instrucción (literal) | Qué se hizo |
| --- | --- | --- |
| 01-07 | Prompt original | Dos webs con un mismo componente y dos pieles |
| 01-07 | «NO TIENE NADA Q VER CON EL CAFE» | Base de datos propia (`hipotecas.leads`) |
| 01-07 | «Crédito Claro… llamale OTRO NOMBRE, DAME IDEAS» | «Hipoteca Justa – La hipoteca que mereces» |
| 01-07 | «mete porfa noticias y novedadess actualizadas de estos enlaces con gragficos…» | Datos oficiales con 4 indicadores y minigráficos |
| 01-07 | «…esté más adelante esa sección, para que dé más credibilidad» | La sección sube justo debajo de la cabecera |
| 01-07 | «la que no es de élite… no tenga tantos datos y gráficos» | La versión sencilla se queda solo con noticias |
| 01-07 | «Necesito saber cuando llega un posible candidato… Si me manda un WhatsApp» | Aviso por WhatsApp cuando entra un contacto |
| 12-07 | «delagala no se asocia» | DELAGALA no aparece, por neutralidad ante los bancos |
| 12-07 | «la premium quiero con colores amarillos como antes» | Dos marcas: premium dorada y sencilla azul |
| 12-07 | «compite con la compeencia y mejora diseño tupartnerhipotecario.es ?» | La premium pasa a llamarse «Tu Partner Hipotecario» y se añade «Por qué elegirnos» |
| 12-07 | «mas de 3 millones gestionados y 20 familias» | Métricas reales en la web |
| 15/16-07 | «Quiero subir a estos dominios las partners hipotecario» · «Hazlo, tú, por favor.» | tupartnerhipotecario.es y .com registrados a nombre de ICA HOME y apuntados a la web |

**Campaña a entidades financieras** (12-07-2026, 21:20): «quiero crear una campaña para enviar correo electronicos en nombre de ICA HOME, S.L para solicitar poder colaborar con todas entidades financieras de españa. primero crea es el agente, luego buscas todas las entidades y localiza el contacto para poder enviar el mail personalizado, tambien quiero ver q requisitos piede cada entidad». Se hicieron el agente, un informe de 14 entidades y 4 borradores. Solo UCI tiene un canal abierto para colaboradores. Después llegó la orden «no envies nada aun» y **no se envió nada**. Todo está en la carpeta `campana-entidades`.

**Pendiente:**
- Verificar el dominio en Hostinger.
- Poner testimonios reales.
- Un aviso fiable, con plantilla de WhatsApp aprobada o por email.
- Actualizar los datos oficiales, que ahora son fijos.
- En los borradores de la campaña, completar el registro de Isabel.

**Lección:** fijar el posicionamiento y mirar a la competencia antes de diseñar.

## 2. Agente tasador

Es un gancho para captar propietarios: una valoración orientativa cuyo objetivo es conseguir la cita. El precio lo calcula un motor a partir de comparables, no la IA. Sin comparables, no hay valoración.

### Prompt original

Claude Code, 14-07-2026, 15:38:

> «https://www.youtube.com/watch?v=_cNCuUDDnX0 quiero constrir este agente tasador inmobiliario»

A las 15:42: «en CITAIA tengo otro para la voz, aqui se habla de VAPI, elige el mejor.»

| Fecha | Instrucción (literal) | Qué se hizo |
| --- | --- | --- |
| 14-07 | Prompt original | Spec `specs/agente-tasador.md` |
| 14-07 | «en CITAIA tengo otro para la voz… elige el mejor» | Reparto: inmoia360 capta, el OS registra y CitaIA pone la voz |
| 14-07 | «arranca mejor» | Motor `lib/valuation.ts`: mediana de comparables, −7 % sobre el precio de oferta y rango según la dispersión; 18 pruebas en verde |
| 14-07 | «porq cuando llamo… hablo de partner y expediente» | El número de Twilio seguía apuntando a la demo de Partners |
| 14-07 | «que se pueda rediseñar para otros clientes y sectores…» | CitaIA pasa a ser una fábrica multisector |
| 14-07 | «hazlo para no perder dinero» · «corrige todo para q funcione y sea barato» | Modelo de coste (unos 0,10 €/min) y valores baratos por defecto |

**Estado:** bloqueado porque la tabla de comparables está vacía, e Idealista bloquea el scraping. La recomendación es usar Catastro, Eustat y Registradores, más las ventas del OS.

**Lección:** resolver primero el dato y después ampliar el alcance.
