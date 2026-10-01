# Cuentas y acceso

## Purpose

Permite que una persona cree su cuenta en FlowSync, entre y salga de ella, y consulte sus datos de perfil, de modo que solo quien tiene una sesión válida accede a la parte privada de la aplicación. Cubre tanto la API (registro, inicio de sesión, perfil y cierre de sesión) como las pantallas de acceso y la protección de las pantallas privadas.

## Requirements

### Requirement: Registro de cuenta por API

El sistema SHALL permitir crear una cuenta mediante una invocación a un endpoint de la API que recibe nombre completo, email, contraseña y confirmación de la contraseña, y SHALL responder con la cuenta creada y una credencial de acceso ya utilizable, sin necesidad de iniciar sesión después.

#### Scenario: Registro correcto con nombre

- **WHEN** se solicita un registro con nombre completo "Ada Byron Lovelace", un email no registrado, una contraseña de 8 a 32 caracteres y la misma contraseña como confirmación
- **THEN** la respuesta es exitosa y devuelve un resultado de autenticación formado por la cuenta creada (identificador, nombre completo, email, fecha de alta, fecha de última modificación e iniciales) y una credencial de acceso que ya permite consultar el perfil

#### Scenario: Registro correcto sin nombre

- **WHEN** se solicita un registro válido indicando explícitamente que no hay nombre completo
- **THEN** la respuesta es exitosa y la cuenta devuelta queda sin nombre

#### Scenario: La contraseña nunca se devuelve

- **WHEN** se registra una cuenta correctamente
- **THEN** la cuenta devuelta no incluye la contraseña ni ningún dato derivado de ella

### Requirement: Validación de los datos de registro

El sistema SHALL rechazar cualquier registro cuyos datos no cumplan las reglas, sin crear la cuenta, y SHALL devolver una lista de errores de validación con uno por cada problema, indicando el campo afectado, el motivo y, cuando aplique, el límite incumplido.

#### Scenario: Campos ausentes

- **WHEN** se solicita un registro sin ningún dato
- **THEN** la respuesta es un error de validación que indica que faltan el nombre completo, el email, la contraseña y la confirmación

#### Scenario: El nombre debe indicarse aunque sea vacío

- **WHEN** se solicita un registro válido en todo lo demás pero sin mencionar el nombre completo, ni siquiera como ausente
- **THEN** la respuesta es un error de validación que indica que falta el nombre completo

#### Scenario: Email con formato inválido

- **WHEN** se solicita un registro con el email "nope"
- **THEN** la respuesta es un error de validación que indica que el email no tiene un formato válido

#### Scenario: Email demasiado largo

- **WHEN** se solicita un registro con un email de más de 254 caracteres
- **THEN** la respuesta es un error de validación sobre el email y no se crea la cuenta

#### Scenario: Contraseña demasiado corta

- **WHEN** se solicita un registro con una contraseña de menos de 8 caracteres
- **THEN** la respuesta es un error de validación que indica que la contraseña debe tener al menos 8 caracteres, y lo mismo para la confirmación si es igual de corta

#### Scenario: Contraseña demasiado larga

- **WHEN** se solicita un registro con una contraseña de más de 32 caracteres
- **THEN** la respuesta es un error de validación que indica que la contraseña no puede superar los 32 caracteres, y lo mismo para la confirmación si es igual de larga

#### Scenario: Confirmación distinta de la contraseña

- **WHEN** se solicita un registro con la contraseña "12345678" y la confirmación "87654321"
- **THEN** la respuesta es un error de validación sobre la confirmación que indica que no coincide con la contraseña

#### Scenario: Email ya registrado

- **WHEN** se solicita un registro con un email idéntico al de una cuenta existente
- **THEN** la respuesta es un error de validación sobre el email que indica que ya está en uso, y no se crea una segunda cuenta

#### Scenario: El email distingue mayúsculas y minúsculas

- **WHEN** existe una cuenta con "ana@example.com" y se solicita otro registro con "ANA@EXAMPLE.COM"
- **THEN** el registro es exitoso y se crea una cuenta distinta con el email tal como se escribió

### Requirement: Inicio de sesión por API

El sistema SHALL permitir iniciar sesión mediante una invocación a un endpoint de la API que recibe email y contraseña, y SHALL responder con la cuenta y una nueva credencial de acceso.

#### Scenario: Credenciales correctas

- **WHEN** se solicita iniciar sesión con el email y la contraseña de una cuenta existente
- **THEN** la respuesta es exitosa y devuelve un resultado de autenticación con la cuenta y una credencial de acceso que permite consultar el perfil

#### Scenario: Cada inicio de sesión emite una credencial nueva

- **WHEN** una misma cuenta inicia sesión varias veces
- **THEN** cada respuesta trae una credencial distinta y todas siguen siendo válidas a la vez hasta que se revoquen

#### Scenario: Contraseña incorrecta

- **WHEN** se solicita iniciar sesión con el email de una cuenta existente y una contraseña que no es la suya
- **THEN** la respuesta es un error que indica que las credenciales no son válidas, sin señalar ningún campo concreto

#### Scenario: Email no registrado

- **WHEN** se solicita iniciar sesión con un email que no corresponde a ninguna cuenta
- **THEN** la respuesta es el mismo error de credenciales no válidas, indistinguible del de contraseña incorrecta

#### Scenario: El email del login distingue mayúsculas y minúsculas

- **WHEN** existe una cuenta con "ana@example.com" y se solicita iniciar sesión con "Ana@example.com" y la contraseña correcta
- **THEN** la respuesta es el error de credenciales no válidas

#### Scenario: Datos de login incompletos o mal formados

- **WHEN** se solicita iniciar sesión sin email o sin contraseña, o con un email sin formato de email
- **THEN** la respuesta es un error de validación que indica, por campo, qué falta o qué está mal, sin llegar a comprobar las credenciales

#### Scenario: La longitud de la contraseña no se valida en el login

- **WHEN** se solicita iniciar sesión con una contraseña de un solo carácter
- **THEN** la respuesta es el error de credenciales no válidas y no un error de validación

### Requirement: Acceso autenticado a la API

El sistema SHALL exigir que las operaciones de cuenta (consulta del perfil y cierre de sesión) vayan acompañadas de una credencial de acceso válida, y SHALL rechazarlas con un error de acceso no autorizado cuando falte o no sea válida.

#### Scenario: Petición sin credencial

- **WHEN** se solicita el perfil sin aportar ninguna credencial
- **THEN** la respuesta es un error de acceso no autorizado

#### Scenario: Credencial inventada

- **WHEN** se solicita el perfil aportando una credencial que el sistema nunca emitió
- **THEN** la respuesta es un error de acceso no autorizado

#### Scenario: Credencial revocada

- **WHEN** se solicita el perfil con una credencial que ya se usó para cerrar sesión
- **THEN** la respuesta es un error de acceso no autorizado

#### Scenario: Las credenciales no caducan por tiempo

- **WHEN** se usa una credencial emitida en un registro o inicio de sesión anterior que no se ha revocado
- **THEN** sigue siendo aceptada, sin importar el tiempo transcurrido

### Requirement: Consulta del perfil por API

El sistema SHALL devolver, mediante una invocación a un endpoint de la API, los datos públicos de la cuenta dueña de la credencial enviada.

#### Scenario: Perfil de la cuenta autenticada

- **WHEN** se solicita el perfil con una credencial válida
- **THEN** la respuesta es exitosa y devuelve los datos de la cuenta autenticada, sin la contraseña

#### Scenario: Iniciales con nombre de dos o más palabras

- **WHEN** la cuenta tiene como nombre completo "Ada Byron Lovelace"
- **THEN** sus iniciales son "AB", la inicial de las dos primeras palabras en mayúsculas

#### Scenario: Iniciales con nombre de una sola palabra

- **WHEN** la cuenta tiene como nombre completo "Solo"
- **THEN** sus iniciales son "SO", las dos primeras letras en mayúsculas

#### Scenario: Iniciales sin nombre

- **WHEN** la cuenta no tiene nombre y su email es "spec-probe@example.com"
- **THEN** sus iniciales son "SE", la primera letra de lo que va antes de la arroba y la primera de lo que va después, en mayúsculas

### Requirement: Cierre de sesión por API

El sistema SHALL revocar, mediante una invocación a un endpoint de la API, únicamente la credencial con la que se hace la petición.

#### Scenario: Cierre de sesión correcto

- **WHEN** se solicita cerrar sesión con una credencial válida
- **THEN** la respuesta es exitosa con un mensaje que confirma el cierre de sesión, y esa credencial deja de ser aceptada

#### Scenario: Otras credenciales de la misma cuenta siguen vivas

- **WHEN** una cuenta tiene dos credenciales activas y se cierra sesión con una de ellas
- **THEN** la otra sigue permitiendo consultar el perfil

#### Scenario: Cierre de sesión sin credencial

- **WHEN** se solicita cerrar sesión sin credencial o con una no válida
- **THEN** la respuesta es un error de acceso no autorizado

### Requirement: Forma de los errores de la API

El sistema SHALL devolver todo fallo de las operaciones de cuenta como una lista de errores en la que cada error lleva al menos un mensaje con el motivo y, si se refiere a un dato concreto de la petición, el campo afectado.

#### Scenario: Error con motivo

- **WHEN** cualquier operación de cuenta falla por validación, por credenciales no válidas o por falta de autorización
- **THEN** la respuesta es una lista de errores, cada uno con su motivo, y no una página ni un texto libre

### Requirement: Pantalla de registro

El sistema SHALL ofrecer una pantalla "Crea tu cuenta" con los campos "Nombre completo (opcional)", "Email", "Contraseña" (con la pista "Entre 8 y 32 caracteres.") y "Repite la contraseña", un botón "Crear cuenta" y un enlace "Inicia sesión" que lleva a la pantalla de inicio de sesión.

#### Scenario: Registro correcto desde la pantalla

- **WHEN** una persona rellena el formulario con datos válidos y pulsa "Crear cuenta"
- **THEN** queda con la sesión iniciada y pasa a ver su perfil, sin tener que iniciar sesión aparte

#### Scenario: Envío en curso

- **WHEN** la persona pulsa "Crear cuenta" y el servidor aún no ha respondido
- **THEN** el botón muestra "Creando cuenta…" y no se puede volver a pulsar

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

- **WHEN** el servidor rechaza el registro por datos no válidos
- **THEN** bajo cada campo afectado aparece un único mensaje en castellano ("Introduce una dirección de email válida.", "la contraseña debe tener al menos 8 caracteres.", "la contraseña no puede superar los 32 caracteres.", "Las contraseñas no coinciden.", etc.) y, si alguno de los errores no corresponde a un campo visible, se muestra además un aviso general en la parte superior del formulario

#### Scenario: Servidor inaccesible

- **WHEN** la persona envía el formulario y el servidor no responde
- **THEN** aparece un aviso general "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." y el botón vuelve a estar disponible

### Requirement: Pantalla de inicio de sesión

El sistema SHALL ofrecer una pantalla "Inicia sesión" con los campos "Email" y "Contraseña", un botón "Entrar" y un enlace "Crea una" que lleva a la pantalla de registro.

#### Scenario: Inicio de sesión correcto desde la pantalla

- **WHEN** una persona introduce un email y una contraseña correctos y pulsa "Entrar"
- **THEN** queda con la sesión iniciada y pasa a ver su perfil

#### Scenario: Envío en curso

- **WHEN** la persona pulsa "Entrar" y el servidor aún no ha respondido
- **THEN** el botón muestra "Entrando…" y no se puede volver a pulsar

#### Scenario: Credenciales incorrectas

- **WHEN** el email no existe o la contraseña no es la suya
- **THEN** aparece un aviso general "El email o la contraseña no son correctos.", sin señalar ningún campo concreto

#### Scenario: Datos incompletos o mal formados

- **WHEN** la persona pulsa "Entrar" con el email vacío, la contraseña vacía o un email sin formato válido
- **THEN** la comprobación la hace el servidor y el mensaje correspondiente ("Falta rellenar el email.", "Falta rellenar la contraseña.", "Introduce una dirección de email válida.") aparece bajo el campo afectado

#### Scenario: Servidor inaccesible o con fallo

- **WHEN** el servidor no responde, o responde con un fallo propio
- **THEN** aparece un aviso general "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." o "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.", respectivamente

### Requirement: Sesión persistente en el navegador

El sistema SHALL recordar la sesión iniciada en el navegador y, al abrir o recargar la aplicación, SHALL comprobar con el servidor que sigue siendo válida antes de mostrar contenido privado o público.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página o vuelve a abrir la aplicación
- **THEN** ve un indicador de carga mientras se comprueba la sesión y después sigue dentro, sin volver a introducir sus datos

#### Scenario: Sesión rechazada por el servidor

- **WHEN** al abrir el perfil el servidor ya no reconoce la sesión recordada
- **THEN** el navegador la olvida, la persona acaba en la pantalla de inicio de sesión y ve el aviso "Tu sesión ha caducado. Vuelve a iniciar sesión."

#### Scenario: Servidor caído al restaurar la sesión

- **WHEN** al abrir el perfil el servidor no responde o falla
- **THEN** la persona acaba en la pantalla de inicio de sesión con el aviso del problema de conexión o de servidor, pero la sesión recordada no se olvida y vuelve a estar activa al recargar cuando el servidor responda

#### Scenario: El aviso de sesión perdida cede ante un nuevo intento

- **WHEN** en la pantalla de inicio de sesión se muestra el aviso de sesión perdida y la persona hace un intento de inicio de sesión que falla
- **THEN** el aviso pasa a mostrar el error de ese intento

### Requirement: Protección de pantallas

El sistema SHALL mostrar el perfil solo a quien tiene sesión iniciada y SHALL mostrar las pantallas de inicio de sesión y registro solo a quien no la tiene.

#### Scenario: Acceso al perfil sin sesión

- **WHEN** una persona sin sesión intenta abrir su perfil
- **THEN** es llevada a la pantalla de inicio de sesión

#### Scenario: Acceso a login o registro con sesión

- **WHEN** una persona con sesión iniciada intenta abrir la pantalla de inicio de sesión o la de registro
- **THEN** es llevada a su perfil

#### Scenario: Dirección desconocida

- **WHEN** una persona abre cualquier dirección de la aplicación que no corresponde a ninguna pantalla, incluida la de entrada
- **THEN** es llevada a su perfil, y de ahí a la pantalla de inicio de sesión si no tiene sesión

#### Scenario: Comprobación de sesión en curso

- **WHEN** la aplicación todavía está comprobando la sesión recordada
- **THEN** cualquier pantalla de acceso o privada muestra solo el indicador de carga, sin llevar a otra pantalla

### Requirement: Pantalla de perfil

El sistema SHALL mostrar en el perfil los datos de la cuenta con sesión iniciada: un círculo con sus iniciales, su nombre completo (o "Sin nombre" si no tiene), su email y la fecha de alta como "Miembro desde" en formato largo en castellano.

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
- **THEN** acaba en la pantalla de inicio de sesión sin ningún aviso y, al recargar, sigue sin sesión

#### Scenario: Cierre de sesión con el servidor caído

- **WHEN** la persona pulsa "Cerrar sesión" y el servidor no responde o rechaza la petición
- **THEN** la sesión se cierra igualmente en el navegador y la persona acaba en la pantalla de inicio de sesión sin ningún aviso de error

## Requisitos escritos vs comprobados

- Escritos: 13
- Comprobados abriendo el código: 2

## Incoherencias

- **Sesión rechazada por el servidor** (pantalla) vs **Las credenciales no caducan por tiempo** (API): la pantalla dice "Tu sesión ha caducado" ante cualquier rechazo, pero las credenciales nunca caducan, solo se revocan o no existen.
- **Pantalla de registro** vs **El nombre debe indicarse aunque sea vacío** (API): la pantalla presenta el nombre como opcional, pero la API rechaza la petición si no se menciona el nombre.
- **Email ya registrado** (pantalla) vs **El email distingue mayúsculas y minúsculas** (API): "Ese email ya está registrado" solo aparece con coincidencia exacta; el mismo email con otras mayúsculas crea una segunda cuenta.
- **El email del login distingue mayúsculas y minúsculas** (API) vs **Credenciales incorrectas** (pantalla): quien se registró como "ana@example.com" y escribe "Ana@example.com" ve "El email o la contraseña no son correctos", aunque ambos datos son suyos.
- **Cierre de sesión correcto** (API) vs **Registro**, **Inicio de sesión** y **Perfil** (API): el cierre de sesión responde con un mensaje suelto en inglés, mientras que las demás operaciones devuelven un objeto de dominio con otra forma.
- **Contraseña demasiado corta / larga** (API) vs **Pantalla de registro**: la API valida la longitud de la confirmación por separado y da dos errores por un único problema, cuando la pantalla solo muestra la pista de longitud bajo "Contraseña".
- **Errores de validación por campo** (pantalla de registro): los mensajes de longitud empiezan en minúscula ("la contraseña debe tener al menos 8 caracteres.") y el resto en mayúscula.
- **Iniciales sin nombre** vs **Iniciales con nombre de una sola palabra** (API): sin nombre, las iniciales toman la primera letra del dominio del email ("SE" para "spec-probe@example.com"), en vez de dos letras de lo que va antes de la arroba como se hace con un nombre de una sola palabra.
- **Iniciales con nombre de dos o más palabras** (API y perfil): con dos espacios seguidos entre palabras ("Ada  Lovelace") las iniciales salen "AD" en lugar de "AL".
- **Registro correcto sin nombre** (API) vs **Nombre en blanco** (pantalla): la pantalla convierte un nombre de solo espacios en "sin nombre", pero la API lo guarda tal cual y el perfil muestra un título en blanco con las iniciales vacías.
- **Sesión persistente en el navegador** vs **Pantalla de registro**: el aviso de por qué se perdió la sesión solo se ve en la pantalla de inicio de sesión; si la persona estaba en la de registro, la sesión desaparece sin explicación.

## Bug o contrato

- Que el email distinga mayúsculas y minúsculas, tanto en la unicidad del registro como en el inicio de sesión, puede ser una decisión deliberada o un descuido de normalización que permite tener cuentas duplicadas.
- Que el nombre sea opcional choca con el requisito de producto de registrarse "con nombre, email y contraseña", y no queda claro si el contrato es el código o el documento de producto.
- Que las credenciales no caduquen nunca puede ser el comportamiento esperado de un MVP o una carencia de seguridad no decidida.
