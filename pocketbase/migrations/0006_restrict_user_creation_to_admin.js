migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    // Apenas usuários autenticados com role 'admin' ou superusuários podem criar novos usuários
    users.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = ''
    app.save(users)
  },
)
