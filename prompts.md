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

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
Necesito que realices la spec de lo que el sistema hace hoy solamente en la vertical de cuentas y acceso (registro, inicio de sesión, sesión y perfil) y sólo sobre esa vertical. No continues con otras. Tener cuenta las dos capas: frontend (pantallas de acceso, el estado de sesión, la protección de rutas, etc) como en el backend (rutas, controladores, modelo de usuario, validadores, middlewares, etc).
Dejarla en un archivo versionado del proyecto (docs/spec-viva/mmg.md)

También necesito que vayas guardando cada prompt que charlando vayamos en el archivo PROMPTS.md, ordenados por ocurrencia (cual fue primero, cual siguiente, etc)

Seguir el siguiente formato para cada spec:
- Arriba, un ## Purpose, en una o dos frases. Debe explicar para qué existe esta capability.
- Debajo, ## Requirements. De este se deben desprender los distintos ### Requirement: en los que el sistema SHALL hacer algo.
- Bajo cada requisito, al menos un #### Scenario: de cuatro almohadillas, con dos viñetas: **WHEN** y **THEN** (sin GIVEN, ya que forma parte del WHEN)
Escribir la spec en español, salvo las mayúsculas de la RFC.

Reglas que no se deben romper:
- Nada de ADDED, MODIFIED ni REMOVED, ya que no estamos construyendo un delta
- Sin observaciones técnicas. Solo comportamiento observable desde fuera. Ni un nombre de clase, ni nombre un de archivo, ni una ruta de código. En la API, observable es la petición y la respuesta. En la pantalla, observable es lo que una persona ve y puede hacer.
- No modifiques código: solo se busca crear la spec del código existente AS-IS
```

**Qué salió:** spec de cuentas y acceso en `docs/spec-viva/mmg.md`, contrastada con peticiones reales a la API.
