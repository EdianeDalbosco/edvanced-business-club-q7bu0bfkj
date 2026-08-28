migrate(
  (app) => {
    const meetingsCol = app.findCollectionByNameOrId('meetings')

    const materials = new Collection({
      name: 'materials',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['photo', 'video', 'document'],
          maxSelect: 1,
          required: true,
        },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 52428800, required: false },
        { name: 'url', type: 'url', required: false },
        { name: 'description', type: 'text', required: false },
        {
          name: 'meeting',
          type: 'relation',
          collectionId: meetingsCol.id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_materials_meeting ON materials (meeting)',
        'CREATE INDEX idx_materials_type ON materials (type)',
      ],
    })
    app.save(materials)
  },
  (app) => {
    const materials = app.findCollectionByNameOrId('materials')
    app.delete(materials)
  },
)
