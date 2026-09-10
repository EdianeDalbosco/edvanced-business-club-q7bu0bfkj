migrate(
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')

    if (!meetings.fields.getByName('price')) {
      meetings.fields.add(
        new NumberField({
          name: 'price',
          required: false,
          min: 0,
        }),
      )
    }

    app.save(meetings)
  },
  (app) => {
    try {
      const meetings = app.findCollectionByNameOrId('meetings')
      const priceField = meetings.fields.getByName('price')
      if (priceField) {
        meetings.fields.removeByName('price')
        app.save(meetings)
      }
    } catch (_) {}
  },
)
