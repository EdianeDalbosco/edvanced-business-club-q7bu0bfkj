migrate(
  (app) => {
    // 1. Desabilitar requireEmailVerification na coleção de usuários caso exista ou garantir que auto-verificação esteja consistente
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"

    // Salva a coleção
    app.save(users)

    // 2. Garantir que todos os usuários existentes estejam verificados
    app
      .db()
      .newQuery('UPDATE users SET verified = 1 WHERE verified = 0 OR verified IS NULL')
      .execute()
  },
  (app) => {
    // Revert
  },
)
