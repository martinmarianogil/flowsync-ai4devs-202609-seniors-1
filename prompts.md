# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

---

## Prompt 1

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
esisto que armemos una matriz de trazabilidad para informar si cada escenario tiene un test que lo
  cubre y cual es. En caso que ese escenario no esté cubierto por ningún test, crear un test que lo haga.
  Vamos a trabajar unicamente sobre el requisito «Lo que cada tarea muestra de su responsable», que está
  en openspec/specs/tasks/spec.md. Ignoraremos el resto de los requisitos.
```

**Qué salió:** matriz con los 3 scenarios sin cubrir, 3 tests nuevos; uno en rojo (la lista expone el email del responsable).

---

## Prompt 2

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
  Revisar los test generados backend/tests/functional/tasks/assignee.spec.ts y llevar al estilo de los que ya hay en backend/tests/functional/auth/. No toques nada fuera de backend/tests/. Agregar test para los casos no felices, en los que no se cumpla la spec. (Ej: que devuelva una tarea con el email de la cuenta y que tire la excepción correspondiente). Cubrir los casos que van más alla de los casos felices.
```

**Qué salió:** 15 tests al estilo de `auth/`, 3 en rojo (lista, crear y cambiar estado exponen el email del responsable).

---

## Prompt 3

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
sí, actualizá solo mmg.md y prompts.md
```

**Qué salió:** matriz y prompts al día con la nueva suite.

---

## Prompt 4

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
  Modificar en "las tres líneas" los siguientes detalles:
  En 1 (la primer línea), aclarar que mi número era 0 (no asumí que hubiera tests)
En 2 (Hueco de test o de spec): Agregar que solo propuso, en la primer iteración, test sobre casos felices. En otra iteración se agregó más cobertura y casos border
En 3, dejarla tal cual
```

**Qué salió:** líneas 1 y 2 de la parte B ajustadas.
