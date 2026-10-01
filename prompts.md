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

## Prompt 2

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
no generes commit ni pr. Eso lo realizaré manualmente al terminar de iterar la tarea de generación de spec
```

**Qué salió:** se deshizo el commit local y los cambios quedaron sin commitear en `spec-viva-mmg`.

## Prompt 3

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
Refinemos la spec siguiendo estas reglas:
- sin decisiones técnicas: La spec dice "THEN la respuesta es 200 con { "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } } de esa cuenta y sin contraseña" cuando debería decir "THEN la respuesta es exitosa devolviendo los datos de la cuenta autenticada"
- No incluir códigos de respuestas http (200, 400, 401, etc). En su lugar, describir el motivo de ese mensaje (ej: en lugar de "400" podrías decir "devuelve un mensaje de error de pedido el indicando motivo de falla (caracteres inválidos, de menor o mayor longitud esperada, etc)
- No especificar URLs ni URIs. (Ej. Donde dice "El sistema SHALL devolver mediante GET /api/v1/account/profile los datos públicos de la cuenta dueña de la credencial enviada." debería decir "El sistema SHALL devolver mediante una invocación a un endpoint de la api los datos públicos de la cuenta dueña de la credencial enviada."). Considerar reemplazarlo en cada mención de endpoints sugeridos.
- No usar JSON para describir objetos de dominio. En su lugar, dar el nombre de objeto de dominio. (ej. donde dice "{ "data": { "user": {...}, "token": "..." } }" debería decir simplemente "devolver un objeto de tipo error" o algo que consideres mejor para la lectura

Tener en cuenta que la spec debe mostrar Solo comportamiento observable desde fuera, sin nombres de clase, ni nombres de archivos, ni rutas de código. En la API, observable es la petición y la respuesta. En la pantalla, observable es lo que una persona ve y puede hace.

La spec debe ser abstracta y no atarla como está resuelto, sino que a partir de esta spec se debería poder llegar al código actual definiendo que tecnología se usará, definiendo la arquitectura, etc
```

**Qué salió:** spec reescrita sin códigos HTTP, sin URLs, sin JSON ni nombres de campo técnicos; las respuestas se describen con objetos de dominio (cuenta, credencial de acceso, resultado de autenticación, error de validación, error de acceso no autorizado).

## Prompt 4

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
Continuemos con la segunda parte del ejercicio.
Para ello necesito que agreguemos al archivo de spec las siguientes listas, al final del archivo.

1. Cuántos requisitos escribiste vs cuántos comprobé el abriendo código. Los dos números, sin explicación. El tuyo, lo podés calcular con los requisitos que armaste. El mio, es simplemente dos (comprobé 2 al azar) 

2. Las incoherencias que aparecieron al escribirla. Una línea cada una, con dónde se ve. Para esto, necesito que valides la spec que ecribiste contra el código escrito y enumeres las incoherencias que encuentres: donde, por que, en que. En una línea

3. Lo que no supiste decidir si era un bug o el contrato. Al menos una, y en una frase
```

**Qué salió:** tres secciones al final de la spec: 13 requisitos escritos vs 2 comprobados, 11 incoherencias entre capas o casos límite contrastadas con el código, y 3 dudas de bug o contrato.
