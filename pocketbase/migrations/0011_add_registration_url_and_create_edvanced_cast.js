migrate(
  (app) => {
    // 1. Add registration_url field to meetings collection
    const meetingsCol = app.findCollectionByNameOrId('meetings')
    if (!meetingsCol.fields.getByName('registration_url')) {
      meetingsCol.fields.add(
        new URLField({
          name: 'registration_url',
        }),
      )
      app.save(meetingsCol)
    }

    // 2. Create edvanced_cast collection for podcast episodes
    try {
      app.findCollectionByNameOrId('edvanced_cast')
    } catch (_) {
      const castCol = new Collection({
        name: 'edvanced_cast',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'video_url', type: 'url', required: true },
          { name: 'thumbnail_url', type: 'url' },
          {
            name: 'cover_image',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'episode_number', type: 'number' },
          { name: 'duration', type: 'text' },
          { name: 'published_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_edvanced_cast_published ON edvanced_cast (published_at DESC)',
          'CREATE INDEX idx_edvanced_cast_created ON edvanced_cast (created DESC)',
        ],
      })
      app.save(castCol)
    }
  },
  (app) => {
    try {
      const castCol = app.findCollectionByNameOrId('edvanced_cast')
      app.delete(castCol)
    } catch (_) {}

    try {
      const meetingsCol = app.findCollectionByNameOrId('meetings')
      const field = meetingsCol.fields.getByName('registration_url')
      if (field) {
        meetingsCol.fields.removeByName('registration_url')
        app.save(meetingsCol)
      }
    } catch (_) {}
  },
)
