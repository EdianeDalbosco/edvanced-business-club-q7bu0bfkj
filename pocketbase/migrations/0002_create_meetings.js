migrate(
  (app) => {
    const meetings = new Collection({
      name: 'meetings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'location', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['presencial', 'online', 'hibrido'],
          maxSelect: 1,
          required: false,
        },
        { name: 'speakers', type: 'text', required: false },
        { name: 'description', type: 'editor', required: false },
        {
          name: 'cover_image',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_meetings_date ON meetings (date DESC)'],
    })
    app.save(meetings)
  },
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')
    app.delete(meetings)
  },
)
