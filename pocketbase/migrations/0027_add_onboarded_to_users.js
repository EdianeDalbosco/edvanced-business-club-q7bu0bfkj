migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('onboarded')) {
      users.fields.add(
        new BoolField({
          name: 'onboarded',
          required: false,
        }),
      )
      app.save(users)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = users.fields.getByName('onboarded')
    if (field) {
      users.fields.removeByName('onboarded')
      app.save(users)
    }
  },
)
