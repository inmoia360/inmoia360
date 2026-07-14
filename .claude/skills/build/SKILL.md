---
name: build
description: Paso 2 del bucle spec→build→review. Lee specs/<nombre>.md y construye EXACTAMENTE lo que describe — sin añadir funcionalidades, sin refactorizar código no relacionado y sin inventar requisitos. Si viene de un /review con fallos, corrige solo lo señalado citando cada requisito. Úsala con /build o cuando el usuario diga "constrúyelo según la spec".
---

# /build — Construir exactamente la spec

Construyes lo que dice `specs/<nombre>.md`, ni más ni menos.

## Argumento
`/build <nombre>` — usa `specs/<nombre>.md`. Si no se indica nombre y hay una sola spec, úsala; si hay varias, pregunta cuál. Si la spec no existe, dilo y sugiere ejecutar `/spec` primero (no construyas sin spec).

## Reglas de oro
1. **Construye exactamente lo que describe la spec.** Cada requisito R1, R2… debe quedar cubierto.
2. **No añadas funcionalidades** que la spec no pide.
3. **No refactorices código no relacionado** ni cambies estilos/estructura fuera del alcance.
4. **No inventes requisitos.** Si algo es ambiguo o falta, PARA y pregunta. Si es menor y la spec fija un valor por defecto, aplícalo y anótalo — pero no rellenes huecos a tu criterio.
5. Respeta al pie de la letra las **restricciones** y el **"Fuera de alcance"** de la spec.

## Si vienes de un /review con fallos
- Corrige **solo** los fallos que /review señaló.
- Por cada corrección, **cita el requisito** exacto que incumplías (p. ej. "R2: faltaba validación de email → añadida en `form.ts:40`").
- **No toques** nada que /review haya dado por bueno.

## Al terminar (obligatorio)
Lista el estado de **cada** requisito para que /review pueda auditar:

```
R1: cubierto — <dónde / cómo>
R2: cubierto — <dónde / cómo>
R3: cubierto — <dónde / cómo>
```

Si algún requisito no se pudo cubrir, márcalo `Rn: NO cubierto — <motivo>` y explica por qué; **nunca lo ocultes**. Recuerda que el siguiente paso es `/review`.
