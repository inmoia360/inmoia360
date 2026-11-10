# Spec 001 — Biblioteca de Dailys (periódico activo por campaña)

> Etapa 2 del ciclo SDD. Aquí NO se nombra ninguna tecnología.
> Estado: EN CLARIFICACIÓN

## Contexto y objetivo
Los carteles de la campaña DELAGALA (café, pan, herbolistería) ya están impresos, con un QR fijo.
Hoy, cambiar el periódico que reciben los clientes obliga a sobrescribir ficheros o a re-aprobar
plantillas de WhatsApp. Se quiere poder **alternar desde el panel qué periódico está activo en
cada campaña**, sin reimprimir carteles ni tocar el QR, conservando todos los periódicos para
poder relanzarlos. Toca ahora porque hay carteles impresos que no se quieren desaprovechar y
varios Dailys ya hechos (Euríbor, Hogar Saludable, PGOU, Herencias).

## Usuarios / actores
- **Administrador** (Álvaro / Isabel), desde el panel de administración de la campaña.
- **Cliente final**, que recibe el WhatsApp y pulsa el botón "Leer el Daily".

## Historias de usuario
- Como admin quiero **elegir, por campaña, qué periódico está activo**, para cambiar el contenido
  sin reimprimir carteles ni re-aprobar plantillas.
- Como admin quiero **ver todos los periódicos guardados** (biblioteca) y cuál está activo en cada
  campaña, para reactivar cualquiera cuando quiera.
- Como cliente quiero que el botón "Leer el Daily" me abra **el periódico vigente** de la campaña
  por la que me suscribí.

## Requisitos funcionales (criterios de aceptación en EARS)
- **RF-1** · EL SISTEMA mantiene una biblioteca con todos los periódicos publicados y no borra
  ninguno al añadir o activar otro.
- **RF-2** · EL SISTEMA mantiene, por cada campaña (café, pan, herbolistería), un periódico
  marcado como "activo".
- **RF-3** · CUANDO un cliente pulsa "Leer el Daily" en el WhatsApp de una campaña, EL SISTEMA le
  muestra el periódico activo de esa campaña en ese momento.
- **RF-4** · CUANDO el administrador marca otro periódico como activo para una campaña, EL SISTEMA
  pasa a entregar ese periódico en esa campaña **sin reimprimir carteles, sin cambiar el QR y sin
  re-aprobar plantillas de WhatsApp**.
- **RF-5** · CUANDO el administrador lanza un envío (broadcast) de una campaña, EL SISTEMA enlaza
  el periódico activo de esa campaña.
- **RF-6** · SI la campaña no tiene un periódico activo válido, ENTONCES EL SISTEMA entrega un
  periódico por defecto y lo señala en el panel.
- **RF-7** · MIENTRAS el administrador está en el panel, EL SISTEMA muestra, por campaña, el
  periódico activo y la lista de periódicos disponibles para activar.
- **RF-8** · EL SISTEMA permite que dos campañas distintas tengan activo el mismo periódico a la
  vez (p. ej. café y pan con el Euríbor).

## Requisitos no funcionales
- El cambio de periódico activo surte efecto en **menos de 1 minuto** desde que se guarda.
- Alternar un periódico **no requiere** reimprimir carteles ni re-aprobar plantillas de Meta.
- Se **conservan** todos los periódicos (HTML y PDF) ya publicados.
- Interfaz y textos en **español**.
- El cambio del activo solo lo puede hacer quien tiene la sesión del panel (no público).

## Casos límite
- El periódico marcado como activo deja de estar disponible → se entrega el de defecto (RF-6).
- Un cliente se suscribió por la campaña café y, antes de que abra el WhatsApp, el admin cambia el
  activo → al pulsar, ve el que esté activo en ese momento (el enlace es "vivo").
- Café y pan comparten el mismo Daily activo (permitido, RF-8).
- Se añade un periódico nuevo a la biblioteca → no cambia ningún activo hasta que el admin lo
  marque (RF-1).

## Fuera de alcance
- **Subir / crear** periódicos nuevos desde el panel: se siguen creando con la skill del Daily y
  publicando como hasta ahora. La biblioteca solo **lista y activa** los ya publicados.
- Programar cambios automáticos por fecha.
- Personalizar el periódico por cliente individual.
- Cambiar el **texto** del mensaje de WhatsApp (eso sí es plantilla nueva en Meta).

## Criterios de finalización
- Desde el panel, el admin cambia el periódico activo de una campaña y, al pulsar "Leer el Daily"
  de esa campaña, se abre el nuevo periódico — **sin reimprimir ni re-aprobar plantillas** —,
  demostrado con datos reales.
- Estado objetivo del día: **café → Euríbor, pan → Euríbor, herbolistería → Hogar Saludable**, los
  tres a la vez y cambiables por separado.

## Dudas abiertas
- [NECESITA ACLARACIÓN] ¿La biblioteca debe permitir también **subir** periódicos nuevos desde el
  panel, o basta con **activar** entre los ya publicados? (Recomendación prudente: solo activar;
  subir queda fuera de alcance de esta versión.)
