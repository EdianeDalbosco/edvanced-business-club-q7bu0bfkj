migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'member'],
          maxSelect: 1,
          required: false,
        }),
      )
    }
    if (!users.fields.getByName('company')) {
      users.fields.add(
        new TextField({
          name: 'company',
          required: false,
        }),
      )
    }
    if (!users.fields.getByName('phone')) {
      users.fields.add(
        new TextField({
          name: 'phone',
          required: false,
        }),
      )
    }
    if (!users.fields.getByName('bio')) {
      users.fields.add(
        new TextField({
          name: 'bio',
          required: false,
        }),
      )
    }
    // Public list/view rule for users directory, self/admin update
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('role')
    users.fields.removeByName('company')
    users.fields.removeByName('phone')
    users.fields.removeByName('bio')
    app.save(users)
  },
)
