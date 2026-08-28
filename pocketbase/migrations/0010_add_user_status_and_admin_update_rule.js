migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('status')) {
      users.fields.add(
        new SelectField({
          name: 'status',
          values: ['active', 'suspended'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Permitir que o próprio usuário atualize seu perfil OU administradores atualizem qualquer membro
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'edianedalbosco@gmail.com')"

    app.save(users)

    // Atualizar usuários existentes para status 'active' caso não tenham definido
    app
      .db()
      .newQuery("UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('status')
    users.updateRule = 'id = @request.auth.id'
    app.save(users)
  },
)
