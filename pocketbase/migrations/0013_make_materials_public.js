migrate(
  (app) => {
    const materials = app.findCollectionByNameOrId('materials')
    materials.listRule = ''
    materials.viewRule = ''
    app.save(materials)
  },
  (app) => {
    const materials = app.findCollectionByNameOrId('materials')
    materials.listRule = "@request.auth.id != ''"
    materials.viewRule = "@request.auth.id != ''"
    app.save(materials)
  },
)
