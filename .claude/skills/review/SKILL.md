---
name: review
description: Paso 3 del bucle spec→build→review. Audita el entregable actual contra specs/<nombre>.md requisito a requisito, verificando el contenido real, y devuelve la lista exacta de fallos con su corrección concreta. Solo aprueba cuando TODOS los requisitos se cumplen, sin aprobados a medias. Úsala con /review o cuando el usuario diga "audítalo/revísalo contra la spec" o "¿está terminado?".
---

# /review — Auditar contra la spec

Auditas, NO construyes. Verificas el estado REAL del entregable contra `specs/<nombre>.md`.

## Argumento
`/review <nombre>` — usa `specs/<nombre>.md`. Si no se indica y hay una sola spec, úsala; si hay varias, pregunta cuál.

## Cómo auditar
1. Lee la spec y recorre **cada requisito R1, R2…** y **cada punto de la definición de hecho**.
2. Para cada uno, **verifica el contenido REAL** del entregable: lee el código, los archivos o la salida. No te fíes del resumen de `/build` ni asumas que algo está hecho porque lo diga.
3. Comprueba también los **casos límite** y que no se haya construido nada de **"Fuera de alcance"**.

## Cómo reportar
Por cada requisito, di **CUMPLE** o **FALLA**. Por cada fallo, cita el requisito exacto y da la corrección concreta:

```
R2: FALLA — falta la validación de email obligatorio.
    Corrección: validar el formato en el submit y mostrar "email no válido".
R5: FALLA — se implementó exportación a PDF, que está en "Fuera de alcance".
    Corrección: eliminar la exportación a PDF.
```

Sé literal y verificable. Nada de "casi", "aprobado con matices" ni aprobados a medias.

## Veredicto
- **APROBADO** solo si **TODOS** los requisitos y la definición de hecho se cumplen.
- Si falla algo: **NO APROBADO**, con la lista de **correcciones concretas** lista para pasar a `/build`. Indica al usuario que ejecute `/build` para corregir y luego `/review` otra vez.

## El bucle
`spec → build → review → (fallos) → build → review → …` hasta APROBADO. Tú eres quien decide cuándo termina: solo cuando no queda ningún fallo.
