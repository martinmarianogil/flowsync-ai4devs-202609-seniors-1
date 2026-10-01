# Cuentas y acceso

## Purpose

Permite que una persona cree su cuenta en FlowSync, entre y salga de ella, y consulte sus datos de perfil, de modo que solo quien tiene una sesión válida accede a la parte privada de la aplicación. Cubre tanto la API (registro, inicio de sesión, perfil y cierre de sesión) como las pantallas de acceso y la protección de las pantallas privadas.

## Requirements

### Requirement: Registro de cuenta por API

El sistema SHALL permitir crear una cuenta mediante `POST /api/v1/auth/signup` con los campos `fullName`, `email`, `password` y `passwordConfirmation`, y SHALL responder con los datos públicos de la cuenta creada y una credencial de acceso ya utilizable, sin necesidad de iniciar sesión después.

#### Scenario: Registro correcto con nombre

- **WHEN** se envía un registro con `fullName` "Ada Byron Lovelace", un email no registrado, una contraseña de 8 a 32 caracteres y la misma contraseña como confirmación
- **THEN** la respuesta es 200 con `{ "data": { "user": {...}, "token": "..." } }`, donde `user` contiene `id`, `fullName`, `email`, `createdAt`, `updatedAt` e `initials`, y `token` es una credencial que ya permite consultar el perfil

#### Scenario: Registro correcto sin nombre

- **WHEN** se envía un registro válido con `fullName` igual a `null`
- **THEN** la cuenta se crea con respuesta 200 y el `user` devuelto tiene `fullName` a `null`

#### Scenario: La contraseña nunca se devuelve

- **WHEN** se registra una cuenta correctamente
- **THEN** la respuesta no incluye la contraseña ni ningún derivado de ella

### Requirement: Validación de los datos de registro

El sistema SHALL rechazar con estado 422 cualquier registro cuyos datos no cumplan las reglas, sin crear la cuenta, y SHALL devolver `{ "errors": [...] }` con una entrada por cada problema, indicando `field`, `rule`, `message` y, cuando aplique, `meta` con el límite incumplido.

#### Scenario: Campos ausentes

- **WHEN** se envía un registro con el cuerpo vacío
- **THEN** la respuesta es 422 con un error de regla `required` para cada uno de `fullName`, `email`, `password` y `passwordConfirmation`

#### Scenario: El nombre debe enviarse aunque sea vacío

- **WHEN** se envía un registro válido en todo lo demás pero sin la clave `fullName`
- **THEN** la respuesta es 422 con un error de regla `required` sobre `fullName`

#### Scenario: Email con formato inválido

- **WHEN** se envía un registro con `email` igual a "nope"
- **THEN** la respuesta es 422 con un error de regla `email` sobre el campo `email`

#### Scenario: Email demasiado largo

- **WHEN** se envía un registro con un email de más de 254 caracteres
- **THEN** la respuesta es 422 con un error sobre el campo `email` y no se crea la cuenta

#### Scenario: Contraseña demasiado corta

- **WHEN** se envía un registro con una contraseña de menos de 8 caracteres
- **THEN** la respuesta es 422 con un error de regla `minLength` y `meta.min` igual a 8 sobre `password`, y también sobre `passwordConfirmation` si esta es igual de corta

#### Scenario: Contraseña demasiado larga

- **WHEN** se envía un registro con una contraseña de más de 32 caracteres
- **THEN** la respuesta es 422 con un error de regla `maxLength` y `meta.max` igual a 32 sobre `password`, y también sobre `passwordConfirmation` si esta es igual de larga

#### Scenario: Confirmación distinta de la contraseña

- **WHEN** se envía un registro con `password` "12345678" y `passwordConfirmation` "87654321"
- **THEN** la respuesta es 422 con un error de regla `sameAs` sobre `passwordConfirmation`

#### Scenario: Email ya registrado

- **WHEN** se envía un registro con un email idéntico al de una cuenta existente
- **THEN** la respuesta es 422 con un error de regla `database.unique` sobre `email` y no se crea una segunda cuenta

#### Scenario: El email distingue mayúsculas y minúsculas

- **WHEN** existe una cuenta con "ana@example.com" y se registra otra con "ANA@EXAMPLE.COM"
- **THEN** el registro se acepta con 200 y se crea una cuenta distinta con el email tal como se escribió

### Requirement: Inicio de sesión por API

El sistema SHALL permitir iniciar sesión mediante `POST /api/v1/auth/login` con `email` y `password`, y SHALL responder con los datos públicos de la cuenta y una nueva credencial de acceso.

#### Scenario: Credenciales correctas

- **WHEN** se envía el email y la contraseña de una cuenta existente
- **THEN** la respuesta es 200 con `{ "data": { "user": {...}, "token": "..." } }` y el `token` permite consultar el perfil

#### Scenario: Cada inicio de sesión emite una credencial nueva

- **WHEN** una misma cuenta inicia sesión varias veces
- **THEN** cada respuesta trae una credencial distinta y todas siguen siendo válidas a la vez hasta que se revoquen

#### Scenario: Contraseña incorrecta

- **WHEN** se envía el email de una cuenta existente con una contraseña que no es la suya
- **THEN** la respuesta es 400 con `{ "errors": [{ "message": "Invalid user credentials" }] }`, sin indicar campo

#### Scenario: Email no registrado

- **WHEN** se envía un email que no corresponde a ninguna cuenta
- **THEN** la respuesta es la misma 400 "Invalid user credentials", indistinguible de la de contraseña incorrecta

#### Scenario: El email del login distingue mayúsculas y minúsculas

- **WHEN** existe una cuenta con "ana@example.com" y se intenta entrar con "Ana@example.com" y la contraseña correcta
- **THEN** la respuesta es 400 "Invalid user credentials"

#### Scenario: Datos de login incompletos o mal formados

- **WHEN** se envía un login sin `email` o sin `password`, o con un `email` sin formato de email
- **THEN** la respuesta es 422 con los errores de validación por campo, sin comprobar las credenciales

#### Scenario: La longitud de la contraseña no se valida en el login

- **WHEN** se envía un login con una contraseña de un solo carácter
- **THEN** la respuesta es 400 "Invalid user credentials" y no un error de validación

### Requirement: Acceso autenticado a la API

El sistema SHALL exigir una credencial válida, enviada en la cabecera `Authorization: Bearer <token>`, para las operaciones de cuenta (`GET /api/v1/account/profile` y `POST /api/v1/account/logout`), y SHALL responder 401 con `{ "errors": [{ "message": "Unauthorized access" }] }` cuando falte o no sea válida.

#### Scenario: Petición sin credencial

- **WHEN** se pide el perfil sin cabecera `Authorization`
- **THEN** la respuesta es 401 "Unauthorized access"

#### Scenario: Credencial inventada

- **WHEN** se pide el perfil con `Authorization: Bearer garbage`
- **THEN** la respuesta es 401 "Unauthorized access"

#### Scenario: Credencial revocada

- **WHEN** se pide el perfil con una credencial que ya se usó para cerrar sesión
- **THEN** la respuesta es 401 "Unauthorized access"

#### Scenario: Las credenciales no caducan por tiempo

- **WHEN** se usa una credencial emitida en un registro o login anterior que no se ha revocado
- **THEN** sigue siendo aceptada, sin importar el tiempo transcurrido

### Requirement: Consulta del perfil por API

El sistema SHALL devolver mediante `GET /api/v1/account/profile` los datos públicos de la cuenta dueña de la credencial enviada.

#### Scenario: Perfil de la cuenta autenticada

- **WHEN** se pide el perfil con una credencial válida
- **THEN** la respuesta es 200 con `{ "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } }` de esa cuenta y sin contraseña

#### Scenario: Iniciales con nombre de dos o más palabras

- **WHEN** la cuenta tiene `fullName` "Ada Byron Lovelace"
- **THEN** `initials` es "AB", la inicial de las dos primeras palabras en mayúsculas

#### Scenario: Iniciales con nombre de una sola palabra

- **WHEN** la cuenta tiene `fullName` "Solo"
- **THEN** `initials` es "SO", las dos primeras letras en mayúsculas

#### Scenario: Iniciales sin nombre

- **WHEN** la cuenta no tiene nombre y su email es "spec-probe@example.com"
- **THEN** `initials` es "SE", la primera letra de lo que va antes de la arroba y la primera de lo que va después, en mayúsculas

### Requirement: Cierre de sesión por API

El sistema SHALL revocar mediante `POST /api/v1/account/logout` únicamente la credencial con la que se hace la petición.

#### Scenario: Cierre de sesión correcto

- **WHEN** se llama a cerrar sesión con una credencial válida
- **THEN** la respuesta es 200 con `{ "message": "Logged out successfully" }` (sin envoltorio `data`) y esa credencial deja de ser aceptada

#### Scenario: Otras credenciales de la misma cuenta siguen vivas

- **WHEN** una cuenta tiene dos credenciales activas y se cierra sesión con una de ellas
- **THEN** la otra sigue permitiendo consultar el perfil

#### Scenario: Cierre de sesión sin credencial

- **WHEN** se llama a cerrar sesión sin credencial o con una no válida
- **THEN** la respuesta es 401 "Unauthorized access"

### Requirement: Formato de las respuestas de la API

El sistema SHALL responder siempre en JSON, envolviendo los resultados correctos de registro, login y perfil en `{ "data": ... }` y los errores en `{ "errors": [...] }`.

#### Scenario: Error devuelto como JSON

- **WHEN** cualquier petición de cuenta falla por validación, credenciales o falta de autenticación
- **THEN** el cuerpo es JSON con una lista `errors` cuyos elementos tienen al menos `message`

### Requirement: Pantalla de registro

El sistema SHALL ofrecer en `/register` un formulario "Crea tu cuenta" con los campos "Nombre completo (opcional)", "Email", "Contraseña" (con la pista "Entre 8 y 32 caracteres.") y "Repite la contraseña", un botón "Crear cuenta" y un enlace "Inicia sesión" que lleva a `/login`.

#### Scenario: Registro correcto desde la pantalla

- **WHEN** una persona rellena el formulario con datos válidos y pulsa "Crear cuenta"
- **THEN** queda con la sesión iniciada y pasa a ver su perfil, sin tener que iniciar sesión aparte

#### Scenario: Envío en curso

- **WHEN** la persona pulsa "Crear cuenta" y el servidor aún no ha respondido
- **THEN** el botón muestra "Creando cuenta…" y está deshabilitado

#### Scenario: Contraseñas distintas detectadas antes de enviar

- **WHEN** la contraseña y su repetición no coinciden y se pulsa "Crear cuenta"
- **THEN** aparece "Las contraseñas no coinciden." bajo "Repite la contraseña" y no se envía nada al servidor

#### Scenario: Nombre en blanco

- **WHEN** la persona deja "Nombre completo" vacío o solo con espacios
- **THEN** la cuenta se crea sin nombre; si escribe un nombre, se guarda sin los espacios de los extremos

#### Scenario: Email ya registrado

- **WHEN** la persona intenta registrarse con un email que ya tiene cuenta
- **THEN** aparece bajo "Email" el mensaje "Ese email ya está registrado. Inicia sesión en su lugar." y no aparece aviso general

#### Scenario: Errores de validación por campo

- **WHEN** el servidor rechaza el registro por datos inválidos
- **THEN** bajo cada campo afectado aparece un único mensaje en castellano ("Introduce una dirección de email válida.", "la contraseña debe tener al menos 8 caracteres.", "la contraseña no puede superar los 32 caracteres.", "Las contraseñas no coinciden.", etc.) y, si alguno de los errores no corresponde a un campo visible, se muestra además un aviso general en la parte superior del formulario

#### Scenario: Servidor inaccesible

- **WHEN** la persona envía el formulario y el servidor no responde
- **THEN** aparece un aviso general "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." y el botón vuelve a estar disponible

### Requirement: Pantalla de inicio de sesión

El sistema SHALL ofrecer en `/login` un formulario "Inicia sesión" con los campos "Email" y "Contraseña", un botón "Entrar" y un enlace "Crea una" que lleva a `/register`.

#### Scenario: Inicio de sesión correcto desde la pantalla

- **WHEN** una persona introduce un email y contraseña correctos y pulsa "Entrar"
- **THEN** queda con la sesión iniciada y pasa a ver su perfil

#### Scenario: Envío en curso

- **WHEN** la persona pulsa "Entrar" y el servidor aún no ha respondido
- **THEN** el botón muestra "Entrando…" y está deshabilitado

#### Scenario: Credenciales incorrectas

- **WHEN** el email no existe o la contraseña no es la suya
- **THEN** aparece un aviso general "El email o la contraseña no son correctos.", sin señalar ningún campo concreto

#### Scenario: Datos incompletos o mal formados

- **WHEN** la persona pulsa "Entrar" con el email vacío, la contraseña vacía o un email sin formato válido
- **THEN** la comprobación la hace el servidor y el mensaje correspondiente ("Falta rellenar el email.", "Falta rellenar la contraseña.", "Introduce una dirección de email válida.") aparece bajo el campo afectado

#### Scenario: Servidor inaccesible o con fallo

- **WHEN** el servidor no responde o responde con un error interno
- **THEN** aparece un aviso general "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." o "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.", respectivamente

### Requirement: Sesión persistente en el navegador

El sistema SHALL recordar la sesión iniciada en el navegador y, al abrir o recargar la aplicación, SHALL comprobar con el servidor que sigue siendo válida antes de mostrar contenido privado o público.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página o vuelve a abrir la aplicación
- **THEN** ve un indicador de carga mientras se comprueba la sesión y después sigue dentro, sin volver a introducir sus datos

#### Scenario: Sesión rechazada por el servidor

- **WHEN** al abrir el perfil el servidor ya no reconoce la sesión recordada
- **THEN** el navegador la olvida, la persona acaba en `/login` y ve el aviso "Tu sesión ha caducado. Vuelve a iniciar sesión."

#### Scenario: Servidor caído al restaurar la sesión

- **WHEN** al abrir el perfil el servidor no responde o falla
- **THEN** la persona acaba en `/login` con el aviso del problema de conexión o de servidor, pero la sesión recordada no se olvida y vuelve a estar activa al recargar cuando el servidor responda

#### Scenario: El aviso de sesión perdida cede ante un nuevo intento

- **WHEN** en `/login` se muestra el aviso de sesión perdida y la persona hace un intento de inicio de sesión que falla
- **THEN** el aviso pasa a mostrar el error de ese intento

### Requirement: Protección de pantallas

El sistema SHALL mostrar el perfil solo a quien tiene sesión iniciada y SHALL mostrar las pantallas de inicio de sesión y registro solo a quien no la tiene.

#### Scenario: Acceso al perfil sin sesión

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Acceso a login o registro con sesión

- **WHEN** una persona con sesión iniciada abre `/login` o `/register`
- **THEN** es redirigida a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** una persona abre cualquier dirección que no sea `/login`, `/register` ni `/profile` (incluida la raíz)
- **THEN** es redirigida a `/profile`, y de ahí a `/login` si no tiene sesión

#### Scenario: Comprobación de sesión en curso

- **WHEN** la aplicación todavía está comprobando la sesión recordada
- **THEN** cualquier pantalla de acceso o privada muestra solo el indicador de carga, sin redirigir

### Requirement: Pantalla de perfil

El sistema SHALL mostrar en `/profile` los datos de la cuenta con sesión iniciada: un círculo con sus iniciales, su nombre completo (o "Sin nombre" si no tiene), su email y la fecha de alta como "Miembro desde" en formato largo en castellano.

#### Scenario: Perfil con nombre

- **WHEN** una persona llamada "Ada Byron Lovelace", dada de alta el 1 de octubre de 2026, entra en su perfil
- **THEN** ve "AB" en el círculo, "Ada Byron Lovelace" como título, su email debajo y "Miembro desde 1 de octubre de 2026"

#### Scenario: Perfil sin nombre

- **WHEN** una persona sin nombre entra en su perfil
- **THEN** ve "Sin nombre" como título y en el círculo las iniciales derivadas de su email

### Requirement: Cierre de sesión desde la pantalla

El sistema SHALL ofrecer en el perfil un botón "Cerrar sesión" que termina la sesión en el navegador y la revoca en el servidor.

#### Scenario: Cierre de sesión correcto

- **WHEN** la persona pulsa "Cerrar sesión"
- **THEN** la persona acaba en `/login` sin ningún aviso y, al recargar, sigue sin sesión

#### Scenario: Cierre de sesión con el servidor caído

- **WHEN** la persona pulsa "Cerrar sesión" y el servidor no responde o rechaza la petición
- **THEN** la sesión se cierra igualmente en el navegador y la persona acaba en `/login` sin ningún aviso de error
