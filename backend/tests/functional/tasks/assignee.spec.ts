import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que una tarea enseña de su responsable. Cubre el requisito «Lo que cada
 * tarea muestra de su responsable» de `openspec/specs/tasks/spec.md`: el
 * responsable se identifica por nombre e iniciales, la tarea no arrastra ningún
 * otro dato de su cuenta, y una cuenta sin nombre sigue teniendo iniciales.
 *
 * El scenario de la fuga dice «cualquier tarea», así que se comprueba en todas
 * las respuestas que devuelven una: la lista, la tarea suelta, la recién creada
 * y las que salen de cambiar el estado o la fecha. Y también en las que fallan,
 * porque un error que vuelca la tarea filtra lo mismo que un 200.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-10-08'

  /**
   * Lo único que puede salir del responsable. El `id` se admite porque no es un
   * dato de la cuenta sino la forma de referirse a ella; todo lo demás —email,
   * contraseña, fechas de la cuenta— queda fuera.
   */
  const CAMPOS_DEL_RESPONSABLE = ['id', 'fullName', 'initials']

  async function cuenta(fullName: string | null, email: string) {
    return User.create({ fullName, email, password: 'secreto123' })
  }

  async function sesion(client: any, email = 'mira@example.com') {
    await cuenta('Grace Hopper', email)

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(responsable: User) {
    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  /**
   * Una tarea concreta dentro de la lista. Se busca por id porque la suite
   * comparte base de datos con el servidor de desarrollo y la lista puede traer
   * más tareas que las del test.
   */
  function enLaLista(response: any, id: number) {
    return response.body().data.find((t: { id: number }) => t.id === id)
  }

  /**
   * Comprueba que un `assignee` no lleva nada más que lo permitido, ni el email
   * de la cuenta escrito en ninguna parte de la tarea que lo envuelve.
   */
  function sinDatosDeCuenta(assert: any, tarea: any, email: string) {
    assert.notProperty(tarea.assignee, 'email')
    assert.notProperty(tarea.assignee, 'password')
    assert.includeMembers(CAMPOS_DEL_RESPONSABLE, Object.keys(tarea.assignee))
    assert.notInclude(JSON.stringify(tarea), email)
  }

  test('en la lista, el responsable llega con su nombre y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const enLista = enLaLista(response, tarea.id)
    assert.equal(enLista.assignee.fullName, 'Ada Lovelace')
    assert.equal(enLista.assignee.initials, 'AL')
  })

  test('en la tarea suelta, el responsable llega con su nombre y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().data.assignee.fullName, 'Ada Lovelace')
    assert.equal(response.body().data.assignee.initials, 'AL')
  })

  test('cada tarea de la lista trae a su propio responsable, no a quien mira', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const deAda = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))
    const deAlan = await tareaDe(await cuenta('Alan Turing', 'alan@example.com'))

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    assert.equal(enLaLista(response, deAda.id).assignee.initials, 'AL')
    assert.equal(enLaLista(response, deAlan.id).assignee.initials, 'AT')
  })

  test('la lista no expone el email ni otros datos de la cuenta del responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    sinDatosDeCuenta(assert, enLaLista(response, tarea.id), 'ada@example.com')
  })

  test('la tarea suelta no expone el email ni otros datos de la cuenta del responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    sinDatosDeCuenta(assert, response.body().data, 'ada@example.com')
  })

  test('la tarea recién creada no expone el email de quien la crea', async ({ client, assert }) => {
    // Quien crea es el responsable: aquí el email que no debe volver es el
    // de la propia sesión, que es el caso más fácil de dar por inofensivo.
    const token = await sesion(client, 'grace@example.com')

    const response = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    response.assertStatus(201)
    sinDatosDeCuenta(assert, response.body().data, 'grace@example.com')
  })

  test('cambiar el estado no devuelve el email del responsable', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client
      .patch(`/api/v1/tasks/${tarea.id}/status`)
      .header('Authorization', `Bearer ${token}`)
      .json({ status: 'in_progress' })

    response.assertStatus(200)
    sinDatosDeCuenta(assert, response.body().data, 'ada@example.com')
  })

  test('cambiar la fecha no devuelve el email del responsable', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const response = await client
      .put(`/api/v1/tasks/${tarea.id}/due-date`)
      .header('Authorization', `Bearer ${token}`)
      .json({ today: HOY, dueDate: '2026-10-20' })

    response.assertStatus(200)
    sinDatosDeCuenta(assert, response.body().data, 'ada@example.com')
  })

  test('el hash de la contraseña del responsable no sale en ninguna lectura', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const responsable = await cuenta('Ada Lovelace', 'ada@example.com')
    const tarea = await tareaDe(responsable)

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    // Se busca el hash tal cual está guardado, no la palabra «password»: un
    // campo renombrado seguiría siendo la misma fuga.
    assert.notInclude(JSON.stringify(lista.body()), responsable.password)
    assert.notInclude(JSON.stringify(suelta.body()), responsable.password)
  })

  test('sin sesión no se obtiene nada del responsable', async ({ client, assert }) => {
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const lista = await client.get('/api/v1/tasks')
    const suelta = await client.get(`/api/v1/tasks/${tarea.id}`).qs({ today: HOY })

    lista.assertStatus(401)
    suelta.assertStatus(401)
    assert.notInclude(JSON.stringify(lista.body()), 'Ada Lovelace')
    assert.notInclude(JSON.stringify(suelta.body()), 'Ada Lovelace')
  })

  test('una petición rechazada no vuelca los datos del responsable', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta('Ada Lovelace', 'ada@example.com'))

    const sinDia = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .header('Authorization', `Bearer ${token}`)
    const estadoInventado = await client
      .patch(`/api/v1/tasks/${tarea.id}/status`)
      .header('Authorization', `Bearer ${token}`)
      .json({ status: 'archivada' })

    sinDia.assertStatus(422)
    estadoInventado.assertStatus(422)
    assert.notInclude(JSON.stringify(sinDia.body()), 'ada@example.com')
    assert.notInclude(JSON.stringify(estadoInventado.body()), 'ada@example.com')
  })

  test('una tarea que no existe no devuelve ningún responsable', async ({ client, assert }) => {
    const token = await sesion(client)

    const response = await client
      .get('/api/v1/tasks/999999')
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
    assert.notProperty(response.body(), 'data')
  })

  test('un responsable sin nombre llega en la lista con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta(null, 'ada@example.com'))

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const enLista = enLaLista(response, tarea.id)
    assert.isNull(enLista.assignee.fullName)
    assert.isString(enLista.assignee.initials)
    assert.isNotEmpty(enLista.assignee.initials)
  })

  test('un responsable sin nombre llega suelto con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta(null, 'ada@example.com'))

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.isNull(response.body().data.assignee.fullName)
    assert.isString(response.body().data.assignee.initials)
    assert.isNotEmpty(response.body().data.assignee.initials)
  })

  test('un responsable sin nombre no se representa con su email', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(await cuenta(null, 'ada@example.com'))

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    // Sin nombre, lo tentador es rellenar `fullName` con el email para que la
    // interfaz tenga algo que pintar. El scenario lo prohíbe expresamente.
    sinDatosDeCuenta(assert, response.body().data, 'ada@example.com')
  })
})
