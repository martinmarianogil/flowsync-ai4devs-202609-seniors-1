# Trazabilidad · «Lo que cada tarea muestra de su responsable»

Requisito de `openspec/specs/tasks/spec.md`.

- **Scenarios del requisito:** 3
- **Cubiertos (antes de escribir tests):** 0

## Matriz

| Scenario | Prueba que lo cubre | Estado | Si «no lo sé», qué faltó |
|---|---|---|---|
| Responsable «Ada Lovelace» → `assignee` trae su nombre y sus iniciales | — | No cubierto | — |
| Tarea suelta o en la lista → `assignee` no trae el email ni datos de acceso | — | No cubierto | — |
| Responsable registrado sin nombre → nombre nulo, iniciales presentes | — | No cubierto | — |

No hay ningún test de la capability `tasks`: la suite solo tiene `tests/functional/auth/`. Lo que más
se parece es `Auth | iniciales / sin nombre, las iniciales salen del email` (`initials.spec.ts`),
pero comprueba las iniciales del usuario en la respuesta del **login**, no en el `assignee` de una
tarea, así que no cuenta.

## Tests añadidos

En `backend/tests/functional/tasks/assignee.spec.ts`, grupo `Tasks | responsable`: 15 tests,
**12 en verde y 3 en rojo**. Cada test mira un solo endpoint.

| Scenario | Test | Resultado |
|---|---|---|
| Responsable identificable | `en la lista, el responsable llega con su nombre y sus iniciales` | Verde |
| Responsable identificable | `en la tarea suelta, el responsable llega con su nombre y sus iniciales` | Verde |
| Responsable identificable | `cada tarea de la lista trae a su propio responsable, no a quien mira` | Verde |
| No filtra datos de cuenta | `la lista no expone el email ni otros datos de la cuenta del responsable` | **Rojo** |
| No filtra datos de cuenta | `la tarea suelta no expone el email ni otros datos de la cuenta del responsable` | Verde |
| No filtra datos de cuenta | `la tarea recién creada no expone el email de quien la crea` | **Rojo** |
| No filtra datos de cuenta | `cambiar el estado no devuelve el email del responsable` | **Rojo** |
| No filtra datos de cuenta | `cambiar la fecha no devuelve el email del responsable` | Verde |
| No filtra datos de cuenta | `el hash de la contraseña del responsable no sale en ninguna lectura` | Verde |
| No filtra datos de cuenta | `sin sesión no se obtiene nada del responsable` | Verde |
| No filtra datos de cuenta | `una petición rechazada no vuelca los datos del responsable` | Verde |
| No filtra datos de cuenta | `una tarea que no existe no devuelve ningún responsable` | Verde |
| Responsable sin nombre | `un responsable sin nombre llega en la lista con el nombre nulo y con iniciales` | Verde |
| Responsable sin nombre | `un responsable sin nombre llega suelto con el nombre nulo y con iniciales` | Verde |
| Responsable sin nombre | `un responsable sin nombre no se representa con su email` | Verde |

Los tres rojos son el mismo incumplimiento: `TaskTransformer`
(`app/transformers/task_transformer.ts`) serializa el responsable con `UserTransformer`, que incluye
`email`, `createdAt` y `updatedAt`. Lo usan la lista (`GET /tasks`), crear (`POST /tasks`) y cambiar
el estado (`PATCH /tasks/:id/status`). La tarea suelta y cambiar la fecha usan
`TaskAssigneeTransformer` y no filtran nada. El registro tipado que genera el backend
(`.adonisjs/client/registry`) también declara `email` dentro del `assignee` de la lista, así que la
fuga forma parte del contrato que se ofrece al frontend. No se ha tocado el código.

## Las tres líneas

1. **Creía cubiertos 0; lo estaban 0.** No asumí que hubiera tests.
2. **Hueco de test o de spec:** «La tarea no filtra datos de cuenta». La regla está escrita para el
   email, pero «ningún otro dato de acceso» no dice si el `id`, `createdAt` o `updatedAt` cuentan;
   el requisito dice «ningún otro dato de esa cuenta», que es más estricto que el scenario.
   En la primera iteración el agente solo propuso tests de los casos felices; la cobertura de los
   casos no felices y de los bordes llegó en una segunda iteración, cuando la pedí.
3. **Lo que decidí al escribir el test:** que el `id` del responsable sí puede salir (la lista
   blanca es `id`, `fullName`, `initials`); que «cualquier tarea» incluye las respuestas de crear y
   de cambiar estado o fecha, y también las de error, no solo las dos lecturas; y que en el
   responsable sin nombre basta con que las iniciales no estén vacías, sin fijar su valor. Hoy salen
   del propio email (`ada@example.com` → `AE`), y el scenario no aclara si eso ya es «recurrir a su
   email».
