migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('instagram')) {
      users.fields.add(
        new TextField({
          name: 'instagram',
          required: false,
        }),
      )
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('instagram')
    app.save(users)
  },
)
