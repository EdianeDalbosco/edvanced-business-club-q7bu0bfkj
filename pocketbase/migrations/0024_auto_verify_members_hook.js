migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Garantir que a regra de criação e atualização permita admins
    users.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"

    app.save(users)
  },
  (app) => {
    // Revert logic
  },
)
